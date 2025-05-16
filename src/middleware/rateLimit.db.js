import logger from '../config/logger.js';
import { LoginAttemptService } from '../services/loginAttempt.service.js';

const MAX_ATTEMPTS = 5;

export const loginAttemptLimiter = async (req, res, next) => {
  const ip = req.ip;
  const email = req.body.email;
  if (!email) return next();

  try {
    const attempt = await LoginAttemptService.getAttempts(ip, email);
    
    if (attempt?.blockedUntil && attempt.blockedUntil > new Date()) {
      const timeLeft = Math.ceil((attempt.blockedUntil.getTime() - Date.now()) / 1000);
      return res.status(429).json({
        message: 'Demasiados intentos fallidos',
        timeLeft,
        minutesLeft: Math.ceil(timeLeft / 60),
        blockedUntil: attempt.blockedUntil
      });
    }

    // Almacenar información para uso posterior
    req.loginAttempts = {
      ip,
      email,
      attempts: attempt?.attempts || 0
    };

    next();
  } catch (error) {
    logger.error('Error en rate limit:', error);
    next();
  }
};

export const handleFailedLogin = async (req) => {
  if (!req.loginAttempts) return;

  const { ip, email } = req.loginAttempts;
  try {
    await LoginAttemptService.incrementAttempts(ip, email);
  } catch (error) {
    logger.error('Error manejando login fallido:', error);
  }
};

export const handleSuccessfulLogin = async (req) => {
  if (!req.loginAttempts) return;

  const { ip, email } = req.loginAttempts;
  try {
    await LoginAttemptService.clearAttempts(ip, email);
  } catch (error) {
    logger.error('Error limpiando intentos de login:', error);
  }
};

// Limpiar intentos antiguos cada hora
setInterval(() => {
  LoginAttemptService.cleanupOldAttempts()
    .catch(error => logger.error('Error en limpieza programada:', error));
}, 60 * 60 * 1000); 