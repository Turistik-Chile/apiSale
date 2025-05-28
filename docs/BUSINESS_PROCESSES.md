# Procesos de Negocio - API de Ventas

## Flujo de Venta

### 1. Creación de Venta
1. El cliente envía los datos de la venta incluyendo:
   - Información del proveedor
   - Información del cliente
   - Detalles de la reserva (fecha, hora, cantidad de pasajeros)
   - Items del carrito
2. El sistema valida:
   - Formato y obligatoriedad de los datos
   - Duplicidad del ID de venta del proveedor
   - Formato de fecha y hora
3. Se genera un ID seguro (secureId) con formato: TUR-YYYYMMDD-XXXX
4. Se crea la venta en estado "PROCESSING"
5. Se crean los items del carrito asociados

### 2. Actualización de Venta
1. Se permite actualizar:
   - Datos del cliente
   - Fecha y hora
2. Restricciones:
   - No se pueden modificar ventas canceladas o reembolsadas
   - Se mantiene registro de la fecha de actualización

### 3. Gestión de Pasajeros
1. Actualización de cantidad:
   - Se puede reducir la cantidad de pasajeros
   - No se puede exceder la cantidad original
2. Estados de los items:
   - Al cancelar pasajeros, se cancelan items correspondientes
   - Se mantiene registro del motivo de cancelación

### 4. Cancelación de Venta
1. Cancelación total:
   - Se cancelan todos los items activos
   - Se marca la venta como "CANCELLED"
   - Se registra el motivo de cancelación
2. Cancelación parcial:
   - Se mantiene el estado "PROCESSING" si quedan pasajeros
   - Se cambia a "CANCELLED" si se cancelan todos los pasajeros

## Estados de Venta

### PROCESSING
- Estado inicial al crear la venta
- Indica que la venta está activa y puede ser modificada
- Se mantiene mientras haya pasajeros activos

### CANCELLED
- Indica cancelación total de la venta
- Se alcanza cuando:
  - Se solicita cancelación explícita
  - Se cancelan todos los pasajeros
- No permite modificaciones posteriores

### REFUNDED
- Estado especial para ventas reembolsadas
- No permite modificaciones
- Requiere proceso administrativo adicional

## Validaciones Principales

### Datos de Cliente
- Email: Formato válido de correo electrónico
- País: Código ISO de 2 letras (ej: CL, VE)
- Teléfono: Formato internacional con prefijo

### Fecha y Hora
- Fecha: Formato YYYY-MM-DD
- Hora: Formato HH:MM:SS (24 horas)
- Validaciones de coherencia temporal

### Items de Carrito
- ID de item: UUID v4 válido
- Al menos un item por venta
- Estado individual por item

## Consideraciones Técnicas

### Seguridad
- Autenticación básica requerida
- Validación de datos en cada operación
- Registro de cambios y auditoría

### Transacciones
- Operaciones atómicas con rollback
- Manejo de concurrencia
- Consistencia en estados de items

### Identificadores
- secureId: Formato TUR-YYYYMMDD-XXXX
- idSaleProvider: ID único por proveedor
- Doble indexación para búsquedas eficientes 