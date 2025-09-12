// backend/src/config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

// Definición de la especificación OpenAPI
const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'FloresYa API',
            version: '1.0.0',
            description: 'API para la gestión de productos, categorías, pedidos y más para FloresYa, tu floristería en línea.',
            contact: {
                name: 'Soporte FloresYa',
                email: 'soporte@floresya.com'
            }
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Servidor de Desarrollo'
            },
            {
                url: 'https://your-production-url.com/api', // Reemplaza esto con tu URL de producción
                description: 'Servidor de Producción'
            }
        ],
        components: {
            schemas: {
                // Aquí puedes definir esquemas reutilizables
                Product: {
                    type: 'object',
                    required: ['name', 'price'],
                    properties: {
                        id: {
                            type: 'integer',
                            description: 'ID único del producto'
                        },
                        name: {
                            type: 'string',
                            description: 'Nombre del producto'
                        },
                        description: {
                            type: 'string',
                            description: 'Descripción del producto'
                        },
                        price: {
                            type: 'number',
                            format: 'float',
                            description: 'Precio del producto'
                        },
                        stock_quantity: {
                            type: 'integer',
                            description: 'Cantidad en stock'
                        },
                        featured: {
                            type: 'boolean',
                            description: 'Indica si el producto es destacado'
                        },
                        active: {
                            type: 'boolean',
                            description: 'Indica si el producto está activo'
                        },
                        occasion: {
                            type: 'string',
                            description: 'Ocasión a la que está asociado el producto'
                        },
                        created_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de creación'
                        },
                        updated_at: {
                            type: 'string',
                            format: 'date-time',
                            description: 'Fecha de última actualización'
                        },
                        images: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    id: { type: 'integer' },
                                    url_large: { type: 'string' },
                                    url_medium: { type: 'string' },
                                    url_small: { type: 'string' },
                                    url_thumb: { type: 'string' },
                                    is_primary: { type: 'boolean' },
                                    display_order: { type: 'integer' },
                                    width: { type: 'integer' },
                                    height: { type: 'integer' }
                                }
                            }
                        }
                    }
                }
                // Puedes añadir más esquemas aquí: Order, Category, Occasion, etc.
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    // Rutas donde buscar los comentarios JSDoc
    apis: [
        './backend/src/routes/*.js',     // Rutas
        './backend/src/controllers/*.js' // Controladores (¡Aquí es donde documentarás tus endpoints!)
    ]
};

// Generar la especificación
const specs = swaggerJSDoc(options);

// Exportar la configuración de Swagger UI
import swaggerUi from 'swagger-ui-express';

export { swaggerUi, specs };
