import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import hpp from 'hpp';

// Rate limiting
export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // límite de 100 peticiones por ventana por IP
});

// Configuración de Helmet
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"]
    }
  }
});

// Prevención de polución de parámetros
export const hppProtection = hpp(); 