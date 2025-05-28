# Documentación API de Ventas

## Índice
1. [Introducción](#introducción)
2. [Formato de Respuesta](#formato-de-respuesta)
3. [Endpoints](#endpoints)
   - [Crear Venta](#crear-venta)
   - [Actualizar Venta](#actualizar-venta)
   - [Cancelar Item](#cancelar-item)
   - [Cancelar Venta Completa](#cancelar-venta-completa)
4. [Códigos de Estado](#códigos-de-estado)
5. [Manejo de Errores](#manejo-de-errores)

## Introducción

Esta API permite gestionar ventas y sus items asociados. Todas las operaciones se realizan utilizando el ID de venta del proveedor (`idSaleProvider`) como identificador principal.

## Formato de Respuesta

Todas las respuestas de la API siguen el siguiente formato estándar:

```json
{
  "status": "success | error",
  "message": "Mensaje descriptivo de la operación",
  "data": {
    // Datos de la respuesta (opcional)
  },
  "error": {
    // Información del error (solo en caso de error)
  },
  "timestamp": "2024-02-20T15:30:00.000Z"
}
```

## Endpoints

### Crear Venta

**POST** `/api/sales`

Crea una nueva venta con sus items asociados.

**Request Body:**
```json
{
  "provider": {
    "nombre": "cyt"
  },
  "custommer": {
    "name": "Elvis",
    "lastName": "Santeliz",
    "email": "ejemplo@email.com",
    "phoneNumber": "+56988889999",
    "country": "ve",
    "city": "santiago",
    "idioma": "español",
    "date": "2025-05-15",
    "time": "14:00:00",
    "qtypax": 4,
    "opt": "bebida",
    "total": 10000.9,
    "idSaleProvider": "PROV-123456",
    "itemsCart": [
      {
        "idItemEcommerce": "8fc92a28-e13d-41fd-b6a8-8974d4fb55ec"
      }
    ]
  }
}
```

**Respuesta Exitosa (201):**
```json
{
  "status": "success",
  "message": "Venta creada exitosamente",
  "data": {
    "Id": 1,
    "IdSaleProvider": "PROV-123456",
    "Status": "PENDING",
    // ... otros campos de la venta
    "CartItems": [
      {
        "Id": 1,
        "IdItemEcommerce": "8fc92a28-e13d-41fd-b6a8-8974d4fb55ec",
        "Status": "ACTIVE"
      }
    ]
  },
  "timestamp": "2024-02-20T15:30:00.000Z"
}
```

### Actualizar Venta

**PUT** `/api/sales/provider/:idSaleProvider`

Actualiza los datos de una venta existente.

**Request Body:**
```json
{
  "name": "Nuevo Nombre",
  "lastName": "Nuevo Apellido",
  "email": "nuevo@email.com",
  "phoneNumber": "+56977778888",
  "country": "cl",
  "city": "valparaíso",
  "idioma": "español",
  "date": "2025-06-15",
  "time": "15:00:00",
  "qtypax": 5,
  "opt": "almuerzo",
  "total": 12000.5
}
```

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Venta actualizada exitosamente",
  "data": {
    // Datos actualizados de la venta
  },
  "timestamp": "2024-02-20T15:35:00.000Z"
}
```

### Cancelar Item

**POST** `/api/sales/provider/:idSaleProvider/items/:itemId/cancel`

Cancela un item específico de una venta.

**Request Body:**
```json
{
  "reason": "Razón de la cancelación"
}
```

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Item cancelado exitosamente",
  "data": {
    "Id": 1,
    "IdSaleProvider": "PROV-123456",
    "Status": "ACTIVE",
    "CartItems": [
      {
        "Id": 1,
        "Status": "CANCELLED",
        "CancelReason": "Razón de la cancelación"
      }
    ]
  },
  "timestamp": "2024-02-20T15:40:00.000Z"
}
```

### Cancelar Venta Completa

**POST** `/api/sales/provider/:idSaleProvider/cancel`

Cancela una venta completa y todos sus items asociados.

**Request Body:**
```json
{
  "reason": "Razón de la cancelación"
}
```

**Respuesta Exitosa (200):**
```json
{
  "status": "success",
  "message": "Venta cancelada exitosamente",
  "data": {
    "Id": 1,
    "IdSaleProvider": "PROV-123456",
    "Status": "CANCELLED",
    "CancelReason": "Razón de la cancelación",
    "CartItems": [
      {
        "Id": 1,
        "Status": "CANCELLED",
        "CancelReason": "Cancelación completa de la venta"
      }
    ]
  },
  "timestamp": "2024-02-20T15:45:00.000Z"
}
```

## Códigos de Estado

- `200`: Operación exitosa
- `201`: Recurso creado exitosamente
- `400`: Error en la solicitud
- `404`: Recurso no encontrado
- `409`: Conflicto (por ejemplo, venta duplicada)
- `500`: Error interno del servidor

## Manejo de Errores

Cuando ocurre un error, la respuesta seguirá este formato:

```json
{
  "status": "error",
  "message": "Mensaje descriptivo del error",
  "error": {
    "code": "CÓDIGO_ERROR",
    "details": "Detalles adicionales del error"
  },
  "timestamp": "2024-02-20T15:50:00.000Z"
}
```

### Códigos de Error Comunes

- `SALE_NOT_FOUND`: Venta no encontrada
- `INVALID_SALE_STATUS`: Estado de venta inválido
- `DUPLICATE_PROVIDER_SALE_ID`: ID de venta duplicado
- `ITEM_NOT_FOUND`: Item no encontrado
- `ITEM_ALREADY_CANCELLED`: Item ya cancelado
- `MISSING_PROVIDER_SALE_ID`: Falta el ID de venta del proveedor 