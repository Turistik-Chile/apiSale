import express from 'express';
import { body } from 'express-validator';
import { createSale, updateSale, cancelFullSale, updatePaxQuantity } from '../controllers/salesController.js';
import { basicAuth } from '../middleware/basicAuth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Sale:
 *       type: object
 *       required:
 *         - provider
 *         - custommer
 *       properties:
 *         provider:
 *           type: object
 *           required:
 *             - name
 *           properties:
 *             name:
 *               type: string
 *               description: Nombre del proveedor (máximo 100 caracteres)
 *               example: "cyt"
 *               maxLength: 100
 *         custommer:
 *           type: object
 *           required:
 *             - idSaleProvider
 *             - name
 *             - lastName
 *             - email
 *             - phoneNumber
 *             - country
 *             - city
 *             - idioma
 *             - date
 *             - time
 *             - qtypax
 *             - opt
 *             - total
 *             - itemsCart
 *           properties:
 *             idSaleProvider:
 *               type: string
 *               description: ID único de la venta asignado por el proveedor (máximo 100 caracteres)
 *               example: "213e1221"
 *               maxLength: 100
 *             name:
 *               type: string
 *               description: Nombre del cliente (máximo 100 caracteres)
 *               example: "Elvis"
 *               maxLength: 100
 *             lastName:
 *               type: string
 *               description: Apellido del cliente (máximo 100 caracteres)
 *               example: "Santeliz"
 *               maxLength: 100
 *             email:
 *               type: string
 *               format: email
 *               description: Email del cliente (máximo 255 caracteres)
 *               example: "esanteliz@turistik.com"
 *               maxLength: 255
 *             phoneNumber:
 *               type: string
 *               description: Teléfono del cliente (máximo 20 caracteres)
 *               example: "+56988889999"
 *               maxLength: 20
 *             country:
 *               type: string
 *               description: Código ISO del país (exactamente 2 letras, ejemplo CL=Chile, VE=Venezuela, etc)
 *               example: "CL"
 *               minLength: 2
 *               maxLength: 2
 *               pattern: "^[A-Z]{2}$"
 *             city:
 *               type: string
 *               description: Ciudad (máximo 100 caracteres)
 *               example: "Santiago"
 *               maxLength: 100
 *             idioma:
 *               type: string
 *               description: Idioma del cliente (máximo 50 caracteres)
 *               example: "español"
 *               maxLength: 50
 *             date:
 *               type: string
 *               format: date
 *               description: Fecha de la venta (formato YYYY-MM-DD)
 *               example: "2025-05-15"
 *               pattern: "^\\d{4}-\\d{2}-\\d{2}$"
 *             time:
 *               type: string
 *               description: Hora en formato HH:MM:SS (24 horas)
 *               example: "14:00:00"
 *               pattern: "^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$"
 *             qtypax:
 *               type: integer
 *               minimum: 1
 *               description: Cantidad de pasajeros (mínimo 1)
 *               example: 2
 *             opt:
 *               type: string
 *               description: Opción seleccionada (máximo 100 caracteres)
 *               example: "Tour Ciudad"
 *               maxLength: 100
 *             total:
 *               type: number
 *               description: Total de la venta (máximo 2 decimales)
 *               example: 10000.90
 *               minimum: 0
 *             itemsCart:
 *               type: array
 *               description: Lista de items en el carrito
 *               minItems: 1
 *               items:
 *                 type: object
 *                 required:
 *                   - idItemEcommerce
 *                 properties:
 *                   idItemEcommerce:
 *                     type: string
 *                     format: uuid
 *                     description: ID del item del ecommerce (UUID v4)
 *                     example: "8fc92a28-e13d-41fd-b6a8-8974d4fb55ec"
 *                     pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
 *       example:
 *         provider:
 *           name: "cyt"
 *         custommer:
 *           idSaleProvider: "213e1221"
 *           name: "Elvis"
 *           lastName: "Santeliz"
 *           email: "esanteliz@turistik.com"
 *           phoneNumber: "+56988889999"
 *           country: "CL"
 *           city: "Santiago"
 *           idioma: "español"
 *           date: "2025-05-15"
 *           time: "14:00:00"
 *           qtypax: 2
 *           opt: "Tour Ciudad"
 *           total: 10000.90
 *           itemsCart:
 *             - idItemEcommerce: "8fc92a28-e13d-41fd-b6a8-8974d4fb55ec"
 */

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

/**
 * @swagger
 * /sales:
 *   post:
 *     summary: Crear una nueva venta
 *     tags: [Sales]
 *     security:
 *       - basicAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Sale'
 *     responses:
 *       201:
 *         description: Venta creada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Venta creada exitosamente"
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "TUR-20250515-ABC1"
 *                     ProviderName:
 *                       type: string
 *                       example: "cyt"
 *                     Status:
 *                       type: string
 *                       example: "PROCESSING"
 *                     QtyPax:
 *                       type: integer
 *                       example: 14
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: No autorizado
 *       409:
 *         description: Conflicto - ID de venta duplicado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Ya existe una venta registrada con este ID de proveedor"
 *                 error:
 *                   type: string
 *                   example: "DUPLICATE_PROVIDER_SALE_ID"
 *                 saleId:
 *                   type: string
 *                   example: "TUR-20250515-ABC1"
 */
router.post('/', basicAuth, createSaleValidations, createSale);

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

/**
 * @swagger
 * /sales/{id}:
 *   put:
 *     summary: Actualizar datos de una venta
 *     tags: [Sales]
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta (puede ser idSaleProvider o secureId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Elvis"
 *               lastName:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Santeliz"
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 example: "esanteliz@turistik.com"
 *               phoneNumber:
 *                 type: string
 *                 maxLength: 20
 *                 example: "+56988889999"
 *               country:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 2
 *                 pattern: "^[A-Z]{2}$"
 *                 example: "CL"
 *               city:
 *                 type: string
 *                 maxLength: 100
 *                 example: "Santiago"
 *               idioma:
 *                 type: string
 *                 maxLength: 50
 *                 example: "español"
 *               date:
 *                 type: string
 *                 format: date
 *                 pattern: "^\\d{4}-\\d{2}-\\d{2}$"
 *                 example: "2025-05-15"
 *               time:
 *                 type: string
 *                 description: Hora en formato HH:MM:SS (24 horas, obligatorio incluir segundos)
 *                 pattern: "^([01]\\d|2[0-3]):([0-5]\\d):([0-5]\\d)$"
 *                 example: "14:00:00"
 *     responses:
 *       200:
 *         description: Venta actualizada exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Venta actualizada exitosamente"
 *                 data:
 *                   $ref: '#/components/schemas/Sale'
 *       400:
 *         description: Datos inválidos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Formato de hora inválido. Debe ser HH:MM:SS (24 horas)"
 *                 error:
 *                   type: string
 *                   example: "INVALID_TIME_FORMAT"
 *             examples:
 *               invalidTime:
 *                 value:
 *                   message: "Formato de hora inválido. Debe ser HH:MM:SS (24 horas)"
 *                   error: "INVALID_TIME_FORMAT"
 *               invalidData:
 *                 value:
 *                   errors: [
 *                     {
 *                       msg: "La hora debe estar en formato HH:MM:SS",
 *                       param: "time",
 *                       location: "body"
 *                     }
 *                   ]
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Venta no encontrada
 */
router.put('/:id', basicAuth, updateSaleValidations, updateSale);

// Validaciones para actualizar cantidad de pasajeros
const updatePaxValidations = [
  body('qtypax').isInt({ min: 1 }).withMessage('La cantidad de pasajeros debe ser un número entero positivo'),
  body('reason').optional().isString().withMessage('La razón debe ser texto')
];

/**
 * @swagger
 * /sales/{id}/pax:
 *   put:
 *     summary: Actualizar cantidad de pasajeros
 *     tags: [Sales]
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta (puede ser idSaleProvider o secureId)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - qtypax
 *             properties:
 *               qtypax:
 *                 type: integer
 *                 description: Cantidad de pasajeros a cancelar
 *               reason:
 *                 type: string
 *                 description: Razón de la cancelación
 *     responses:
 *       200:
 *         description: Cantidad de pasajeros actualizada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Venta no encontrada
 */
router.put('/:id/pax', basicAuth, updatePaxValidations, updatePaxQuantity);

// Validaciones para cancelar venta
const cancelSaleValidations = [
  body('reason').optional().isString().withMessage('La razón debe ser texto')
];

/**
 * @swagger
 * /sales/{id}/cancel:
 *   post:
 *     summary: Cancelar una venta
 *     tags: [Sales]
 *     security:
 *       - basicAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la venta (puede ser idSaleProvider o secureId)
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 description: Razón de la cancelación
 *     responses:
 *       200:
 *         description: Venta cancelada exitosamente
 *       400:
 *         description: Datos inválidos
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Venta no encontrada
 */
router.post('/:id/cancel', basicAuth, cancelSaleValidations, cancelFullSale);

export default router; 