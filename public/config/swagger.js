import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
const swaggerDefinition = {
    openapi: '3.0.0',
    info: {
        title: 'FloresYa E-commerce API',
        version: '2.0.0',
        description: 'Complete REST API for FloresYa flower delivery e-commerce platform',
        contact: {
            name: 'FloresYa Development Team',
            email: 'dev@floresya.com'
        },
        license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT'
        }
    },
    servers: [
        {
            url: 'https://ecommerce-floresya-7-16zfl2ki9-floresyas-projects.vercel.app',
            description: 'Production server'
        },
        {
            url: 'http://localhost:3000',
            description: 'Development server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT'
            }
        },
        schemas: {
            Product: {
                type: 'object',
                required: ['id', 'name', 'description', 'price_usd', 'stock', 'active'],
                properties: {
                    id: {
                        type: 'integer',
                        description: 'Unique product identifier',
                        example: 1
                    },
                    name: {
                        type: 'string',
                        description: 'Product name',
                        minLength: 2,
                        maxLength: 200,
                        example: 'Beautiful Red Roses Bouquet'
                    },
                    summary: {
                        type: 'string',
                        description: 'Short product summary',
                        maxLength: 500,
                        example: 'A stunning arrangement of 12 red roses perfect for any occasion'
                    },
                    description: {
                        type: 'string',
                        description: 'Detailed product description',
                        minLength: 10,
                        maxLength: 2000,
                        example: 'This exquisite bouquet features 12 premium red roses carefully arranged with baby\'s breath and elegant greenery. Perfect for anniversaries, Valentine\'s Day, or any romantic occasion.'
                    },
                    price_usd: {
                        type: 'number',
                        format: 'decimal',
                        minimum: 0,
                        description: 'Product price in USD',
                        example: 45.99
                    },
                    price_ves: {
                        type: 'number',
                        format: 'decimal',
                        description: 'Product price in Venezuelan Bolivar (optional)',
                        example: 1800000.00
                    },
                    stock: {
                        type: 'integer',
                        minimum: 0,
                        description: 'Available stock quantity',
                        example: 25
                    },
                    sku: {
                        type: 'string',
                        description: 'Stock Keeping Unit',
                        maxLength: 100,
                        example: 'ROS-RED-12'
                    },
                    active: {
                        type: 'boolean',
                        description: 'Whether the product is active and available for purchase',
                        default: true,
                        example: true
                    },
                    featured: {
                        type: 'boolean',
                        description: 'Whether the product is featured on the homepage',
                        default: false,
                        example: false
                    },
                    carousel_order: {
                        type: 'integer',
                        minimum: 1,
                        description: 'Display order in homepage carousel (null if not in carousel)',
                        example: 1
                    },
                    occasion_id: {
                        type: 'integer',
                        description: 'Associated occasion ID',
                        example: 2
                    },
                    category: {
                        type: 'string',
                        description: 'Product category',
                        maxLength: 100,
                        example: 'Roses'
                    },
                    care_instructions: {
                        type: 'string',
                        description: 'Care and maintenance instructions',
                        example: 'Keep in cool place, change water every 2 days, add flower food'
                    },
                    created_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Product creation timestamp',
                        example: '2024-01-15T10:30:00Z'
                    },
                    updated_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Product last update timestamp',
                        example: '2024-01-15T14:20:00Z'
                    }
                }
            },
            Occasion: {
                type: 'object',
                required: ['id', 'name', 'type', 'slug', 'is_active'],
                properties: {
                    id: {
                        type: 'integer',
                        description: 'Unique occasion identifier',
                        example: 1
                    },
                    name: {
                        type: 'string',
                        description: 'Occasion name',
                        example: 'Birthday'
                    },
                    type: {
                        type: 'string',
                        enum: ['general', 'birthday', 'anniversary', 'wedding', 'sympathy', 'congratulations'],
                        description: 'Occasion type',
                        example: 'birthday'
                    },
                    description: {
                        type: 'string',
                        description: 'Occasion description',
                        example: 'Celebrate someone\'s special day with beautiful flowers'
                    },
                    is_active: {
                        type: 'boolean',
                        description: 'Whether the occasion is active',
                        default: true,
                        example: true
                    },
                    display_order: {
                        type: 'integer',
                        description: 'Display order for sorting',
                        default: 0,
                        example: 1
                    },
                    slug: {
                        type: 'string',
                        description: 'URL-friendly identifier',
                        example: 'birthday'
                    },
                    created_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Occasion creation timestamp'
                    },
                    updated_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Occasion last update timestamp'
                    }
                }
            },
            Order: {
                type: 'object',
                required: ['id', 'customer_email', 'customer_name', 'delivery_address', 'status', 'total_amount_usd'],
                properties: {
                    id: {
                        type: 'integer',
                        description: 'Unique order identifier',
                        example: 1234
                    },
                    user_id: {
                        type: 'integer',
                        description: 'Associated user ID (null for guest orders)',
                        example: 42
                    },
                    customer_email: {
                        type: 'string',
                        format: 'email',
                        description: 'Customer email address',
                        example: 'customer@example.com'
                    },
                    customer_name: {
                        type: 'string',
                        description: 'Customer full name',
                        example: 'María González'
                    },
                    customer_phone: {
                        type: 'string',
                        description: 'Customer phone number',
                        example: '+58 412 123 4567'
                    },
                    delivery_address: {
                        type: 'string',
                        description: 'Delivery address',
                        example: 'Calle Principal 123, Caracas, Venezuela'
                    },
                    delivery_city: {
                        type: 'string',
                        description: 'Delivery city',
                        example: 'Caracas'
                    },
                    delivery_state: {
                        type: 'string',
                        description: 'Delivery state/province',
                        example: 'Distrito Capital'
                    },
                    delivery_zip: {
                        type: 'string',
                        description: 'Delivery postal code',
                        example: '1010'
                    },
                    delivery_date: {
                        type: 'string',
                        format: 'date',
                        description: 'Requested delivery date',
                        example: '2024-01-20'
                    },
                    delivery_time_slot: {
                        type: 'string',
                        description: 'Preferred delivery time slot',
                        example: '10:00-12:00'
                    },
                    delivery_notes: {
                        type: 'string',
                        description: 'Special delivery instructions',
                        example: 'Please ring the doorbell twice'
                    },
                    status: {
                        type: 'string',
                        enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
                        description: 'Order status',
                        example: 'confirmed'
                    },
                    total_amount_usd: {
                        type: 'number',
                        format: 'decimal',
                        minimum: 0,
                        description: 'Total order amount in USD',
                        example: 89.99
                    },
                    total_amount_ves: {
                        type: 'number',
                        format: 'decimal',
                        description: 'Total order amount in VES',
                        example: 3500000.00
                    },
                    currency_rate: {
                        type: 'number',
                        format: 'decimal',
                        description: 'USD to VES exchange rate used',
                        example: 38950.00
                    },
                    notes: {
                        type: 'string',
                        description: 'Order notes',
                        example: 'Customer requested extra wrapping'
                    },
                    admin_notes: {
                        type: 'string',
                        description: 'Internal admin notes',
                        example: 'VIP customer - ensure premium service'
                    },
                    created_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Order creation timestamp'
                    },
                    updated_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Order last update timestamp'
                    }
                }
            },
            ProductImage: {
                type: 'object',
                required: ['id', 'product_id', 'image_index', 'size', 'url', 'file_hash', 'mime_type'],
                properties: {
                    id: {
                        type: 'integer',
                        description: 'Unique image identifier',
                        example: 123
                    },
                    product_id: {
                        type: 'integer',
                        description: 'Associated product ID',
                        example: 45
                    },
                    image_index: {
                        type: 'integer',
                        minimum: 1,
                        description: 'Image position/order for the product',
                        example: 1
                    },
                    size: {
                        type: 'string',
                        enum: ['thumb', 'small', 'medium', 'large'],
                        description: 'Image size variant',
                        example: 'medium'
                    },
                    url: {
                        type: 'string',
                        format: 'uri',
                        description: 'Image URL',
                        example: 'https://example.com/images/products/45/medium/image1.jpg'
                    },
                    file_hash: {
                        type: 'string',
                        description: 'File hash for integrity verification',
                        example: 'a1b2c3d4e5f6...'
                    },
                    mime_type: {
                        type: 'string',
                        description: 'Image MIME type',
                        example: 'image/webp'
                    },
                    is_primary: {
                        type: 'boolean',
                        description: 'Whether this is the primary image for the product',
                        default: false,
                        example: true
                    },
                    created_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Image upload timestamp'
                    },
                    updated_at: {
                        type: 'string',
                        format: 'date-time',
                        description: 'Image last update timestamp'
                    }
                }
            },
            ApiResponse: {
                type: 'object',
                properties: {
                    success: {
                        type: 'boolean',
                        description: 'Whether the request was successful',
                        example: true
                    },
                    message: {
                        type: 'string',
                        description: 'Response message',
                        example: 'Operation completed successfully'
                    },
                    data: {
                        type: 'object',
                        description: 'Response data (varies by endpoint)',
                        additionalProperties: true
                    },
                    error: {
                        type: 'string',
                        description: 'Error message (only present when success is false)',
                        example: 'Validation failed'
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
                        description: 'Error message',
                        example: 'Product not found'
                    },
                    error: {
                        type: 'string',
                        description: 'Detailed error information',
                        example: 'No product found with ID 123'
                    }
                }
            }
        }
    },
    security: [
        {
            bearerAuth: []
        }
    ],
    tags: [
        {
            name: 'Products',
            description: 'Product management endpoints'
        },
        {
            name: 'Orders',
            description: 'Order management endpoints'
        },
        {
            name: 'Occasions',
            description: 'Occasion management endpoints'
        },
        {
            name: 'Images',
            description: 'Product image management endpoints'
        },
        {
            name: 'Logs',
            description: 'Frontend logging endpoints'
        }
    ]
};
const options = {
    definition: swaggerDefinition,
    apis: [
        './src/controllers/*.ts',
        './src/routes/*.ts',
        './src/app/server.ts'
    ]
};
const swaggerSpec = swaggerJSDoc(options);
export { swaggerUi, swaggerSpec };
export default swaggerSpec;
