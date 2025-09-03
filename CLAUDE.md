# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development Workflow
```bash
# Initialize database and start development server
npm run dev

# Start demo mode with sample data (recommended for testing)
npm run demo

# Production start
npm start

# Reset and rebuild database from scratch
npm run db:reset

# Lint code
npm run lint

# Run tests
npm test
```

### Database Management Scripts
Located in `backend/src/scripts/`:
- `init-db.js` - Complete database initialization with tables and sample data
- `reset-db.js` - Complete database reset and recreation
- Run individual scripts with: `node backend/src/scripts/[script-name].js`

### Development Access
- **Admin Panel**: `/pages/admin.html`
- **Quick Login Credentials**:
  - Admin: `admin@floresya.com` / `admin123`
  - Customer: `cliente@ejemplo.com` / `customer123`
- **API Health Check**: `/api/health`

## Architecture Overview

### Database Architecture
- **Primary Database**: PostgreSQL via Supabase (production) with Sequelize ORM
- **Development**: Can fallback to local PostgreSQL but Supabase preferred
- **NO SQLite support** - PostgreSQL/Supabase exclusive architecture
- **Key Tables**: occasions (replaces categories), products, users, orders, payments, payment_methods

### API Architecture
**Dual Entry Points for Deployment**:
1. **Development**: `backend/src/server.js` (Express server)
2. **Production**: `api/index.js` (Vercel serverless function)

The production entry point imports all routes from the backend directory. **Critical**: When adding new routes, ensure they're registered in BOTH `backend/src/server.js` AND `api/index.js`.

### Frontend Architecture
- **Type**: Vanilla JavaScript SPA with modular architecture
- **Key Modules**:
  - `main.js` - Core app logic, initialization, dev mode handling
  - `api.js` - API communication layer
  - `auth.js` - Authentication with auto-login dev buttons
  - `cart.js` - Shopping cart management
  - `admin.js` - Administrative panel

### Venezuelan E-commerce Specifics
- **Payment Methods**: Pago Móvil, Zelle, Binance Pay, Bank Transfer
- **Occasions System**: Products organized by occasions (birthdays, Valentine's, etc.) instead of traditional categories
- **Dual Purchase Modes**: Traditional cart + one-click "FloresYa" instant purchase
- **Guest Checkout**: Full checkout process without user registration

## Development vs Production Differences

### Development Mode Features
- **Dev Menu**: Visible in navbar with admin shortcuts and API testing
- **Auto-login Buttons**: Pre-fill login forms with test credentials
- **Console Logging**: Verbose application state logging
- **Dev-only Sections**: Hidden automatically in production

### Production Optimizations
- **Dev Menu**: Automatically hidden on vercel.app, floresya.com domains
- **Serverless**: Runs on Vercel with lazy initialization
- **Security**: Enhanced headers, rate limiting, minimal error exposure

### Environment Detection
Production environment detected by hostname:
- `vercel.app` domains
- `floresya.com` and `www.floresya.com`

## Critical Configuration Files

### Vercel Deployment (`vercel.json`)
- **Static Build**: Frontend served via CDN
- **Serverless API**: All `/api/*` routes handled by `api/index.js`
- **Route Fallback**: SPA routing via `frontend/index.html`

### Database Configuration
Located in `backend/src/config/database.js`:
- **Primary**: Supabase client with PostgreSQL connection
- **Fallback**: Direct PostgreSQL connection
- **SSL**: Required for production connections

### Environment Variables Required
```env
# Database (Supabase preferred)
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Traditional PostgreSQL (fallback)
DB_HOST=localhost
DB_NAME=floresya_db
DB_USER=root
DB_PASSWORD=password

# Security
JWT_SECRET=your_jwt_secret

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password
```

## Key Implementation Patterns

### API Route Structure
**Authentication Levels**:
- Public routes (products, occasions, health)
- Protected routes (orders, profile) - require JWT
- Admin routes (admin panel APIs) - require admin role

### Frontend State Management
- **No Framework**: Pure JavaScript with class-based modules
- **Initialization**: `main.js` coordinates all module initialization
- **API Layer**: Centralized in `api.js` with consistent error handling
- **Dev Tools**: Built-in development utilities and debug modes

### Image and File Handling
- **Upload Directory**: `/uploads/` with subdirectories by type
- **Image Processing**: Sharp library for optimization
- **Fallbacks**: Placeholder images for missing content
- **Lazy Loading**: Automatic lazy loading optimization

### Payment Processing Flow
1. **Order Creation**: Creates order with pending status
2. **Payment Submission**: File upload for payment proof
3. **Admin Verification**: Manual verification via admin panel
4. **Status Updates**: Automatic email notifications
5. **Order Fulfillment**: Status progression through workflow

## Special Considerations

### Spanish Localization
- All user-facing content in Spanish
- Venezuelan-specific payment methods and terminology
- Currency handling (USD/BsS with BCV exchange rates)

### Performance Optimizations
- **FOUC Prevention**: CSS visibility controls with `stylesheets-loaded` class
- **Layout Optimization**: RequestAnimationFrame for DOM modifications
- **Console Filtering**: Suppress expected Cloudflare CDN warnings
- **Lazy Loading**: Automatic image lazy loading

### Security Features
- **Rate Limiting**: 100 requests per 15 minutes
- **CORS**: Environment-specific origin controls
- **Helmet**: Comprehensive security headers
- **Input Validation**: Express-validator with sanitization
- **File Upload Limits**: 10MB max with type restrictions

## Common Development Tasks

### Adding New Routes
1. Create controller in `backend/src/controllers/`
2. Create route file in `backend/src/routes/`
3. Register in `backend/src/server.js`
4. **Critical**: Also register in `api/index.js` for production

### Database Schema Changes
1. Use Supabase dashboard for production changes
2. Update Sequelize models in `backend/src/models/`
3. Run `npm run db:reset` for local development

### Adding Payment Methods
1. Update `payment_methods` table configuration
2. Add UI form in `frontend/js/payment.js`
3. Add validation in payment controller
4. Update admin verification interface

### Frontend Module Development
1. Follow existing module pattern (see `auth.js` example)
2. Initialize in `main.js` app initialization sequence
3. Use centralized `api.js` for backend communication
4. Handle both development and production modes

## Scripts and Utilities

### Maintenance Scripts
- **Git Push**: `./gitpush.sh` - Automated commit and push with formatting
- **Cleanup**: `./cleanup.sh` - Remove temporary files and optimize project

### Database Utilities
All located in `backend/src/scripts/`:
- **init-db.js**: Full database initialization
- **seed-categories.js**: Load default occasions/categories
- **add-products.js**: Sample product data
- **process-product-images.js**: Batch image optimization