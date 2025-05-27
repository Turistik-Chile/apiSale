import { Router } from 'express';
import { body } from 'express-validator';
import { addToCart } from '../controllers/cartController.js';

const router = Router();

// Validaciones para addToCart
const addToCartValidation = [
  body('tourCode').notEmpty().withMessage('El código del tour es requerido'),
  body('serviceDate')
    .notEmpty()
    .withMessage('La fecha del servicio es requerida')
    .matches(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/)
    .withMessage('La fecha debe estar en formato ISO (yyyy-MM-ddThh:mm:ss)'),
  body('startTime')
    .notEmpty()
    .withMessage('La hora de inicio es requerida')
    .matches(/^\d{2}:\d{2}:\d{2}$/)
    .withMessage('La hora debe estar en formato HH:mm:ss'),
  body('meetingPointId')
    .optional()
    .isInt()
    .withMessage('El ID del punto de encuentro debe ser un número entero'),
  body('pickupLocationId')
    .optional()
    .isUUID()
    .withMessage('El ID del punto de recogida debe ser un UUID válido'),
  body('ageGroups')
    .isArray()
    .withMessage('Los grupos de edad deben ser un array')
    .notEmpty()
    .withMessage('Debe especificar al menos un grupo de edad'),
  body('ageGroups.*.idItemEcommerce')
    .notEmpty()
    .withMessage('El ID del item es requerido para cada grupo de edad'),
  body('ageGroups.*.ageGroupCode')
    .notEmpty()
    .withMessage('El código del grupo de edad es requerido para cada grupo'),
  body('ageGroups.*.quantity')
    .isInt({ min: 1 })
    .withMessage('La cantidad debe ser un número entero mayor a cero para cada grupo')
];

// Rutas del carrito
router.post('/addToCart', addToCartValidation, addToCart);

export default router; 