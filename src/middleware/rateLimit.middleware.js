import redisService from '../config/redis.js';
import logger from '../config/logger.js';

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15 * 60; // 15 minutos en segundos
const ATTEMPT_EXPIRATION = 60 * 60; // 1 hora en segundos

export const loginAttemptLimiter = async (req, res, next) => {
  const ip = req.ip;
  const email = req.body.email;
  if (!email) return next();

  const key = `login:${ip}:${email}`;
  const blockKey = `loginBlock:${ip}:${email}`;

  try {
    // Verificar si está bloqueado
    const isBlocked = await redisService.get(blockKey);
    if (isBlocked) {
      const timeLeft = await redisService.ttl(blockKey);
      return res.status(429).json({
        message: 'Demasiados intentos fallidos',
        timeLeft: timeLeft,
        minutesLeft: Math.ceil(timeLeft / 60),
      });
    }

    // Obtener intentos actuales
    let attempts = await redisService.get(key);
    attempts = attempts ? parseInt(attempts) : 0;

    // Almacenar el intento actual en Redis
    req.loginAttempts = {
      key,
      blockKey,
      attempts,
    };

    next();
  } catch (error) {
    logger.error('Error en rate limit:', error);
    // En caso de error con Redis, permitimos el acceso pero lo registramos
    next();
  }
};

export const handleFailedLogin = async (req) => {
  if (!req.loginAttempts) return;

  const { key, blockKey, attempts } = req.loginAttempts;
  const newAttempts = attempts + 1;

  try {
    if (newAttempts >= MAX_ATTEMPTS) {
      // Bloquear por BLOCK_DURATION segundos
      await redisService.setEx(blockKey, BLOCK_DURATION, '1');
      // Resetear contador de intentos
      await redisService.del(key);
      logger.warn(`Usuario bloqueado: ${key}`);
    } else {
      // Incrementar contador de intentos
      await redisService.setEx(key, ATTEMPT_EXPIRATION, newAttempts);
      logger.info(`Intento fallido ${newAttempts}/${MAX_ATTEMPTS} para ${key}`);
    }
  } catch (error) {
    logger.error('Error manejando login fallido:', error);
  }
};

export const handleSuccessfulLogin = async (req) => {
  if (!req.loginAttempts) return;

  const { key, blockKey } = req.loginAttempts;

  try {
    // Eliminar intentos y bloqueo al lograr un login exitoso
    await Promise.all([
      redisService.del(key),
      redisService.del(blockKey)
    ]);
    logger.info(`Login exitoso: intentos reseteados para ${key}`);
  } catch (error) {
    logger.error('Error limpiando intentos de login:', error);
  }
}; 