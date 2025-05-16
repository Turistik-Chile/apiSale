import { body } from 'express-validator';
import { validateResult } from '../../helpers/validateHelper.js';

export const ventaValidator = [
    body('idVenta')
        .exists().withMessage('El ID de venta es requerido')
        .notEmpty().withMessage('El ID de venta no puede estar vacío')
        .isString().withMessage('El ID de venta debe ser texto'),

    body('tipoTransaccion')
        .exists().withMessage('El tipo de transacción es requerido')
        .notEmpty().withMessage('El tipo de transacción no puede estar vacío')
        .isIn(['Arriendo', 'Devolucion']).withMessage('El tipo de transacción debe ser Arriendo o Devolucion'),

    body('estadoVenta')
        .exists().withMessage('El estado de venta es requerido')
        .notEmpty().withMessage('El estado de venta no puede estar vacío')
        .isIn(['Finalizada', 'Parcial']).withMessage('El estado de venta debe ser Finalizada o Parcial'),

    body('fecha')
        .exists().withMessage('La fecha es requerida')
        .notEmpty().withMessage('La fecha no puede estar vacía')
        .isISO8601().withMessage('La fecha debe tener un formato válido'),

    body('tipoMoneda')
        .exists().withMessage('El tipo de moneda es requerido')
        .notEmpty().withMessage('El tipo de moneda no puede estar vacío')
        .isIn(['USD', 'CLP', 'BRL']).withMessage('El tipo de moneda debe ser USD, CLP o BRL'),

    body('medioPago')
        .exists().withMessage('El medio de pago es requerido')
        .notEmpty().withMessage('El medio de pago no puede estar vacío')
        .isString().withMessage('El medio de pago debe ser texto'),

    body('total')
        .exists().withMessage('El total es requerido')
        .isFloat().withMessage('El total debe ser un número'),

    body('vuelto')
        .optional()
        .isFloat({ min: 0 }).withMessage('El vuelto debe ser un número positivo'),

    body('idCliente')
        .exists().withMessage('El ID de cliente es requerido')
        .notEmpty().withMessage('El ID de cliente no puede estar vacío')
        .isString().withMessage('El ID de cliente debe ser texto'),

    body('nombreCliente')
        .exists().withMessage('El nombre del cliente es requerido')
        .notEmpty().withMessage('El nombre del cliente no puede estar vacío')
        .isString().withMessage('El nombre del cliente debe ser texto'),

    body('email')
        .exists().withMessage('El email es requerido')
        .notEmpty().withMessage('El email no puede estar vacío')
        .isEmail().withMessage('El email debe tener un formato válido'),

    body('telefono')
        .exists().withMessage('El teléfono es requerido')
        .notEmpty().withMessage('El teléfono no puede estar vacío')
        .matches(/^\+?[0-9]{8,15}$/).withMessage('El teléfono debe tener un formato válido'),

    body('dni')
        .exists().withMessage('El DNI es requerido')
        .notEmpty().withMessage('El DNI no puede estar vacío')
        .matches(/^[0-9]{7,9}-[0-9kK]$/).withMessage('El DNI debe tener un formato válido (ej: 12345678-9)'),

    body('idVendedor')
        .exists().withMessage('El ID de vendedor es requerido')
        .notEmpty().withMessage('El ID de vendedor no puede estar vacío')
        .isString().withMessage('El ID de vendedor debe ser texto'),

    body('idVentaRelacionada')
        .optional()
        .isString().withMessage('El ID de venta relacionada debe ser texto'),

    body('datosArriendo')
        .if(body('tipoTransaccion').equals('Arriendo'))
        .exists().withMessage('Los datos de arriendo son requeridos para arriendos')
        .isObject().withMessage('Los datos de arriendo deben ser un objeto'),

    body('datosArriendo.fechaArriendo')
        .if(body('tipoTransaccion').equals('Arriendo'))
        .exists().withMessage('La fecha de arriendo es requerida')
        .isISO8601().withMessage('La fecha de arriendo debe tener un formato válido'),

    body('datosArriendo.fechaEntrega')
        .if(body('tipoTransaccion').equals('Arriendo'))
        .exists().withMessage('La fecha de entrega es requerida')
        .isISO8601().withMessage('La fecha de entrega debe tener un formato válido')
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.datosArriendo.fechaArriendo)) {
                throw new Error('La fecha de entrega debe ser posterior a la fecha de arriendo');
            }
            return true;
        }),

    body('datosArriendo.patente')
        .if(body('tipoTransaccion').equals('Arriendo'))
        .exists().withMessage('La patente es requerida')
        .matches(/^[A-Z]{2}-[A-Z]{2}-\d{2}$/).withMessage('La patente debe tener un formato válido (ej: BB-CC-22)'),

    body('detalleVenta')
        .exists().withMessage('El detalle de venta es requerido')
        .isArray().withMessage('El detalle de venta debe ser un array')
        .notEmpty().withMessage('El detalle de venta no puede estar vacío'),

    body('detalleVenta.*.idDetalle')
        .exists().withMessage('El ID de detalle es requerido')
        .isInt({ min: 1 }).withMessage('El ID de detalle debe ser un número entero positivo'),

    body('detalleVenta.*.idProducto')
        .exists().withMessage('El ID de producto es requerido')
        .notEmpty().withMessage('El ID de producto no puede estar vacío')
        .isString().withMessage('El ID de producto debe ser texto'),

    body('detalleVenta.*.descripcionProducto')
        .exists().withMessage('La descripción del producto es requerida')
        .notEmpty().withMessage('La descripción del producto no puede estar vacía')
        .isString().withMessage('La descripción del producto debe ser texto'),

    body('detalleVenta.*.precioUnitario')
        .exists().withMessage('El precio unitario es requerido')
        .isFloat({ min: 0 }).withMessage('El precio unitario debe ser un número positivo'),

    body('detalleVenta.*.cantidad')
        .exists().withMessage('La cantidad es requerida')
        .isInt({ min: 1 }).withMessage('La cantidad debe ser un número entero positivo'),

    body('detalleVenta.*.precioTotal')
        .exists().withMessage('El precio total es requerido')
        .isFloat().withMessage('El precio total debe ser un número')
        .custom((value, { req }) => {
            const detalle = req.body.detalleVenta.find(d => d.precioTotal === value);
            if (detalle && value !== detalle.precioUnitario * detalle.cantidad) {
                throw new Error('El precio total no coincide con el cálculo de precio unitario * cantidad');
            }
            return true;
        }),

    body('detalleVenta.*.cantidadDevuelta')
        .if(body('tipoTransaccion').equals('Devolucion'))
        .exists().withMessage('La cantidad devuelta es requerida para devoluciones')
        .isInt({ min: 1 }).withMessage('La cantidad devuelta debe ser un número entero positivo'),

    body('detalleVenta.*.estadoProducto')
        .if(body('tipoTransaccion').equals('Devolucion'))
        .exists().withMessage('El estado del producto es requerido para devoluciones')
        .isIn(['Bueno', 'Regular', 'Malo']).withMessage('El estado del producto debe ser Bueno, Regular o Malo'),

    body('detalleVenta.*.observacion')
        .optional()
        .isString().withMessage('La observación debe ser texto'),

    (req, res, next) => {
        validateResult(req, res, next);
    }
]; 