import { PrismaClient } from '@prisma/client';
import logger from '../config/logger.js';

const prisma = new PrismaClient();

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION = 15; // 15 minutos

export class LoginAttemptService {
  static async getAttempts(ip, email) {
    try {
      const attempt = await prisma.loginAttempt.findUnique({
        where: {
          ip_email: {
            ip,
            email
          }
        }
      });

      if (!attempt) return null;

      // Si el bloqueo ha expirado, resetear los intentos
      if (attempt.blockedUntil && attempt.blockedUntil < new Date()) {
        await prisma.loginAttempt.update({
          where: { id: attempt.id },
          data: {
            attempts: 0,
            blockedUntil: null
          }
        });
        return null;
      }

      return attempt;
    } catch (error) {
      logger.error('Error obteniendo intentos de login:', error);
      return null;
    }
  }

  static async incrementAttempts(ip, email, userId = null) {
    try {
      const now = new Date();
      const attempt = await prisma.loginAttempt.upsert({
        where: {
          ip_email: {
            ip,
            email
          }
        },
        update: {
          attempts: { increment: 1 },
          lastAttempt: now,
          blockedUntil: {
            set: (attempt) => 
              attempt.attempts + 1 >= MAX_ATTEMPTS 
                ? new Date(now.getTime() + BLOCK_DURATION * 60 * 1000)
                : null
          }
        },
        create: {
          ip,
          email,
          attempts: 1,
          lastAttempt: now,
          userId
        }
      });

      if (attempt.attempts >= MAX_ATTEMPTS) {
        logger.warn(`Usuario bloqueado: ${email} (IP: ${ip})`);
      } else {
        logger.info(`Intento fallido ${attempt.attempts}/${MAX_ATTEMPTS} para ${email} (IP: ${ip})`);
      }

      return attempt;
    } catch (error) {
      logger.error('Error incrementando intentos de login:', error);
      return null;
    }
  }

  static async clearAttempts(ip, email) {
    try {
      await prisma.loginAttempt.deleteMany({
        where: {
          ip,
          email
        }
      });
      logger.info(`Intentos de login reseteados para ${email} (IP: ${ip})`);
      return true;
    } catch (error) {
      logger.error('Error limpiando intentos de login:', error);
      return false;
    }
  }

  static async cleanupOldAttempts() {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      await prisma.loginAttempt.deleteMany({
        where: {
          AND: [
            { blockedUntil: null },
            { lastAttempt: { lt: oneHourAgo } }
          ]
        }
      });
    } catch (error) {
      logger.error('Error limpiando intentos antiguos:', error);
    }
  }
} 