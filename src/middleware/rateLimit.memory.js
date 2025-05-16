import logger from '../config/logger.js';

class MemoryStore {
  constructor() {
    this.attempts = new Map();
    this.blocks = new Map();
  }

  // Limpiar entradas antiguas cada hora
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.attempts.entries()) {
      if (now > value.timestamp + (60 * 60 * 1000)) { // 1 hora
        this.attempts.delete(key);
      }
    }
    for (const [key, value] of this.blocks.entries()) {
      if (now > value.timestamp + (15 * 60 * 1000)) { // 15 minutos
        this.blocks.delete(key);
      }
    }
  }

  getAttempts(key) {
    const data = this.attempts.get(key);
    if (!data) return 0;
    if (Date.now() > data.timestamp + (60 * 60 * 1000)) {
      this.attempts.delete(key);
      return 0;
    }
    return data.attempts;
  }

  incrementAttempts(key) {
    const current = this.getAttempts(key);
    this.attempts.set(key, {
      attempts: current + 1,
      timestamp: Date.now()
    });
    return current + 1;
  }

  setBlock(key) {
    this.blocks.set(key, {
      timestamp: Date.now()
    });
  }

  getBlock(key) {
    const data = this.blocks.get(key);
    if (!data) return null;
    
    const timeLeft = Math.ceil((data.timestamp + (15 * 60 * 1000) - Date.now()) / 1000);
    if (timeLeft <= 0) {
      this.blocks.delete(key);
      return null;
    }
    return timeLeft;
  }

  clearAttempts(key) {
    this.attempts.delete(key);
    this.blocks.delete(key);
  }
}

const store = new MemoryStore();

// Limpiar el store cada hora
setInterval(() => store.cleanup(), 60 * 60 * 1000);

const MAX_ATTEMPTS = 5;

export const loginAttemptLimiter = async (req, res, next) => {
  const ip = req.ip;
  const email = req.body.email;
  if (!email) return next();

  const key = `${ip}:${email}`;

  try {
    // Verificar si está bloqueado
    const blockTimeLeft = store.getBlock(key);
    if (blockTimeLeft) {
      return res.status(429).json({
        message: 'Demasiados intentos fallidos',
        timeLeft: blockTimeLeft,
        minutesLeft: Math.ceil(blockTimeLeft / 60),
      });
    }

    // Obtener intentos actuales
    const attempts = store.getAttempts(key);

    // Almacenar información para uso posterior
    req.loginAttempts = {
      key,
      attempts,
    };

    next();
  } catch (error) {
    logger.error('Error en rate limit:', error);
    next();
  }
};

export const handleFailedLogin = async (req) => {
  if (!req.loginAttempts) return;

  const { key, attempts } = req.loginAttempts;
  try {
    const newAttempts = store.incrementAttempts(key);

    if (newAttempts >= MAX_ATTEMPTS) {
      store.setBlock(key);
      store.clearAttempts(key);
      logger.warn(`Usuario bloqueado: ${key}`);
    } else {
      logger.info(`Intento fallido ${newAttempts}/${MAX_ATTEMPTS} para ${key}`);
    }
  } catch (error) {
    logger.error('Error manejando login fallido:', error);
  }
};

export const handleSuccessfulLogin = async (req) => {
  if (!req.loginAttempts) return;

  const { key } = req.loginAttempts;
  try {
    store.clearAttempts(key);
    logger.info(`Login exitoso: intentos reseteados para ${key}`);
  } catch (error) {
    logger.error('Error limpiando intentos de login:', error);
  }
}; 