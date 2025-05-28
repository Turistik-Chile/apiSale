/**
 * Middleware de autenticación básica
 * Verifica las credenciales en el header Authorization
 */
export const basicAuth = (req, res, next) => {
    // Obtener el header de autorización
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({
            message: 'Se requiere autenticación',
            error: 'MISSING_AUTH_HEADER'
        });
    }

    // El header debe comenzar con 'Basic '
    if (!authHeader.startsWith('Basic ')) {
        return res.status(401).json({
            message: 'Formato de autenticación inválido',
            error: 'INVALID_AUTH_FORMAT'
        });
    }

    // Obtener y decodificar las credenciales
    try {
        // Remover 'Basic ' y decodificar de base64
        const base64Credentials = authHeader.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
        const [username, password] = credentials.split(':');

        // Verificar las credenciales usando variables de entorno
        const validUsername = process.env.BASIC_AUTH_USERNAME;
        const validPassword = process.env.BASIC_AUTH_PASSWORD;

        if (!validUsername || !validPassword) {
            console.error('Credenciales de autenticación no configuradas en variables de entorno');
            return res.status(500).json({
                message: 'Error de configuración del servidor',
                error: 'AUTH_CONFIG_ERROR'
            });
        }

        if (username === validUsername && password === validPassword) {
            // Agregar el usuario a req para uso posterior si es necesario
            req.user = { username };
            next();
        } else {
            res.status(401).json({
                message: 'Credenciales inválidas',
                error: 'INVALID_CREDENTIALS'
            });
        }
    } catch (error) {
        res.status(401).json({
            message: 'Error al procesar las credenciales',
            error: 'AUTH_PROCESSING_ERROR'
        });
    }
}; 