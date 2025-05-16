export const validateJson = (err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Error en el formato JSON',
      error: 'INVALID_JSON_FORMAT',
      details: 'Asegúrate de que todas las propiedades y valores de texto estén entre comillas dobles'
    });
  }
  next();
}; 