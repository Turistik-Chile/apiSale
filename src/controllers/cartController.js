import { PrismaClient } from '@prisma/client';
import { ozyTripService } from '../services/ozyTripService.js';
import { validationResult } from 'express-validator';

const prisma = new PrismaClient();

/**
 * Valida el tipo de encuentro y los IDs de punto de encuentro/recogida
 * @param {Object} tourInfo - Información del tour
 * @param {number|null} meetingPointId - ID del punto de encuentro
 * @param {string|null} pickupLocationId - ID del punto de recogida
 * @returns {Object} Objeto con error si hay alguno
 */
const validateEncounterType = (tourInfo, meetingPointId, pickupLocationId) => {
  const encounterType = tourInfo.encounterType?.toUpperCase() || 'NONE';

  // Validar que los campos estén presentes en el request
  if (meetingPointId === undefined || pickupLocationId === undefined) {
    return { error: 'Los campos meetingPointId y pickupLocationId son requeridos' };
  }

  switch (encounterType) {
    case 'NONE':
      if (meetingPointId !== null || pickupLocationId !== null) {
        return { error: 'Para el tipo de encuentro NONE, ambos IDs deben ser nulos' };
      }
      break;

    case 'MEETINGPOINT':
      if (!meetingPointId || typeof meetingPointId !== 'number') {
        return { error: 'Para el tipo de encuentro MEETINGPOINT, se requiere un meetingPointId válido' };
      }
      if (pickupLocationId !== null) {
        return { error: 'Para el tipo de encuentro MEETINGPOINT, pickupLocationId debe ser nulo' };
      }
      break;

    case 'PICKUPLOCATION':
      if (!pickupLocationId || typeof pickupLocationId !== 'string') {
        return { error: 'Para el tipo de encuentro PICKUPLOCATION, se requiere un pickupLocationId válido' };
      }
      if (meetingPointId !== null) {
        return { error: 'Para el tipo de encuentro PICKUPLOCATION, meetingPointId debe ser nulo' };
      }
      break;

    default:
      return { error: 'Tipo de encuentro no válido' };
  }

  return { error: null };
};

/**
 * Agrega items al carrito
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
export const addToCart = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      idBooking,
      tourCode,
      serviceDate,
      startTime,
      meetingPointId,
      pickupLocationId,
      ageGroups
    } = req.body;

    // Validar que haya al menos un grupo de edad
    if (!ageGroups || !Array.isArray(ageGroups) || ageGroups.length === 0) {
      return res.status(400).json({
        message: 'Debe especificar al menos un grupo de edad',
        error: 'INVALID_AGE_GROUPS'
      });
    }

    // Validar que todas las cantidades sean mayores a cero
    const invalidQuantity = ageGroups.some(group => !group.quantity || group.quantity <= 0);
    if (invalidQuantity) {
      return res.status(400).json({
        message: 'Todas las cantidades deben ser mayores a cero',
        error: 'INVALID_QUANTITY'
      });
    }

    // Obtener información del tour
    const tourInfo = await ozyTripService.getTourInformation({
      tourCode,
      date: serviceDate.split('T')[0],
      numberDays: 1
    });

    if (!tourInfo) {
      return res.status(400).json({
        message: 'No se pudo obtener información del tour',
        error: 'TOUR_NOT_FOUND'
      });
    }

    // Validar tipo de encuentro y IDs
    const encounterValidation = validateEncounterType(tourInfo, meetingPointId, pickupLocationId);
    if (encounterValidation.error) {
      return res.status(400).json({
        message: encounterValidation.error,
        error: 'INVALID_ENCOUNTER_TYPE'
      });
    }

    // Validar disponibilidad y cupos
    const requestedDate = tourInfo.dates?.find(d => d.date === serviceDate.split('T')[0]);
    if (!requestedDate) {
      return res.status(400).json({
        message: 'La fecha solicitada no está disponible',
        error: 'DATE_NOT_AVAILABLE'
      });
    }

    const requestedTime = requestedDate.quotas?.find(q => q.startTime === startTime);
    if (!requestedTime) {
      return res.status(400).json({
        message: 'El horario solicitado no está disponible',
        error: 'TIME_NOT_AVAILABLE'
      });
    }

    // Calcular total de pasajeros
    const totalPassengers = ageGroups.reduce((sum, group) => sum + group.quantity, 0);
    if (totalPassengers > requestedTime.availableQuota) {
      return res.status(400).json({
        message: `No hay suficientes cupos disponibles. Solicitados: ${totalPassengers}, Disponibles: ${requestedTime.availableQuota}`,
        error: 'INSUFFICIENT_QUOTA'
      });
    }

    // Intentar agregar al carrito de OzyTrip
    let ozyTripResponse;
    try {
      ozyTripResponse = await ozyTripService.addToCart({
        idBooking,
        tourCode,
        serviceDate,
        startTime,
        meetingPointId,
        pickupLocationId,
        ageGroups
      });
    } catch (ozyTripError) {
      console.error('Error al agregar al carrito de OzyTrip:', ozyTripError);
      return res.status(400).json({
        message: ozyTripError.message || 'Error al agregar al carrito de OzyTrip',
        error: 'OZYTRIP_ERROR'
      });
    }

    // Si hay un idBooking, verificar que exista y no esté completado
    if (idBooking) {
      const existingCart = await prisma.cart.findUnique({
        where: { idBooking },
        include: { CartItems: true }
      });

      if (!existingCart) {
        return res.status(404).json({
          message: 'El carrito especificado no existe',
          error: 'CART_NOT_FOUND'
        });
      }

      if (existingCart.status === 'COMPLETED') {
        return res.status(400).json({
          message: 'No se pueden agregar items a un carrito completado',
          error: 'CART_COMPLETED'
        });
      }

      // Actualizar items existentes o agregar nuevos
      for (const group of ageGroups) {
        const existingItem = existingCart.CartItems.find(
          item => item.idItemEcommerce === group.idItemEcommerce && 
                 item.ageGroupCode === group.ageGroupCode
        );

        if (existingItem) {
          await prisma.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: group.quantity }
          });
        } else {
          await prisma.cartItem.create({
            data: {
              cartId: existingCart.id,
              idItemEcommerce: group.idItemEcommerce,
              ageGroupCode: group.ageGroupCode,
              quantity: group.quantity,
              tourCode,
              serviceDate: new Date(serviceDate),
              startTime,
              meetingPointId,
              pickupLocationId
            }
          });
        }
      }

      // Actualizar fecha de expiración con la respuesta de OzyTrip
      const updatedCart = await prisma.cart.update({
        where: { id: existingCart.id },
        data: {
          bookingExpirationDate: new Date(ozyTripResponse.bookingExpirationDate),
          waitTime: ozyTripResponse.waitTime
        }
      });

      return res.json({
        idBooking: updatedCart.idBooking,
        bookingExpirationDate: updatedCart.bookingExpirationDate,
        waitTime: updatedCart.waitTime
      });
    }

    // Crear nuevo carrito con la respuesta de OzyTrip
    const newCart = await prisma.cart.create({
      data: {
        idBooking: ozyTripResponse.idBooking,
        bookingExpirationDate: new Date(ozyTripResponse.bookingExpirationDate),
        waitTime: ozyTripResponse.waitTime,
        CartItems: {
          create: ageGroups.map(group => ({
            idItemEcommerce: group.idItemEcommerce,
            ageGroupCode: group.ageGroupCode,
            quantity: group.quantity,
            tourCode,
            serviceDate: new Date(serviceDate),
            startTime,
            meetingPointId,
            pickupLocationId
          }))
        }
      }
    });

    return res.status(201).json({
      idBooking: newCart.idBooking,
      bookingExpirationDate: newCart.bookingExpirationDate,
      waitTime: newCart.waitTime
    });

  } catch (error) {
    console.error('Error al agregar al carrito:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

/**
 * Genera un ID de reserva único
 * @returns {Promise<string>} ID de reserva generado
 */
const generateBookingId = async () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  const bookingId = `RV${year}${month}${day}A${random}`;
  
  // Verificar que no exista
  const existing = await prisma.cart.findUnique({
    where: { idBooking: bookingId }
  });

  if (existing) {
    return generateBookingId(); // Intentar de nuevo si ya existe
  }

  return bookingId;
}; 