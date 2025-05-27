import axios from 'axios';
import { Buffer } from 'buffer';

class OzyTripService {
    constructor() {
        // URLs según ambiente
        this.tokenUrl = process.env.NODE_ENV === 'production' 
            ? 'https://ozyidentity.bmore.cl/connect/token'
            : 'https://app01.dev.bmore.cl:44316/connect/token';
            
        this.apiUrl = process.env.NODE_ENV === 'production'
            ? 'https://ozytripapi.bmore.cl'
            : 'https://api.dev.bmore.cl:8443';

        // Credenciales según ambiente
        if (process.env.NODE_ENV === 'production') {
            this.clientId = 'EcommerceTuristik';
            this.clientSecret = '447a54fe-b3c9-2cb2-45d7-eb2ef7e5fe95';
        } else {
            this.clientId = 'EcommerceTuristik2';
            this.clientSecret = 'a5d4ca55-20bc-7f62-8cc1-c3721628e898';
        }
        
        this.scope = 'ozy_trip_ecommerce_api';
        this.token = null;
        this.tokenExpiration = null;

        // Log del ambiente actual
        console.log(`🌍 [OzyTrip] Ambiente: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔑 [OzyTrip] Usando credenciales para: ${this.clientId}`);
    }

    /**
     * Obtiene un token de autenticación de OzyTrip
     * @returns {Promise<string>} Token de autenticación
     */
    async getToken() {
        try {
            console.log('🔑 [OzyTrip] Iniciando obtención de token...');
            
            // Si el token existe y no ha expirado, lo retornamos
            if (this.token && this.tokenExpiration && new Date() < this.tokenExpiration) {
                console.log('✅ [OzyTrip] Token existente válido, expira en:', this.tokenExpiration);
                if (process.env.NODE_ENV === 'development') {
                    console.log('\n🔐 [OzyTrip] TOKEN ACTUAL:');
                    console.log('----------------------------------------');
                    console.log(this.token);
                    console.log('----------------------------------------\n');
                }
                return this.token;
            }

            console.log('🔄 [OzyTrip] Token no existe o expiró, solicitando nuevo token...');
            console.log('📍 [OzyTrip] URL de token:', this.tokenUrl);

            // Crear el header de autenticación básica
            const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            
            console.log('📤 [OzyTrip] Enviando petición de token...');
            const response = await axios.post(
                this.tokenUrl,
                `grant_type=client_credentials&scope=${this.scope}`,
                {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Accept': 'application/json'
                    }
                }
            );

            if (!response.data.access_token) {
                console.error('❌ [OzyTrip] No se recibió token en la respuesta:', response.data);
                throw new Error('No se recibió token en la respuesta');
            }

            // Guardar el token y su tiempo de expiración
            this.token = response.data.access_token;
            this.tokenExpiration = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
            
            console.log('✅ [OzyTrip] Nuevo token obtenido exitosamente');
            console.log('⏰ [OzyTrip] Token expira en:', this.tokenExpiration);
            if (process.env.NODE_ENV === 'development') {
                console.log('\n🔐 [OzyTrip] NUEVO TOKEN:');
                console.log('----------------------------------------');
                console.log(this.token);
                console.log('----------------------------------------\n');
            }

            return this.token;
        } catch (error) {
            console.error('❌ [OzyTrip] Error al obtener token:', {
                message: error.message,
                code: error.code,
                response: error.response ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                } : 'No hay respuesta del servidor'
            });
            throw new Error(`Error de autenticación con OzyTrip: ${error.message}`);
        }
    }

    /**
     * Obtiene el token actual (solo para desarrollo)
     * @returns {Promise<{token: string, expiresAt: Date}>}
     */
    async getCurrentToken() {
        if (process.env.NODE_ENV !== 'development') {
            throw new Error('Este método solo está disponible en desarrollo');
        }

        // Si no hay token o expiró, obtener uno nuevo
        if (!this.token || !this.tokenExpiration || new Date() >= this.tokenExpiration) {
            await this.getToken();
        }

        return {
            token: this.token,
            expiresAt: this.tokenExpiration
        };
    }

    /**
     * Crea una reserva en OzyTrip
     * @param {Object} bookingData - Datos de la reserva
     * @returns {Promise<Object>} Respuesta de la API
     */
    async createBooking(bookingData) {
        try {
            const token = await this.getToken();

            const response = await axios.post(
                `${this.apiUrl}/api/v1/bookings`,
                bookingData,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    }
                }
            );

            return response.data;
        } catch (error) {
            console.error('Error al crear reserva en OzyTrip:', error);
            throw new Error(`Error al crear reserva en OzyTrip: ${error.message}`);
        }
    }

    /**
     * Obtiene información de disponibilidad y cotización de una excursión
     * @param {Object} params - Parámetros de la consulta
     * @param {string} params.tourCode - Código de la excursión
     * @param {string} params.date - Fecha de consulta en formato yyyy-mm-dd
     * @param {number} params.numberDays - Cantidad de días a consultar (máximo 150)
     * @param {string} [params.currency] - Divisa (opcional, por defecto CLP)
     * @returns {Promise<Object>} Información del tour
     */
    async getTourInformation({ tourCode, date, numberDays, currency = 'CLP' }) {
        try {
            console.log('🔍 [OzyTrip] Iniciando obtención de información del tour...');
            console.log('📝 [OzyTrip] Parámetros:', { tourCode, date, numberDays, currency });

            // Validar parámetros
            if (!tourCode) {
                console.error('❌ [OzyTrip] Error: Código del tour no proporcionado');
                throw new Error('El código del tour es requerido');
            }
            if (!date) {
                console.error('❌ [OzyTrip] Error: Fecha no proporcionada');
                throw new Error('La fecha es requerida');
            }
            if (!numberDays || numberDays < 1 || numberDays > 150) {
                console.error('❌ [OzyTrip] Error: Días inválidos:', numberDays);
                throw new Error('La cantidad de días debe estar entre 1 y 150');
            }

            // Validar formato de fecha
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                console.error('❌ [OzyTrip] Error: Formato de fecha inválido:', date);
                throw new Error('La fecha debe estar en formato yyyy-mm-dd');
            }

            console.log('🔑 [OzyTrip] Obteniendo token...');
            const token = await this.getToken();
            console.log('✅ [OzyTrip] Token obtenido, procediendo con la consulta del tour');

            const url = `${this.apiUrl}/api/v1/tourInformation/${tourCode}/${date}/${numberDays}/${currency}`;
            console.log('🌐 [OzyTrip] URL de consulta:', url);

            console.log('📤 [OzyTrip] Enviando petición al servidor...');
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('✅ [OzyTrip] Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                hasData: !!response.data
            });

            if (!response.data) {
                console.error('❌ [OzyTrip] Error: Respuesta sin datos');
                throw new Error('La respuesta del servidor no contiene datos');
            }

            // Mostrar la respuesta completa
            console.log('\n📦 [OzyTrip] Detalles de la respuesta:');
            console.log('----------------------------------------');
            console.log('Información General:');
            console.log('  Tour Code:', response.data.tourCode);
            console.log('  Nombre:', response.data.tourName);
            console.log('  Hora de inicio:', response.data.startTime);
            console.log('  Tipo de encuentro:', response.data.encounterTypeDescription);
            console.log('  Información requerida:', response.data.informationRequiredDescription);
            console.log('  Usa intervalos:', response.data.useIntervals ? 'Sí' : 'No');

            console.log('\nPrecios:');
            if (response.data.priceHeaders && response.data.priceHeaders.length > 0) {
                response.data.priceHeaders.forEach(header => {
                    console.log(`  Período: ${header.initDate} a ${header.endDate}`);
                    header.prices.forEach(price => {
                        console.log(`    ${price.ageGroup} (${price.ageGroupCode}):`);
                        console.log(`      Tipo de día: ${price.dayTypeDescription}`);
                        console.log(`      Precio: ${price.unitPrice} CLP`);
                    });
                });
            }

            console.log('\nDisponibilidad:');
            if (response.data.dates && response.data.dates.length > 0) {
                response.data.dates.forEach(date => {
                    console.log(`  Fecha: ${date.date}`);
                    date.quotas.forEach(quota => {
                        console.log(`    Horario: ${quota.startTime} - ${quota.endTime}`);
                        console.log(`    Cupos disponibles: ${quota.availableQuota}`);
                        console.log(`    Disponible: ${quota.isAvailable ? 'Sí' : 'No'}`);
                    });
                });
            }

            if (response.data.pickupLocations && response.data.pickupLocations.length > 0) {
                console.log('\nPuntos de recogida:');
                response.data.pickupLocations.forEach(location => {
                    console.log(`  - ${location.name}`);
                });
            }

            if (response.data.meetingPoints && response.data.meetingPoints.length > 0) {
                console.log('\nPuntos de encuentro:');
                response.data.meetingPoints.forEach(point => {
                    console.log(`  - ${point.name}`);
                });
            }
            console.log('----------------------------------------\n');

            return response.data;
        } catch (error) {
            console.error('❌ [OzyTrip] Error en getTourInformation:', {
                message: error.message,
                code: error.code,
                step: error.step || 'unknown',
                response: error.response ? {
                    status: error.response.status,
                    statusText: error.response.statusText,
                    data: error.response.data
                } : 'No hay respuesta del servidor'
            });

            // Determinar el tipo de error
            if (error.response) {
                switch (error.response.status) {
                    case 401:
                        throw new Error('Error de autenticación con OzyTrip');
                    case 404:
                        throw new Error(`Tour no encontrado: ${tourCode}`);
                    case 500:
                        throw new Error('Error interno del servidor de OzyTrip');
                    default:
                        throw new Error(`Error al obtener información del tour: ${error.response.data?.message || error.message}`);
                }
            } else if (error.request) {
                throw new Error('No se recibió respuesta del servidor de OzyTrip');
            } else {
                throw new Error(`Error al obtener información del tour: ${error.message}`);
            }
        }
    }

    /**
     * Agrega pasajeros a una reserva existente
     * @param {Object} data - Datos de los pasajeros
     * @param {string} data.idBooking - ID de la reserva
     * @param {string} data.name - Nombre del cliente
     * @param {string} data.lastName - Apellido del cliente
     * @param {string} data.email - Email del cliente
     * @param {string} data.phoneNumber - Teléfono del cliente
     * @param {string} data.country - País del cliente
     * @param {string} data.notificationType - Tipo de notificación (EMAIL o WHATSAPP)
     * @param {boolean} data.anonymousPassengers - Si los pasajeros son anónimos
     * @param {Array} data.passengers - Array de pasajeros (vacío si anonymousPassengers es true)
     * @param {Array} data.itemsCart - Array de items del carrito (vacío si anonymousPassengers es true)
     * @returns {Promise<Object>} Respuesta de la API
     */
    async addPassengers(data) {
        console.log('\n🛫 [OzyTrip] Iniciando proceso de agregar pasajeros...');
        console.log('📝 [OzyTrip] Parámetros de entrada:', JSON.stringify(data, null, 2));

        // Validar campos obligatorios
        const requiredFields = ['idBooking', 'name', 'lastName', 'email', 'phoneNumber', 'country', 'notificationType'];
        for (const field of requiredFields) {
            if (!data[field]) {
                throw new Error(`El campo ${field} es obligatorio`);
            }
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
            throw new Error('El formato del email no es válido');
        }

        // Validar tipo de notificación
        if (!['EMAIL', 'WHATSAPP'].includes(data.notificationType)) {
            throw new Error('El tipo de notificación debe ser EMAIL o WHATSAPP');
        }

        try {
            // Obtener token
            console.log('🔑 [OzyTrip] Obteniendo token...');
            const token = await this.getToken();
            if (!token) {
                throw new Error('No se pudo obtener el token de autenticación');
            }

            // Preparar la petición
            const url = `${this.apiUrl}/api/v2/addPassengers`;
            console.log('🌐 [OzyTrip] URL de la petición:', url);

            const headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/json'
            };

            console.log('📤 [OzyTrip] Enviando petición al servidor con headers:', {
                ...headers,
                'Authorization': 'Bearer [TOKEN]'
            });

            console.log('📦 [OzyTrip] Datos a enviar:', JSON.stringify(data, null, 2));

            // Realizar la petición
            const response = await axios.post(url, data, { headers });

            console.log('\n✅ [OzyTrip] Respuesta recibida del servidor:', {
                status: response.status,
                statusText: response.statusText,
                hasData: !!response.data,
                headers: response.headers
            });

            if (response.status === 200) {
                console.log('✅ [OzyTrip] Pasajeros agregados exitosamente');
                return response.data || { idBooking: data.idBooking, status: 'success' };
            } else {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

        } catch (error) {
            console.error('❌ [OzyTrip] Error al agregar pasajeros:', {
                message: error.message,
                code: error.code,
                response: error.response?.data || 'No hay datos de respuesta'
            });

            if (error.response?.data) {
                throw new Error(`Error al agregar pasajeros: ${error.response.data.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Agrega items al carrito de OzyTrip
     * @param {Object} data - Parámetros para agregar al carrito
     * @param {string} [data.idBooking] - ID interno de la reserva en OzyTrip (opcional)
     * @param {string} data.tourCode - Excursión que se desea agregar al carrito
     * @param {string} data.serviceDate - Fecha de la excursión en formato ISO
     * @param {string} data.startTime - Hora de la excursión en formato HH:mm:ss
     * @param {number} [data.meetingPointId] - Identificador del Meeting Point
     * @param {string} [data.pickupLocationId] - Identificador de recogida
     * @param {Array<Object>} data.ageGroups - Listado de grupos etarios
     * @returns {Promise<Object>} Respuesta de OzyTrip
     */
    async addToCart(data) {
        try {
            console.log('\n🛒 [OzyTrip] Iniciando proceso de agregar al carrito...');
            console.log('📝 [OzyTrip] Parámetros de entrada:', JSON.stringify(data, null, 2));

            // Validar campos obligatorios
            const requiredFields = ['tourCode', 'serviceDate', 'startTime', 'ageGroups'];
            console.log('\n🔍 [OzyTrip] Validando campos obligatorios...');
            const missingFields = requiredFields.filter(field => !data[field]);
            if (missingFields.length > 0) {
                console.error('❌ [OzyTrip] Campos obligatorios faltantes:', missingFields);
                throw new Error(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
            }
            console.log('✅ [OzyTrip] Campos obligatorios validados');

            // Validar estructura de ageGroups
            console.log('\n🔍 [OzyTrip] Validando estructura de ageGroups...');
            if (!Array.isArray(data.ageGroups) || data.ageGroups.length === 0) {
                console.error('❌ [OzyTrip] ageGroups debe ser un array no vacío');
                throw new Error('Debe proporcionar al menos un grupo etario');
            }
            console.log('✅ [OzyTrip] Estructura de ageGroups válida');

            // Validar cada grupo etario
            console.log('\n🔍 [OzyTrip] Validando cada grupo etario...');
            data.ageGroups.forEach((group, index) => {
                console.log(`\nValidando grupo etario ${index + 1}:`, JSON.stringify(group, null, 2));
                const requiredGroupFields = ['idItemEcommerce', 'ageGroupCode', 'quantity'];
                const missingGroupFields = requiredGroupFields.filter(field => !group[field]);
                if (missingGroupFields.length > 0) {
                    console.error(`❌ [OzyTrip] Grupo etario ${index + 1}: campos faltantes:`, missingGroupFields);
                    throw new Error(`Grupo etario ${index + 1}: campos obligatorios faltantes: ${missingGroupFields.join(', ')}`);
                }
                if (group.quantity <= 0) {
                    console.error(`❌ [OzyTrip] Grupo etario ${index + 1}: cantidad inválida:`, group.quantity);
                    throw new Error(`Grupo etario ${index + 1}: la cantidad debe ser mayor a cero`);
                }
                console.log(`✅ [OzyTrip] Grupo etario ${index + 1} válido`);
            });

            // Validar formato de fecha y hora
            console.log('\n🔍 [OzyTrip] Validando formato de fecha y hora...');
            const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
            if (!dateRegex.test(data.serviceDate)) {
                console.error('❌ [OzyTrip] Formato de fecha inválido:', data.serviceDate);
                throw new Error('Formato de fecha inválido. Debe ser yyyy-MM-ddThh:mm:ss');
            }
            console.log('✅ [OzyTrip] Formato de fecha válido');

            const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;
            if (!timeRegex.test(data.startTime)) {
                console.error('❌ [OzyTrip] Formato de hora inválido:', data.startTime);
                throw new Error('Formato de hora inválido. Debe ser HH:mm:ss');
            }
            console.log('✅ [OzyTrip] Formato de hora válido');

            // Validar que la hora en serviceDate coincida con startTime
            const serviceTime = data.serviceDate.split('T')[1];
            if (serviceTime !== data.startTime) {
                console.error('❌ [OzyTrip] Hora en serviceDate no coincide con startTime:', {
                    serviceDate: data.serviceDate,
                    serviceTime,
                    startTime: data.startTime
                });
                throw new Error('La hora en serviceDate debe coincidir con startTime');
            }
            console.log('✅ [OzyTrip] Hora en serviceDate coincide con startTime');

            // Obtener token
            console.log('\n🔑 [OzyTrip] Obteniendo token...');
            const token = await this.getToken();
            if (!token) {
                throw new Error('No se pudo obtener el token de autenticación');
            }
            console.log('✅ [OzyTrip] Token obtenido exitosamente');

            // Preparar la petición
            const url = `${this.apiUrl}/api/v1/addToCart`;
            console.log('\n🌐 [OzyTrip] URL de la petición:', url);
            console.log('📤 [OzyTrip] Enviando petición al servidor con headers:', {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer [TOKEN]',
                'Accept': 'application/json'
            });

            console.log('\n📦 [OzyTrip] Datos a enviar:', JSON.stringify(data, null, 2));

            // Realizar la petición
            const response = await axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('\n✅ [OzyTrip] Respuesta recibida del servidor:', {
                status: response.status,
                statusText: response.statusText,
                hasData: !!response.data,
                headers: response.headers
            });

            if (response.status === 200 && response.data) {
                console.log('✅ [OzyTrip] Item agregado al carrito exitosamente');
                return response.data;
            } else {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

        } catch (error) {
            console.error('\n❌ [OzyTrip] Error al agregar al carrito:', {
                message: error.message,
                code: error.code,
                response: error.response?.data || 'No hay datos de respuesta'
            });

            if (error.response?.data) {
                throw new Error(`Error al agregar al carrito: ${error.response.data.message || error.message}`);
            }
            throw error;
        }
    }

    /**
     * Realiza el pago de una reserva
     * @param {Object} data - Datos del pago
     * @param {string} data.idBooking - ID de la reserva
     * @param {number} data.totalAmount - Monto total a pagar
     * @param {string} [data.couponCode] - Código de cupón (opcional)
     * @param {boolean} data.hasAdvancePayment - Si tiene pago por adelantado
     * @param {string} data.paymentDate - Fecha del pago en formato ISO
     * @param {string} [data.currency] - Moneda (opcional)
     * @param {string} [data.cardType] - Tipo de tarjeta (opcional)
     * @param {string} [data.cardNumber] - Número de tarjeta (opcional)
     * @param {string} data.authorizationTransactionId - ID de transacción
     * @param {string} data.paymentMethod - Método de pago (W: Webpay, T: Transferencia, etc)
     * @param {string} data.idOrderNumber - ID de la orden
     * @returns {Promise<Object>} Respuesta de la API
     */
    async pay(data) {
        try {
            console.log('\n💳 [OzyTrip] Iniciando proceso de pago...');
            console.log('📝 [OzyTrip] Parámetros de entrada:', JSON.stringify(data, null, 2));

            // Validar campos obligatorios
            const requiredFields = [
                'idBooking',
                'totalAmount',
                'paymentDate',
                'authorizationTransactionId',
                'paymentMethod',
                'idOrderNumber'
            ];

            console.log('\n🔍 [OzyTrip] Validando campos obligatorios...');
            const missingFields = requiredFields.filter(field => !data[field]);
            if (missingFields.length > 0) {
                console.error('❌ [OzyTrip] Campos obligatorios faltantes:', missingFields);
                throw new Error(`Campos obligatorios faltantes: ${missingFields.join(', ')}`);
            }
            console.log('✅ [OzyTrip] Campos obligatorios validados');

            // Validar formato de fecha
            console.log('\n🔍 [OzyTrip] Validando formato de fecha...');
            const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/;
            if (!dateRegex.test(data.paymentDate)) {
                console.error('❌ [OzyTrip] Formato de fecha inválido:', data.paymentDate);
                throw new Error('Formato de fecha inválido. Debe ser yyyy-MM-ddThh:mm:ss');
            }
            console.log('✅ [OzyTrip] Formato de fecha válido');

            // Validar monto total
            if (typeof data.totalAmount !== 'number' || data.totalAmount <= 0) {
                console.error('❌ [OzyTrip] Monto total inválido:', data.totalAmount);
                throw new Error('El monto total debe ser un número positivo');
            }

            // Obtener token
            console.log('\n🔑 [OzyTrip] Obteniendo token...');
            const token = await this.getToken();
            if (!token) {
                throw new Error('No se pudo obtener el token de autenticación');
            }
            console.log('✅ [OzyTrip] Token obtenido exitosamente');

            // Preparar la petición
            const url = `${this.apiUrl}/api/v1/pay`;
            console.log('\n🌐 [OzyTrip] URL de la petición:', url);
            console.log('📤 [OzyTrip] Enviando petición al servidor con headers:', {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer [TOKEN]',
                'Accept': 'application/json'
            });

            // Realizar la petición
            const response = await axios.post(url, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            console.log('\n✅ [OzyTrip] Respuesta recibida del servidor:', {
                status: response.status,
                statusText: response.statusText,
                hasData: !!response.data,
                headers: response.headers
            });

            if (response.status === 200) {
                console.log('✅ [OzyTrip] Pago procesado exitosamente');
                return response.data || { 
                    idBooking: data.idBooking, 
                    status: 'success',
                    paymentDate: data.paymentDate,
                    totalAmount: data.totalAmount
                };
            } else {
                throw new Error('No se recibió una respuesta válida del servidor');
            }

        } catch (error) {
            console.error('\n❌ [OzyTrip] Error al procesar el pago:', {
                message: error.message,
                code: error.code,
                response: error.response?.data || 'No hay datos de respuesta'
            });

            if (error.response?.data) {
                throw new Error(`Error al procesar el pago: ${error.response.data.message || error.message}`);
            }
            throw error;
        }
    }
}

// Exportar una instancia única del servicio
export const ozyTripService = new OzyTripService();

// No exportar las funciones individuales ya que están disponibles a través de ozyTripService 