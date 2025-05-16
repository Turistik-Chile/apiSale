import { createClient } from 'redis';
import logger from './logger.js';

class RedisService {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      if (this.client) return;

      this.client = createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              logger.error('Redis: Máximo número de intentos de reconexión alcanzado');
              return new Error('Máximo número de intentos de reconexión alcanzado');
            }
            return Math.min(retries * 100, 3000);
          }
        }
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error('Redis Client Error:', err);
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis Client Connected');
      });

      this.client.on('reconnecting', () => {
        logger.warn('Redis Client Reconnecting...');
      });

      await this.client.connect();
    } catch (error) {
      logger.error('Redis Connection Error:', error);
      this.isConnected = false;
      throw error;
    }
  }

  async get(key) {
    try {
      if (!this.isConnected) await this.connect();
      const data = await this.client.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      logger.error('Redis Get Error:', error);
      return null;
    }
  }

  async set(key, value, options = {}) {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.set(key, JSON.stringify(value), options);
      return true;
    } catch (error) {
      logger.error('Redis Set Error:', error);
      return false;
    }
  }

  async setEx(key, seconds, value) {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.setEx(key, seconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis SetEx Error:', error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis Delete Error:', error);
      return false;
    }
  }

  async ttl(key) {
    try {
      if (!this.isConnected) await this.connect();
      return await this.client.ttl(key);
    } catch (error) {
      logger.error('Redis TTL Error:', error);
      return -2;
    }
  }

  async flushAll() {
    try {
      if (!this.isConnected) await this.connect();
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error('Redis Clear Error:', error);
      return false;
    }
  }

  async quit() {
    try {
      if (this.client) {
        await this.client.quit();
        this.isConnected = false;
        this.client = null;
      }
    } catch (error) {
      logger.error('Redis Quit Error:', error);
    }
  }
}

const redisService = new RedisService();

// Iniciar conexión
redisService.connect().catch(err => {
  logger.error('Error inicial conectando a Redis:', err);
});

export default redisService; 