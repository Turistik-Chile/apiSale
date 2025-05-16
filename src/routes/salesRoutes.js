import express from 'express';
import { body } from 'express-validator';
import { createSale, updateSale, cancelFullSale, updatePaxQuantity } from '../controllers/salesController.js';

const router = express.Router();

// Validaciones para la creación de una venta
const createSaleValidations = [
  // Provider validations
  body('provider.name').notEmpty().withMessage('El nombre del proveedor es requerido'),

  // Customer validations
  body('custommer.name').notEmpty().withMessage('El nombre es requerido'),
  body('custommer.lastName').notEmpty().withMessage('El apellido es requerido'),
  body('custommer.email').isEmail().withMessage('Email inválido'),
  body('custommer.phoneNumber').notEmpty().withMessage('El número de teléfono es requerido'),
  body('custommer.country').notEmpty().isLength({ min: 2, max: 2 }).withMessage('El país debe ser un código de 2 letras'),
  body('custommer.city').notEmpty().withMessage('La ciudad es requerida'),
  body('custommer.idioma').notEmpty().withMessage('El idioma es requerido'),
  body('custommer.date').isISO8601().withMessage('La fecha debe estar en formato ISO8601'),
  body('custommer.time').matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).withMessage('La hora debe estar en formato HH:MM:SS'),
  body('custommer.qtypax').isInt({ min: 1 }).withMessage('La cantidad de pasajeros debe ser un número entero positivo'),
  body('custommer.opt').notEmpty().withMessage('La opción es requerida'),
  body('custommer.total').isFloat({ min: 0 }).withMessage('El total debe ser un número positivo'),
  
  // Cart items validations
  body('custommer.itemsCart').isArray({ min: 1 }).withMessage('Debe incluir al menos un item en el carrito'),
  body('custommer.itemsCart.*.idItemEcommerce').notEmpty().isUUID().withMessage('idItemEcommerce debe ser un UUID válido')
];

// Validaciones para actualizar datos del cliente
const updateSaleValidations = [
  body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('lastName').optional().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('email').optional().isEmail().withMessage('Email inválido'),
  body('phoneNumber').optional().notEmpty().withMessage('El número de teléfono no puede estar vacío'),
  body('country').optional().isLength({ min: 2, max: 2 }).withMessage('El país debe ser un código de 2 letras'),
  body('city').optional().notEmpty().withMessage('La ciudad no puede estar vacía'),
  body('idioma').optional().notEmpty().withMessage('El idioma no puede estar vacío'),
  body('date').optional().isISO8601().withMessage('La fecha debe estar en formato ISO8601'),
  body('time').optional().matches(/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/).withMessage('La hora debe estar en formato HH:MM:SS')
];

// Validaciones para actualizar cantidad de pasajeros
const updatePaxValidations = [
  body('qtypax').isInt({ min: 1 }).withMessage('La cantidad de pasajeros debe ser un número entero positivo'),
  body('reason').optional().isString().withMessage('La razón debe ser texto')
];

// Validaciones para cancelar venta
const cancelSaleValidations = [
  body('reason').optional().isString().withMessage('La razón debe ser texto')
];

// Rutas
router.post('/', createSaleValidations, createSale);
router.put('/provider/:idSaleProvider', updateSaleValidations, updateSale);
router.put('/provider/:idSaleProvider/pax', updatePaxValidations, updatePaxQuantity);
router.post('/provider/:idSaleProvider/cancel', cancelSaleValidations, cancelFullSale);

export default router; 