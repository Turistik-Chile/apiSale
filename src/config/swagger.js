import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API de Ventas Turistik',
      version: '1.0.0',
      description: 'API para la gestión de ventas de Turistik',
      contact: {
        name: 'Soporte Turistik',
        email: 'soporte@turistik.com',
      },
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:2000/api/v1',
        description: process.env.NODE_ENV === 'production' ? 'Servidor de producción' : 'Servidor de desarrollo',
      },
    ],
    components: {
      securitySchemes: {
        basicAuth: {
          type: 'http',
          scheme: 'basic',
          description: 'Autenticación básica para acceder a los endpoints'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de error'
            },
            error: {
              type: 'string',
              description: 'Código de error'
            }
          }
        }
      }
    },
    security: [{
      basicAuth: []
    }],
    tags: [
      {
        name: 'Sales',
        description: 'Endpoints para la gestión de ventas'
      }
    ]
  },
  apis: ['./src/routes/*.js'],
};

export const specs = swaggerJsdoc(options); 