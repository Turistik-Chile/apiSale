/**
 * Middleware para estandarizar las respuestas de la API
 */
export const responseHandler = () => {
  return (req, res, next) => {
    // Sobreescribir los métodos de respuesta
    const originalJson = res.json;
    const originalStatus = res.status;
    let statusCode = 200;

    // Sobreescribir status para capturar el código
    res.status = function(code) {
      statusCode = code;
      return originalStatus.apply(this, arguments);
    };

    // Sobreescribir json para estandarizar la respuesta
    res.json = function(data) {
      const response = {
        status: statusCode >= 200 && statusCode < 300 ? 'success' : 'error',
        message: data.message || '',
        data: data.data || null,
        error: statusCode >= 400 ? (data.error || null) : null,
        timestamp: new Date().toISOString()
      };

      return originalJson.call(this, response);
    };

    next();
  };
}; 