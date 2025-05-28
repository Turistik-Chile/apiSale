import { body } from 'express-validator';
import { validateResult } from '../utils/validator.js';

export const registerValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida')
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
  body('name')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]{2,50}$/).withMessage('El nombre solo puede contener letras y espacios')
    .escape(),
  validateResult
];

export const loginValidator = [
  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('La contraseña es requerida'),
  validateResult
];

export const updateUserValidator = [
  body('email')
    .optional()
    .trim()
    .isEmail().withMessage('Debe ser un email válido')
    .normalizeEmail(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 }).withMessage('El nombre debe tener entre 2 y 50 caracteres')
    .matches(/^[a-zA-ZÀ-ÿ\s]{2,50}$/).withMessage('El nombre solo puede contener letras y espacios')
    .escape(),
  body('currentPassword')
    .if(body('password').exists())
    .notEmpty().withMessage('La contraseña actual es requerida para cambiar la contraseña'),
  body('password')
    .optional()
    .isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula, un número y un carácter especial'),
  validateResult
]; 