const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FloresYa API',
      version: '1.0.0',
      description: 'API documentation for FloresYa - Tu floristería en línea',
      contact: {
        name: 'FloresYa Support',
        email: 'support@floresya.com',
        url: 'https://floresya.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'https://floresya.com/api'
          : 'http://localhost:3000/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
    components: {
      schemas: {
        Product: {
          type: 'object',
          required: ['name', 'price', 'category_id'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the product',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Product name',
              example: 'Ramo de Rosas Rojas'
            },
            description: {
              type: 'string',
              description: 'Product description',
              example: 'Hermoso ramo de 12 rosas rojas frescas'
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Product price in USD',
              example: 29.99
            },
            image_url: {
              type: 'string',
              description: 'URL of the product image',
              example: '/uploads/products/rosas-rojas.jpg'
            },
            category_id: {
              type: 'integer',
              description: 'Category identifier',
              example: 1
            },
            occasion_id: {
              type: 'integer',
              description: 'Occasion identifier',
              example: 2
            },
            is_featured: {
              type: 'boolean',
              description: 'Whether the product is featured',
              example: true
            },
            stock_quantity: {
              type: 'integer',
              description: 'Available stock quantity',
              example: 50
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Creation timestamp',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Category: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the category',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Category name',
              example: 'Ramos'
            },
            description: {
              type: 'string',
              description: 'Category description',
              example: 'Hermosos ramos de flores para toda ocasión'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Occasion: {
          type: 'object',
          required: ['name'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the occasion',
              example: 1
            },
            name: {
              type: 'string',
              description: 'Occasion name',
              example: 'San Valentín'
            },
            description: {
              type: 'string',
              description: 'Occasion description',
              example: 'Flores perfectas para celebrar el amor'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Order: {
          type: 'object',
          required: ['customer_name', 'customer_email', 'total'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the order',
              example: 1
            },
            order_number: {
              type: 'string',
              description: 'Unique order number',
              example: 'ORD-2024-001'
            },
            customer_name: {
              type: 'string',
              description: 'Customer full name',
              example: 'María González'
            },
            customer_email: {
              type: 'string',
              format: 'email',
              description: 'Customer email address',
              example: 'maria@example.com'
            },
            customer_phone: {
              type: 'string',
              description: 'Customer phone number',
              example: '+58 414 123 4567'
            },
            delivery_address: {
              type: 'string',
              description: 'Delivery address',
              example: 'Av. Principal, Casa #123, Caracas'
            },
            delivery_date: {
              type: 'string',
              format: 'date',
              description: 'Requested delivery date',
              example: '2024-02-14'
            },
            delivery_time: {
              type: 'string',
              description: 'Requested delivery time',
              example: '14:00'
            },
            total: {
              type: 'number',
              format: 'decimal',
              description: 'Order total amount',
              example: 89.97
            },
            status: {
              type: 'string',
              enum: ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
              description: 'Order status',
              example: 'confirmed'
            },
            payment_status: {
              type: 'string',
              enum: ['pending', 'paid', 'failed'],
              description: 'Payment status',
              example: 'paid'
            },
            payment_method: {
              type: 'string',
              description: 'Payment method used',
              example: 'credit_card'
            },
            special_instructions: {
              type: 'string',
              description: 'Special delivery instructions',
              example: 'Dejar en portería si no hay nadie'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        OrderItem: {
          type: 'object',
          required: ['product_id', 'quantity', 'price'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the order item',
              example: 1
            },
            order_id: {
              type: 'integer',
              description: 'Order identifier',
              example: 1
            },
            product_id: {
              type: 'integer',
              description: 'Product identifier',
              example: 1
            },
            quantity: {
              type: 'integer',
              description: 'Quantity ordered',
              example: 2
            },
            price: {
              type: 'number',
              format: 'decimal',
              description: 'Unit price at time of order',
              example: 29.99
            },
            subtotal: {
              type: 'number',
              format: 'decimal',
              description: 'Line item subtotal',
              example: 59.98
            }
          }
        },
        User: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            id: {
              type: 'integer',
              description: 'Unique identifier for the user',
              example: 1
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
              example: 'user@example.com'
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'User password (hashed)',
              writeOnly: true
            },
            name: {
              type: 'string',
              description: 'User full name',
              example: 'Juan Pérez'
            },
            role: {
              type: 'string',
              enum: ['user', 'admin'],
              description: 'User role',
              example: 'user'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              example: 'Error message description'
            },
            error: {
              type: 'string',
              example: 'Detailed error information'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        },
        Success: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            message: {
              type: 'string',
              example: 'Operation completed successfully'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              example: '2024-01-15T10:30:00Z'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ForbiddenError: {
          description: 'Access forbidden - insufficient privileges',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error - invalid input data',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          name: 'page',
          in: 'query',
          description: 'Page number for pagination',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          }
        },
        LimitParam: {
          name: 'limit',
          in: 'query',
          description: 'Number of items per page',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20
          }
        },
        SearchParam: {
          name: 'search',
          in: 'query',
          description: 'Search query string',
          required: false,
          schema: {
            type: 'string'
          }
        },
        CategoryParam: {
          name: 'category',
          in: 'query',
          description: 'Filter by category ID',
          required: false,
          schema: {
            type: 'integer'
          }
        },
        OccasionParam: {
          name: 'occasion',
          in: 'query',
          description: 'Filter by occasion ID',
          required: false,
          schema: {
            type: 'integer'
          }
        },
        SortParam: {
          name: 'sort',
          in: 'query',
          description: 'Sort field',
          required: false,
          schema: {
            type: 'string',
            enum: ['name', 'price', 'created_at', 'updated_at'],
            default: 'created_at'
          }
        },
        OrderParam: {
          name: 'order',
          in: 'query',
          description: 'Sort order',
          required: false,
          schema: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'desc'
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

const swaggerOptions = {
  explorer: true,
  swaggerOptions: {
    docExpansion: 'list',
    filter: true,
    showRequestDuration: true,
    tryItOutEnabled: true,
    requestInterceptor: (req) => {
      // Add request logging if needed
      console.log('Swagger API Request:', req.method, req.url);
      return req;
    }
  },
  customSiteTitle: 'FloresYa API Documentation',
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info { margin: 50px 0; }
    .swagger-ui .info .title { color: #28a745; }
    .swagger-ui .scheme-container { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
  `,
  customJsStr: `
    console.log("FloresYa API Documentation Loaded");
  `
};

module.exports = {
  specs,
  swaggerUi,
  swaggerOptions
};