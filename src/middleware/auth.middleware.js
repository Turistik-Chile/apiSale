import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'tu_super_secreto_temporal';

export const authMiddleware = async (req, res, next) => {
  try {
    // Verificar si existe el token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'No autorizado - Token no proporcionado'
      });
    }

    // Extraer y verificar el token
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar si el usuario existe
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true
      }
    });

    if (!user) {
      return res.status(401).json({
        message: 'No autorizado - Usuario no existe'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      userId: user.id,
      role: user.role
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: 'No autorizado - Token expirado'
      });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        message: 'No autorizado - Token inválido'
      });
    }
    console.error('Error en autenticación:', error);
    res.status(500).json({
      message: 'Error en la autenticación',
      error: error.message
    });
  }
};

export const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({
      message: 'Acceso denegado - Se requieren privilegios de administrador'
    });
  }
  next();
}; 