import { body, param } from 'express-validator';
import { validateResult } from '../../helpers/validateHelper.js';

export const productValidator = [
    body('name')
        .exists().withMessage('El nombre es requerido')
        .notEmpty().withMessage('El nombre no puede estar vacío')
        .isString().withMessage('El nombre debe ser texto'),
    
    body('description')
        .exists().withMessage('La descripción es requerida')
        .notEmpty().withMessage('La descripción no puede estar vacía')
        .isString().withMessage('La descripción debe ser texto'),
    
    body('type')
        .exists().withMessage('El tipo es requerido')
        .notEmpty().withMessage('El tipo no puede estar vacío')
        .isString().withMessage('El tipo debe ser texto'),
    
    body('priceUSD')
        .exists().withMessage('El precio en USD es requerido')
        .notEmpty().withMessage('El precio en USD no puede estar vacío')
        .isFloat({ min: 0 }).withMessage('El precio en USD debe ser un número positivo'),
    
    body('priceCLP')
        .exists().withMessage('El precio en CLP es requerido')
        .notEmpty().withMessage('El precio en CLP no puede estar vacío')
        .isFloat({ min: 0 }).withMessage('El precio en CLP debe ser un número positivo'),
    
    body('priceBRL')
        .exists().withMessage('El precio en BRL es requerido')
        .notEmpty().withMessage('El precio en BRL no puede estar vacío')
        .isFloat({ min: 0 }).withMessage('El precio en BRL debe ser un número positivo'),
    
    body('stock')
        .exists().withMessage('El stock es requerido')
        .notEmpty().withMessage('El stock no puede estar vacío')
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
    
    body('imageUrl')
        .optional()
        .isURL().withMessage('La URL de la imagen debe ser válida'),
    
    (req, res, next) => {
        validateResult(req, res, next);
    }
];

export const updateProductValidator = [
    body('name')
        .optional()
        .notEmpty().withMessage('El nombre no puede estar vacío')
        .isString().withMessage('El nombre debe ser texto'),
    
    body('description')
        .optional()
        .notEmpty().withMessage('La descripción no puede estar vacía')
        .isString().withMessage('La descripción debe ser texto'),
    
    body('type')
        .optional()
        .notEmpty().withMessage('El tipo no puede estar vacío')
        .isString().withMessage('El tipo debe ser texto'),
    
    body('priceUSD')
        .optional()
        .notEmpty().withMessage('El precio en USD no puede estar vacío')
        .isFloat({ min: 0 }).withMessage('El precio en USD debe ser un número positivo'),
    
    body('priceCLP')
        .optional()
        .notEmpty().withMessage('El precio en CLP no puede estar vacío')
        .isFloat({ min: 0 }).withMessage('El precio en CLP debe ser un número positivo'),
    
    body('priceBRL')
        .optional()
        .notEmpty().withMessage('El precio en BRL no puede estar vacío')
        .isFloat({ min: 0 }).withMessage('El precio en BRL debe ser un número positivo'),
    
    body('stock')
        .optional()
        .notEmpty().withMessage('El stock no puede estar vacío')
        .isInt({ min: 0 }).withMessage('El stock debe ser un número entero positivo'),
    
    body('imageUrl')
        .optional()
        .isURL().withMessage('La URL de la imagen debe ser válida'),
    
    (req, res, next) => {
        validateResult(req, res, next);
    }
]; 