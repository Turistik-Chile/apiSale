import { validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { generateSecureId } from '../utils/idGenerator.js';
import { transformSaleResponse } from '../utils/transformResponse.js';
import { ozyTripService } from '../services/ozyTripService.js';

const prisma = new PrismaClient();

/**
 * Busca una venta por idSaleProvider o secureId
 * @param {string} id - ID de la venta (puede ser idSaleProvider o secureId)
 * @param {Object} options - Opciones adicionales para la búsqueda
 * @returns {Promise<Object|null>} Venta encontrada o null
 */
const findSaleByAnyId = async (id, options = {}) => {
  const sale = await prisma.sale.findFirst({
    where: {
      OR: [
        { idSaleProvider: id },
        { secureId: id }
      ]
    },
    include: {
      CartItems: true,
      ...options.include
    }
  });
  return sale;
};

/**
 * Valida y formatea una hora en formato HH:mm:ss
 * @param {string} timeStr - Hora en formato string
 * @returns {string} Hora formateada en HH:mm:ss
 */
const validateAndFormatTime = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') {
    throw new Error('La hora debe ser un string en formato HH:MM:SS');
  }

  // Validar el formato usando regex
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
  if (!timeRegex.test(timeStr)) {
    throw new Error('Formato de hora inválido. Debe ser HH:MM:SS (24 horas)');
  }

  return timeStr;
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
 * @property {number} qtypax - Cantidad total de pasajeros (usado como fallback)
 * @property {string} opt - Opción seleccionada
 * @property {number} total - Total de la venta
 * @property {string} idSaleProvider - ID de la venta asignado por el proveedor
 * @property {ItemCart[]} itemsCart - Items del carrito
 */

/**
 * @typedef {Object} ItemCart
 * @property {string} idItemEcommerce - ID del ítem del ecommerce
 * @property {number} [quantity] - Cantidad de personas para este item (opcional, para futuras implementaciones)
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

    // Validar que exista al menos un item en el carrito
    if (!custommer.itemsCart || custommer.itemsCart.length === 0) {
      return res.status(400).json({
        message: 'Debe haber al menos un item en el carrito',
        error: 'EMPTY_CART'
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
        saleId: existingSale.secureId
      });
    }

    // Validar el formato de hora antes de crear la venta
    let formattedTime;
    try {
      formattedTime = validateAndFormatTime(custommer.time || '00:00:00');
    } catch (timeError) {
      return res.status(400).json({
        message: timeError.message,
        error: 'INVALID_TIME_FORMAT'
      });
    }

    // Obtener información del tour de OzyTrip
    let ozyTripResponse = null;
    let cartResponse = null;
    try {
      // 1. Obtener token de OzyTrip
      console.log('🔑 [OzyTrip] Obteniendo token...');
      const token = await ozyTripService.getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }
      console.log('✅ [OzyTrip] Token obtenido exitosamente');

      // 2. Obtener información del tour
      console.log('🔍 [OzyTrip] Obteniendo información del tour...');
      const tourInfo = await ozyTripService.getTourInformation({
        tourCode: custommer.itemsCart[0].idItemEcommerce,
        date: custommer.date,
        numberDays: 1 // Por defecto 1 día, ajustar según necesidad
      });

      ozyTripResponse = {
        tourInfo,
        status: 'SUCCESS',
        timestamp: new Date().toISOString()
      };

      // Validar disponibilidad
      if (!tourInfo) {
        throw new Error('No se recibió información del tour');
      }

      // Verificar si hay fechas disponibles y cupos
      const hasAvailableDates = tourInfo.dates && tourInfo.dates.length > 0;
      if (!hasAvailableDates) {
        return res.status(400).json({
          message: 'No hay fechas disponibles para el tour',
          error: 'NO_AVAILABILITY',
          details: {
            tourCode: custommer.itemsCart[0].idItemEcommerce,
            date: custommer.date
          }
        });
      }

      // Buscar la fecha específica solicitada
      const requestedDate = tourInfo.dates.find(d => d.date === custommer.date);
      if (!requestedDate) {
        return res.status(400).json({
          message: 'La fecha solicitada no está disponible',
          error: 'DATE_NOT_AVAILABLE',
          details: {
            tourCode: custommer.itemsCart[0].idItemEcommerce,
            date: custommer.date,
            availableDates: tourInfo.dates.map(d => d.date)
          }
        });
      }

      // Verificar si hay cupos disponibles
      const hasAvailableQuota = requestedDate.quotas.some(q => q.availableQuota > 0);
      if (!hasAvailableQuota) {
        return res.status(400).json({
          message: 'No hay cupos disponibles para la fecha seleccionada',
          error: 'NO_QUOTA_AVAILABLE',
          details: {
            tourCode: custommer.itemsCart[0].idItemEcommerce,
            date: custommer.date,
            quotas: requestedDate.quotas
          }
        });
      }

      // Validar que la cantidad de pasajeros no exceda los cupos disponibles
      const maxAvailableQuota = Math.max(...requestedDate.quotas.map(q => q.availableQuota));
      if (custommer.qtypax > maxAvailableQuota) {
        return res.status(400).json({
          message: `La cantidad de pasajeros (${custommer.qtypax}) excede los cupos disponibles (${maxAvailableQuota})`,
          error: 'EXCEEDS_AVAILABLE_QUOTA',
          details: {
            tourCode: custommer.itemsCart[0].idItemEcommerce,
            date: custommer.date,
            requestedPax: custommer.qtypax,
            availableQuota: maxAvailableQuota,
            quotas: requestedDate.quotas
          }
        });
      }

      // 3. Agregar al carrito de OzyTrip
      console.log('\n🛒 [OzyTrip] Agregando al carrito...');
      console.log('📝 [OzyTrip] Información del tour:', {
        tourCode: custommer.itemsCart[0].idItemEcommerce,
        date: custommer.date,
        time: custommer.time,
        qtypax: custommer.qtypax,
        encounterType: tourInfo.encounterTypeDescription,
        informationRequired: tourInfo.informationRequiredDescription
      });
      
      // Usar la hora de inicio del tour obtenida en tourInfo
      const tourStartTime = tourInfo.startTime; // Formato completo HH:mm:ss
      console.log('⏰ [OzyTrip] Usando hora de inicio del tour:', {
        completo: tourStartTime
      });

      // Preparar datos del carrito según el formato exacto de la API
      console.log('\n📦 [OzyTrip] Preparando datos del carrito...');
      const cartData = {
        // Campos según el formato de la API
        idBooking: null, // Opcional, si no viene se asume que es el primer ítem
        tourCode: tourInfo.tourCode, // Usar el tourCode de la información del tour
        serviceDate: `${custommer.date}T${tourStartTime}`,
        startTime: tourStartTime, // Usar el formato completo HH:mm:ss
        meetingPointId: null,
        pickupLocationId: null,
        ageGroups: []
      };

      // Si el tour tiene precios para diferentes grupos etarios, agregarlos
      if (tourInfo.priceHeaders && tourInfo.priceHeaders.length > 0) {
        const prices = tourInfo.priceHeaders[0].prices;
        console.log('\n💰 [OzyTrip] Precios disponibles:', prices.map(p => ({
          ageGroup: p.ageGroupCode,
          price: p.unitPrice
        })));

        // Agregar grupos etarios según los precios disponibles
        cartData.ageGroups = prices.map(price => {
          // Usar el tourCode como idItemEcommerce ya que es el mismo tour
          const quantity = price.ageGroupCode === 'ADT' ? custommer.qtypax : 0;
          
          return {
            idItemEcommerce: tourInfo.tourCode, // Usar el mismo tourCode
            ageGroupCode: price.ageGroupCode,
            quantity: quantity
          };
        }).filter(group => group.quantity > 0);

        console.log('\n👥 [OzyTrip] Grupos etarios configurados:', cartData.ageGroups);
      } else {
        // Si no hay precios específicos, usar el grupo adulto por defecto
        cartData.ageGroups = [{
          idItemEcommerce: tourInfo.tourCode, // Usar el mismo tourCode
          ageGroupCode: 'ADT',
          quantity: custommer.qtypax
        }];
      }

      console.log('\n📦 [OzyTrip] Datos del carrito según API:', JSON.stringify(cartData, null, 2));
      console.log('\n🔍 [OzyTrip] Validando estructura de datos:');
      console.log('- Campos presentes:', Object.keys(cartData).join(', '));
      console.log('- Cantidad de grupos etarios:', cartData.ageGroups.length);
      console.log('- Tipo de encuentro:', tourInfo.encounterTypeDescription);
      
      try {
        cartResponse = await ozyTripService.addToCart(cartData);
        console.log('\n✅ [OzyTrip] Respuesta del carrito:', JSON.stringify(cartResponse, null, 2));
      } catch (cartError) {
        console.error('\n❌ [OzyTrip] Error al agregar al carrito:', {
          message: cartError.message,
          code: cartError.code,
          response: cartError.response?.data || 'No hay datos de respuesta'
        });
        throw cartError;
      }

      // Llamar a addPassengers (pasajeros anónimos) después de agregar al carrito
      console.log('\n🛫 [OzyTrip] Llamando a addPassengers (pasajeros anónimos) con idBooking:', cartResponse.idBooking);
      const passengersData = {
        idBooking: cartResponse.idBooking,
        name: custommer.name,
        lastName: custommer.lastName,
        email: custommer.email,
        phoneNumber: custommer.phoneNumber,
        country: custommer.country,
        notificationType: 'EMAIL', // (o "WHATSAPP" según corresponda)
        anonymousPassengers: true, // pasajeros anónimos
        passengers: [],
        itemsCart: []
      };
      console.log('📦 [OzyTrip] Datos de pasajeros (payload):', JSON.stringify(passengersData, null, 2));
      
      try {
        const addPassengersResponse = await ozyTripService.addPassengers(passengersData);
        console.log('🛬 [OzyTrip] Respuesta de addPassengers:', JSON.stringify(addPassengersResponse, null, 2));
        
        // Si tenemos idBooking, consideramos la operación exitosa
        if (addPassengersResponse && addPassengersResponse.idBooking) {
          ozyTripResponse = {
            status: 'SUCCESS',
            timestamp: new Date().toISOString(),
            tourInfo: ozyTripResponse.tourInfo,
            cartResponse: cartResponse,
            passengersResponse: addPassengersResponse
          };
        } else {
          throw new Error('No se pudo confirmar la adición de pasajeros');
        }
      } catch (passengersError) {
        console.error('❌ [OzyTrip] Error al agregar pasajeros:', passengersError);
        // Si tenemos idBooking del carrito, consideramos parcialmente exitoso
        if (cartResponse && cartResponse.idBooking) {
          ozyTripResponse = {
            status: 'PARTIAL_SUCCESS',
            timestamp: new Date().toISOString(),
            tourInfo: ozyTripResponse.tourInfo,
            cartResponse: cartResponse,
            error: `Carrito creado pero error al agregar pasajeros: ${passengersError.message}`
          };
        } else {
          throw passengersError;
        }
      }

    } catch (ozyTripError) {
      console.error('❌ [OzyTrip] Error en el proceso:', ozyTripError);
      ozyTripResponse = {
        error: ozyTripError.message,
        status: 'ERROR',
        timestamp: new Date().toISOString()
      };

      // Si es un error de disponibilidad o carrito, retornar 400
      if (ozyTripError.message.includes('disponibilidad') || 
          ozyTripError.message.includes('cupos') || 
          ozyTripError.message.includes('carrito')) {
        return res.status(400).json({
          message: ozyTripError.message,
          error: ozyTripError.message.includes('carrito') ? 'CART_ERROR' : 'NO_AVAILABILITY',
          details: {
            tourCode: custommer.itemsCart[0].idItemEcommerce,
            date: custommer.date
          }
        });
      }

      // Para otros errores, continuar con la creación de la venta pero con el error registrado
    }

    // Crear la venta con todos sus items en una sola transacción
    try {
      const sale = await prisma.sale.create({
        data: {
          ProviderName: provider.name,
          Name: custommer.name,
          LastName: custommer.lastName,
          Email: custommer.email,
          PhoneNumber: custommer.phoneNumber,
          Country: custommer.country,
          City: custommer.city,
          Language: custommer.idioma,
          Date: new Date(custommer.date),
          Time: formattedTime,
          QtyPax: custommer.qtypax,
          Opt: custommer.opt,
          Total: custommer.total,
          idSaleProvider: custommer.idSaleProvider,
          secureId: generateSecureId(new Date(custommer.date)),
          ozyTripResponse: JSON.stringify({
            status: ozyTripResponse.status,
            timestamp: ozyTripResponse.timestamp,
            tourInfo: ozyTripResponse.tourInfo ? {
              tourCode: ozyTripResponse.tourInfo.tourCode,
              name: ozyTripResponse.tourInfo.name,
              dates: ozyTripResponse.tourInfo.dates?.map(d => ({
                date: d.date,
                quotas: d.quotas?.map(q => ({
                  startTime: q.startTime,
                  endTime: q.endTime,
                  availableQuota: q.availableQuota
                }))
              }))
            } : null,
            error: ozyTripResponse.error,
            cartResponse: cartResponse
          }),
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

      // Determinar el mensaje de respuesta basado en el resultado de OzyTrip
      const responseMessage = ozyTripResponse.error 
        ? 'Venta creada pero hubo un error al obtener información de OzyTrip'
        : 'Venta creada exitosamente';

      return res.status(201).json({
        message: responseMessage,
        data: transformSaleResponse(sale),
        ozyTripStatus: ozyTripResponse.error ? 'ERROR' : 'SUCCESS',
        ozyTripInfo: ozyTripResponse.tourInfo || null
      });
    } catch (dbError) {
      console.error('Error al crear la venta en la base de datos:', dbError);
      return res.status(500).json({
        message: 'Error al crear la venta en la base de datos',
        error: dbError.message
      });
    }
  } catch (error) {
    console.error('Error al crear la venta:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Actualiza los datos de una venta usando el ID del proveedor o el secureId
 */
export const updateSale = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Verificar que la venta existe usando cualquiera de los IDs
    const existingSale = await findSaleByAnyId(id);

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

    // Validar el formato de hora antes de intentar actualizar
    let formattedTime;
    if (updateData.time) {
      try {
        formattedTime = validateAndFormatTime(updateData.time);
      } catch (timeError) {
        return res.status(400).json({
          message: timeError.message,
          error: 'INVALID_TIME_FORMAT'
        });
      }
    }

    // Solo actualizar los campos permitidos
    const updatedSale = await prisma.sale.update({
      where: { Id: existingSale.Id },
      data: {
        Name: updateData.name || undefined,
        LastName: updateData.lastName || undefined,
        Email: updateData.email || undefined,
        PhoneNumber: updateData.phoneNumber || undefined,
        Country: updateData.country || undefined,
        City: updateData.city || undefined,
        Language: updateData.idioma || undefined,
        Date: updateData.date ? new Date(updateData.date) : undefined,
        Time: formattedTime,
        UpdatedAt: new Date()
      },
      include: {
        CartItems: true
      }
    });

    return res.json({
      message: 'Venta actualizada exitosamente',
      data: transformSaleResponse(updatedSale)
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
    const { id } = req.params;
    const { qtypax, reason } = req.body;

    if (!qtypax || qtypax < 1) {
      return res.status(400).json({
        message: 'La cantidad de pasajeros a cancelar debe ser un número positivo',
        error: 'INVALID_PAX_QUANTITY'
      });
    }

    // Verificar que la venta existe usando cualquiera de los IDs
    const sale = await findSaleByAnyId(id);

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
        where: { Id: sale.Id },
        data: {
          QtyPax: newQtyPax,
          Status: newQtyPax === 0 ? 'CANCELLED' : 'PROCESSING',
          CancelReason: reason || (newQtyPax === 0 ? 'Cancelación total de pasajeros' : 'Cancelación parcial de pasajeros'),
          UpdatedAt: new Date()
        },
        include: { CartItems: true }
      });

      return updated;
    });

    return res.json({
      message: `Se han cancelado ${qtypax} pasajeros. Quedan ${newQtyPax} pasajeros activos.`,
      data: transformSaleResponse(updatedSale)
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
    const { id } = req.params;
    const { reason } = req.body;

    // Verificar que la venta existe usando cualquiera de los IDs
    const sale = await findSaleByAnyId(id);

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
        where: { Id: sale.Id },
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
      data: transformSaleResponse(updatedSale)
    });
  } catch (error) {
    console.error('Error al cancelar la venta:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
}; 