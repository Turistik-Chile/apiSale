import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import salesRoutes from './routes/salesRoutes.js';
import { limiter, helmetConfig, hppProtection } from './middleware/security.middleware.js';
import { validateJson } from './middleware/validateJson.js';
import compression from 'compression';

dotenv.config();

const app = express();

// Seguridad
app.use(helmetConfig);
app.use(cors({
  origin:"*",
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(limiter);
app.use(hppProtection);
app.use(compression());

// Middleware básico
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(validateJson);

// Debug middleware en desarrollo
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });
}

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sales', salesRoutes);

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada' });
});

const PORT = process.env.PORT || 2000;

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('Routes configured:');
  
  // Auth routes
  console.log('\nAuth routes:');
  console.log('- POST /api/v1/auth/login');
  
  // Sales routes
  console.log('\nSales routes:');
  console.log('- POST /api/v1/sales (Crear venta)');
  console.log('- PUT /api/v1/sales/provider/:idSaleProvider (Actualizar venta)');
  console.log('- PUT /api/v1/sales/provider/:idSaleProvider/pax (Actualizar cantidad de pasajeros)');
  console.log('- POST /api/v1/sales/provider/:idSaleProvider/cancel (Cancelar venta)');
}); 