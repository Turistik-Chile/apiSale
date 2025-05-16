import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Valida y formatea una hora en formato HH:mm:ss
 * @param {string} timeStr - Hora en formato string
 * @returns {string} Hora formateada en HH:mm:ss
 */
const validateAndFormatTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error('Time must be a string in format HH:mm:ss or HH:mm');
  }

  const timeParts = timeStr.split(':');
  if (timeParts.length < 2 || timeParts.length > 3) {
    throw new Error('Invalid time format. Must be HH:mm:ss or HH:mm');
  }

  // Aseguramos que tenga los segundos
  if (timeParts.length === 2) {
    timeParts.push('00');
  }

  return timeParts.join(':');
};

/**
 * @typedef {Object} Provider
 * @property {string} name - Nombre del proveedor
 */

/**
 * @typedef {Object} Customer
 * @property {string} name - Nombre del cliente
 * @property {string} lastName - Apellido del cliente
 * @property {string} email - Email del cliente
 * @property {string} phoneNumber - Teléfono
 * @property {string} country - País
 * @property {string} city - Ciudad
 * @property {string} idioma - Idioma
 * @property {string} date - Fecha
 * @property {string} time - Hora
 * @property {number} qtypax - Cantidad de pasajeros
 * @property {string} opt - Opción seleccionada
 * @property {number} total - Total de la venta
 * @property {string} idSaleProvider - ID de la venta asignado por el proveedor
 * @property {ItemCart[]} itemsCart - Items del carrito
 */

/**
 * @typedef {Object} ItemCart
 * @property {string} idItemEcommerce - ID del ítem del ecommerce
 */

/**
 * @typedef {Object} SaleRequest
 * @property {Provider} provider - Información del proveedor
 * @property {Customer} custommer - Información del cliente
 */

export const createSale = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { provider, custommer } = req.body;

    // Validar que el idSaleProvider esté presente
    if (!custommer.idSaleProvider) {
      return res.status(400).json({
        message: 'El ID de venta del proveedor es requerido',
        error: 'MISSING_PROVIDER_SALE_ID'
      });
    }

    // Verificar si ya existe una venta con ese idSaleProvider
    const existingSale = await prisma.sale.findUnique({
      where: {
        idSaleProvider: custommer.idSaleProvider
      }
    });

    if (existingSale) {
      return res.status(409).json({
        message: 'Ya existe una venta registrada con este ID de proveedor',
        error: 'DUPLICATE_PROVIDER_SALE_ID',
        saleId: existingSale.Id
      });
    }

    // Crear la venta con todos sus items en una sola transacción
    const sale = await prisma.sale.create({
      data: {
        // Provider info
        ProviderName: provider.name,
        
        // Customer info
        Name: custommer.name,
        LastName: custommer.lastName,
        Email: custommer.email,
        PhoneNumber: custommer.phoneNumber,
        Country: custommer.country,
        City: custommer.city,
        Language: custommer.idioma,
        Date: new Date(custommer.date),
        Time: String(custommer.time || '00:00:00'),
        QtyPax: custommer.qtypax,
        Opt: custommer.opt,
        Total: custommer.total,
        idSaleProvider: custommer.idSaleProvider,
        
        // Cart items
        CartItems: {
          create: custommer.itemsCart.map(item => ({
            IdItemEcommerce: item.idItemEcommerce
          }))
        }
      },
      include: {
        CartItems: true
      }
    });

    return res.status(201).json({
      message: 'Venta creada exitosamente',
      data: sale
    });
  } catch (error) {
    console.error('Error al crear la venta:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualiza los datos de una venta usando el ID del proveedor
 */
export const updateSale = async (req, res) => {
  try {
    const { idSaleProvider } = req.params;
    const updateData = req.body;

    // Verificar que la venta existe usando idSaleProvider
    const existingSale = await prisma.sale.findUnique({
      where: { idSaleProvider },
      include: { CartItems: true }
    });

    if (!existingSale) {
      return res.status(404).json({
        message: 'Venta no encontrada',
        error: 'SALE_NOT_FOUND'
      });
    }

    // No permitir actualizar ventas canceladas o reembolsadas
    if (existingSale.Status === 'CANCELLED' || existingSale.Status === 'REFUNDED') {
      return res.status(400).json({
        message: `No se puede modificar una venta en estado ${existingSale.Status}`,
        error: 'INVALID_SALE_STATUS'
      });
    }

    // Solo actualizar los campos permitidos
    const updatedSale = await prisma.sale.update({
      where: { idSaleProvider },
      data: {
        Name: updateData.name || undefined,
        LastName: updateData.lastName || undefined,
        Email: updateData.email || undefined,
        PhoneNumber: updateData.phoneNumber || undefined,
        Country: updateData.country || undefined,
        City: updateData.city || undefined,
        Language: updateData.idioma || undefined,
        Date: updateData.date ? new Date(updateData.date) : undefined,
        Time: updateData.time || undefined,
        UpdatedAt: new Date()
      }
    });

    return res.json({
      message: 'Venta actualizada exitosamente',
      data: updatedSale
    });
  } catch (error) {
    console.error('Error al actualizar la venta:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualiza la cantidad de pasajeros de una venta
 */
export const updatePaxQuantity = async (req, res) => {
  try {
    const { idSaleProvider } = req.params;
    const { qtypax, reason } = req.body;

    if (!qtypax || qtypax < 1) {
      return res.status(400).json({
        message: 'La cantidad de pasajeros a cancelar debe ser un número positivo',
        error: 'INVALID_PAX_QUANTITY'
      });
    }

    // Verificar que la venta existe usando IdSaleProvider
    const sale = await prisma.sale.findUnique({
      where: { idSaleProvider },
      include: { CartItems: true }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Venta no encontrada',
        error: 'SALE_NOT_FOUND'
      });
    }

    // No permitir modificar ventas canceladas o reembolsadas
    if (sale.Status === 'CANCELLED' || sale.Status === 'REFUNDED') {
      return res.status(400).json({
        message: `No se puede modificar una venta en estado ${sale.Status}`,
        error: 'INVALID_SALE_STATUS'
      });
    }

    // Obtener cantidad de items activos
    const activeItems = sale.CartItems.filter(item => item.Status === 'ACTIVE');
    console.log('Items activos:', activeItems.length);
    console.log('QtyPax actual:', sale.QtyPax);
    console.log('Qtypax a cancelar:', qtypax);

    // Validar que no se intenten cancelar más pasajeros de los que hay
    if (qtypax > sale.QtyPax) {
      return res.status(400).json({
        message: `No se pueden cancelar más pasajeros de los existentes (${sale.QtyPax} disponibles)`,
        error: 'INVALID_PAX_OPERATION'
      });
    }

    // Calcular la nueva cantidad de pasajeros
    const newQtyPax = sale.QtyPax - qtypax;

    // Usar una transacción para actualizar todo
    const updatedSale = await prisma.$transaction(async (prisma) => {
      // Primero cancelar los items
      for (const item of activeItems.slice(0, qtypax)) {
        await prisma.cartItem.update({
          where: { Id: item.Id },
          data: {
            Status: 'CANCELLED',
            CancelReason: reason || 'Cancelación parcial de pasajeros'
          }
        });
      }

      // Luego actualizar la venta
      const updated = await prisma.sale.update({
        where: { idSaleProvider },
        data: {
          QtyPax: newQtyPax,
          Status: newQtyPax === 0 ? 'CANCELLED' : sale.Status,
          CancelReason: newQtyPax === 0 ? (reason || 'Cancelación total de pasajeros') : sale.CancelReason,
          UpdatedAt: new Date()
        },
        include: { CartItems: true }
      });

      return updated;
    });

    // Verificar si todos los items están cancelados para actualizar el estado
    const remainingActiveItems = updatedSale.CartItems.filter(item => item.Status === 'ACTIVE').length;
    if (remainingActiveItems === 0 && updatedSale.Status !== 'CANCELLED') {
      await prisma.sale.update({
        where: { idSaleProvider },
        data: {
          Status: 'CANCELLED',
          CancelReason: reason || 'Todos los items han sido cancelados',
          UpdatedAt: new Date()
        }
      });
    }

    return res.json({
      message: `Se han cancelado ${qtypax} pasajeros. Quedan ${newQtyPax} pasajeros activos.`,
      data: updatedSale
    });
  } catch (error) {
    console.error('Error al actualizar cantidad de pasajeros:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Cancela una venta completa y todos sus items
 */
export const cancelFullSale = async (req, res) => {
  try {
    const { idSaleProvider } = req.params;
    const { reason } = req.body;

    // Verificar que la venta existe usando IdSaleProvider
    const sale = await prisma.sale.findUnique({
      where: { idSaleProvider: idSaleProvider },
      include: { CartItems: true }
    });

    if (!sale) {
      return res.status(404).json({
        message: 'Venta no encontrada',
        error: 'SALE_NOT_FOUND'
      });
    }

    // No permitir cancelar ventas ya canceladas o reembolsadas
    if (sale.Status === 'CANCELLED' || sale.Status === 'REFUNDED') {
      return res.status(400).json({
        message: `La venta ya se encuentra en estado ${sale.Status}`,
        error: 'INVALID_SALE_STATUS'
      });
    }

    // Usar una transacción para asegurar que todo se cancele o nada
    const updatedSale = await prisma.$transaction(async (prisma) => {
      // Primero cancelar todos los items activos
      await prisma.cartItem.updateMany({
        where: {
          SaleId: sale.Id,
          Status: 'ACTIVE'
        },
        data: {
          Status: 'CANCELLED',
          CancelReason: `Cancelación completa de la venta. Razón: ${reason || 'No especificada'}`
        }
      });

      // Luego cancelar la venta
      const cancelledSale = await prisma.sale.update({
        where: { idSaleProvider: idSaleProvider },
        data: {
          Status: 'CANCELLED',
          CancelReason: reason || 'No se especificó razón',
          UpdatedAt: new Date()
        },
        include: { CartItems: true }
      });

      return cancelledSale;
    });

    return res.json({
      message: 'Venta cancelada exitosamente',
      data: updatedSale
    });
  } catch (error) {
    console.error('Error al cancelar la venta:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}; 