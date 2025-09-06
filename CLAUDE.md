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

# Quick server scripts (kill port 3000 processes and start)
./ss.sh                  # Comprehensive server startup with checks
./qs.sh                  # Fast restart (kills port 3000 and starts demo)
```

### Server Management Scripts
- `ss.sh` (start-server) - Complete server startup script with port cleanup and dependency checks
- `qs.sh` (quick-start) - Fast server restart script for development
- Both scripts automatically kill processes using port 3000 before starting the server
- Use `./ss.sh` for first-time setup, `./qs.sh` for quick restarts

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
  - `product-detail.js` - Enhanced product page functionality
  - `product-gamification.js` - Advanced UX gamification system
  - `product-image-hover.js` - Interactive image hover effects
  - `dali-loader.js` - Surreal loading animation system
  - `advanced-conversion-optimizer.js` - Psychology-based conversion techniques
  - `intelligent-cross-sell.js` - AI-like recommendation engine
  - `one-click-express-checkout.js` - Streamlined checkout process
  - `strategic-buy-buttons.js` - Multi-positioned conversion buttons system

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
- **Responsive Images**: Multi-resolution system with srcset
- **Hover Effects**: Sequential image switching on product cards
- **Image Variations**: Local enhanced images for gamification

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
- **Gamification Engine**: Optimized animations and micro-interactions
- **Loading Animations**: Surreal Dalí-inspired loading experience
- **CSS Animations**: Hardware-accelerated transforms and effects

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

### Debug and Troubleshooting Tools
- **CSS Visibility Fix** (`css-visibility-fix.js`): Comprehensive FOUC prevention and visibility debugging
- **CSS Debug** (`css-debug.js`): Real-time CSS application monitoring and stylesheet validation
- **Debug Fix** (`debug-fix.js`): DOM element verification and function monitoring for product detail page
- **Professional Layout Fix** (`professional-layout-fix.css`): Layout stabilization and cross-browser compatibility

## Recent Fixes and Issues Resolved

### JSON Parsing Issues (2025-09-03)
- **Issue**: 500 Internal Server Error on `/api/orders/my-orders` due to JSON parsing errors
- **Cause**: `JSON.parse()` being called on data that was already parsed as objects from Supabase
- **Solution**: Created `safeParse()` helper function in `orderController.js` that handles both string and object data
- **Files Modified**: 
  - `backend/src/controllers/orderController.js:10-21` - Added safeParse helper
  - `backend/src/controllers/orderController.js:223-227,278-279` - Applied safeParse to shipping/billing addresses and product snapshots

### Cross-Origin Stylesheet Access Fix
- **Issue**: Console errors for cross-origin CSS access from CDN stylesheets
- **Solution**: Added try-catch blocks in `waitForStylesheets()` function in `main.js`
- **Files Modified**: `frontend/js/main.js` - Enhanced stylesheet loading error handling

### Dropdown Synchronization Enhancement
- **Issue**: Occasions dropdown in navbar not synchronized with filter dropdown
- **Solution**: Implemented bidirectional synchronization in `filterByOccasionId()` function
- **Features Added**: 
  - "Todas las ocasiones" option in both dropdowns
  - Proper icon styling and visual feedback
  - Event delegation for dynamic content
- **Files Modified**: 
  - `frontend/js/main.js:160-180` - Enhanced dropdown population
  - `frontend/js/main.js:filterByOccasionId()` - Bidirectional sync
  - `frontend/index.html` - Updated navbar dropdown structure

### Admin Panel Access
- **Feature Added**: Admin panel option in user dropdown menu
- **Implementation**: Role-based visibility in auth.js
- **Files Modified**:
  - `frontend/index.html` - Added admin panel menu item
  - `frontend/js/auth.js:updateAuthState()` - Role-based visibility logic

### Dev/Prod Mode Toggle
- **Feature Added**: Development/Production mode toggle in navbar
- **Implementation**: Environment detection and UI toggle
- **Files Modified**: `frontend/index.html` - Added mode toggle button

## Advanced User Experience Features (2025-09-05)

### Surreal Loading Animation System
- **Feature**: Dalí-inspired loading animation with gamification elements
- **Implementation**: Custom CSS animations with pickup truck, flowers, and surreal landscape
- **Files Created**:
  - `frontend/js/dali-loader.js` - Main animation logic and Supabase image detection
  - Integrated into `frontend/index.html` 
- **Features**:
  - Automatic detection of Supabase image loading
  - Minimum 2-second display for user appreciation
  - Rotating persuasive messages to retain users
  - Surreal visual elements: melting clouds, distorted ground, bouncing flowers

### Interactive Product Image Hover System
- **Feature**: Sequential image switching on mouse movement over product cards
- **Implementation**: Advanced hover detection with settlement timing and debouncing
- **Files Created**:
  - `frontend/js/product-image-hover.js` - Core hover functionality
  - `frontend/images/products/` - Enhanced image variations (zoom, bright, vivid)
- **Features**:
  - Mouse settlement detection (400ms) before activation
  - 12px movement threshold for intentional interaction detection
  - 800ms switching debounce for optimal user experience
  - Visual indicators showing current image (1/3, 2/3, etc.)
  - Dramatic transition effects with opacity, scale, and rotation

### Product Detail Page Gamification
- **Feature**: Enterprise-level UX gamification system inspired by AliExpress
- **Implementation**: Complete product page redesign with advanced conversion techniques
- **Files Created**:
  - `frontend/pages/product-detail.html` - Enhanced HTML structure
  - `frontend/css/product-detail-enhanced.css` - Advanced styling system
  - `frontend/js/product-gamification.js` - Gamification engine
- **Marketing Psychology Techniques Implemented**:
  
  #### Urgency & Scarcity Elements:
  - Live viewer counter with realistic fluctuations
  - Countdown timer with visual urgency indicators
  - Stock pressure bar showing limited availability
  - Dynamic view counter with incremental updates
  
  #### Social Proof & Trust Signals:
  - Star rating system with review counts
  - "Bestseller" badges with pulsing animations
  - Trust icons for guarantees and quality assurance
  - Real-time activity indicators ("12 personas viendo")
  
  #### Gamification & Achievement System:
  - Progress bars for user journey (Explorar → Personalizar → Finalizar)
  - Achievement unlocking for image exploration and customization
  - Visual feedback for all interactions
  - Reward notifications with toast animations
  
  #### Product Customization System:
  - Color selection for ribbons (4 options with visual previews)
  - Wrapping paper selection (3 options with pricing)
  - Personal message input with character counter gamification
  - Achievement unlocking for customization completion
  
  #### Enhanced Visual Design:
  - Glass morphism effects in navigation
  - Gradient borders and rainbow effects for price sections
  - Micro-animations for all interactive elements
  - Hardware-accelerated CSS transforms
  - Mobile-responsive breakpoints optimized

### Image System Improvements
- **Issue Fixed**: Duplicate URL generation in responsive image system
- **Solution**: Enhanced URL processing with double-suffix detection and prevention
- **Files Modified**:
  - `frontend/js/responsive-image.js` - Improved getResponsiveUrls logic
  - `frontend/js/product-detail.js` - Smart thumbnail processing
- **Features**:
  - Automatic detection of pre-processed image URLs
  - Intelligent fallback for corrupted URLs
  - Enhanced debugging and error handling
  - Force visibility system for images with CSS conflicts

### Rate Limiting Resolution
- **Issue**: 429 Too Many Requests blocking product detail pages
- **Solution**: Server restart procedures and rate limiting optimization
- **Impact**: Improved user experience with faster page loads
- **Monitoring**: Added debugging systems for API request tracking

## Product Detail Page Optimization (2025-09-05)

### Complete Conversion Optimization Overhaul
- **Objective**: Transform product detail page into superlative customer experience for maximum "click buy" impulse
- **Approach**: Advanced marketing psychology + gamification + traditional e-commerce best practices
- **Target**: Venezuelan market with local payment methods and cultural preferences

#### Traditional E-commerce Elements Enhanced
- **Navigation Links**: Direct access to Inicio, Más Productos, Pagar Ahora, Productos Similares
- **Secondary Actions**: Enhanced Favoritos, Comparar, Consultar, Compartir buttons with tooltips
- **Stock Status System**: Dynamic availability indicators with `stock-available` and `stock-unavailable` elements
- **Payment Security Badges**: SSL, Pago Móvil, Zelle, Transferencia with visual trust signals
- **Traditional Breadcrumb**: Enhanced with icons and proper navigation hierarchy

#### Advanced Marketing Psychology Implementation
- **Conversion Banner**: Golden animated banner "¡MOMENTO PERFECTO PARA COMPRAR!"
- **Scarcity Triggers**: Dynamic stock counter that decreases automatically (25% -> 10%)
- **Social Proof**: Live counters showing "23+ personas compraron esto en las últimas 2 horas"
- **Urgency Elements**: 24-hour countdown timer with visual pressure indicators
- **Exit-Intent Modal**: "QUÉDATE10" discount code with 10% off for retention
- **Progressive Urgency**: Time-based messages at 30s, 60s, 90s, 120s intervals

#### Gamification System Enhancements
- **Achievement System**: Image exploration, customization completion, purchase decision tracking
- **Live Notifications**: Real-time activity simulation and user behavior feedback
- **Hover Psychology**: Button interaction tracking with motivational messages after 3rd and 5th hovers
- **Scroll Triggers**: Social statistics revealed at 50% and 80% scroll completion
- **Star Animations**: Periodic twinkling effects on rating stars for quality reinforcement
- **CTA Pulsing**: Automatic attention-grabbing animations when user hesitates

#### Visual Hierarchy & Conversion Optimization
- **Impulse Triggers Section**: Three animated trigger items with icons and urgency messaging
- **Trust Enhancement**: "5,847+ Clientes Felices" with 4.9/5 rating and verification badges
- **Price Psychology**: Savings indicators "Ahorras $15 vs otras florerías" with animated badges
- **Quality Assurance**: HD Quality badge, SSL security, and payment method trust signals
- **Customization Gamification**: Color selection, wrapping paper options, personal message with character count

#### Technical Implementation Details
- **Files Modified**:
  - `frontend/pages/product-detail.html` - Complete UI overhaul with conversion elements
  - `frontend/css/product-detail-enhanced.css` - 1800+ lines of advanced styling and animations
  - `frontend/js/product-gamification.js` - 850+ lines of psychology-based interaction system
  - `frontend/js/product-detail.js` - Enhanced with debugging and error handling

#### Critical Bug Fixes (2025-09-05)
- **JavaScript Syntax Errors**: Fixed invalid escape sequence errors in lines 136 and 247
- **DOM Element Issues**: Added missing `stock-available` and `stock-unavailable` elements
- **MIME Type Problems**: Resolved server configuration causing JavaScript files to serve as application/json
- **Rate Limiting**: Implemented server restart procedures and debugging systems
- **Content Visibility**: Fixed `product-content` div hidden state preventing UI rendering

#### Performance & Debugging Enhancements
- **Debug Logging System**: Comprehensive logging for `renderProductInfo` function execution
- **Element Verification**: Automated DOM element existence checking with detailed reporting
- **Error Handling**: Try-catch blocks with specific error identification and reporting
- **Server Optimization**: Quick restart scripts (`./qs.sh`) for development efficiency
- **Debug Script**: `debug-fix.js` for real-time DOM element verification and function monitoring

#### Marketing Psychology Techniques Applied
1. **Scarcity**: "Solo 3 disponibles" with decreasing stock bar
2. **Social Proof**: Live viewer count and recent purchase notifications
3. **Authority**: Customer testimonials and rating system enhancements
4. **Urgency**: Multiple countdown timers and limited-time offers
5. **Reciprocity**: Free shipping, discounts, and value-added services
6. **Commitment**: Customization options creating psychological ownership
7. **Loss Aversion**: Exit-intent retention with exclusive discount codes

#### Current Status
- ✅ **All syntax errors resolved**
- ✅ **Server MIME types corrected**
- ✅ **DOM elements properly implemented**
- ✅ **Debug logging system active**
- ✅ **Rate limiting issues resolved**
- ✅ **Full UI functionality restored**
- 🚀 **Ready for production use**

## Navigation Optimization & JavaScript Fixes (2025-09-06)

### Compact Navigation Implementation
- **Issue**: Navigation menu considered too high, taking excessive vertical space
- **Solution**: Created comprehensive compact navigation system reducing height by ~30%
- **Files Created**:
  - `frontend/css/compact-navigation.css` - Compact navigation rules
  - Integrated into `frontend/css/product-detail-enhanced.css`
- **Features**:
  - Reduced navbar height from ~70-80px to 50-60px maximum
  - Optimized spacing with compact padding (0.25rem vs 0.5rem)
  - Smaller logo and brand elements with responsive scaling
  - Horizontal journey progress layout with 24px icons
  - Mobile-responsive breakpoints: 45-50px (mobile), 40-45px (extra small)

### Advanced JavaScript Error Resolution
- **Issue**: Missing `implementAdvancedFOMOTriggers()` function causing runtime errors
- **Solution**: Implemented complete FOMO triggers system with advanced features:
  - Advanced scarcity indicators with inventory countdowns
  - Time-sensitive flash sale offers with real-time countdown
  - Social pressure elements showing live viewer counts
  - Progressive urgency escalation with 4-level messaging
  - Flash timer system with visual countdown displays
- **Files Modified**: `frontend/js/advanced-conversion-optimizer.js` - Added 150+ lines of FOMO functionality

### Technical Improvements
- **Syntax Validation**: All JavaScript files pass strict syntax checking
- **Performance Optimization**: Hardware-accelerated CSS transforms for smooth animations
- **Error Handling**: Comprehensive try-catch blocks with detailed error reporting
- **Mobile Optimization**: Touch-friendly interfaces with optimized spacing

## Advanced Conversion Optimization System (2025-09-06)

### Strategic Buy Buttons Architecture
The product detail page implements a sophisticated multi-layer conversion optimization system with strategic button placement and comprehensive analytics.

#### Key Components:
- **Strategic Buy Buttons System** (`strategic-buy-buttons.js`):
  - 6 strategically positioned buy buttons throughout the page
  - Comprehensive logging system with 4 levels (debug, info, warn, error)
  - Real-time analytics including scroll depth, heatmap data, conversion funnel
  - Centered layout optimization for improved visual hierarchy

- **Advanced Conversion Optimizer** (`advanced-conversion-optimizer.js`):
  - FOMO (Fear of Missing Out) triggers with progressive urgency escalation
  - Price anchoring vs competitor comparisons
  - Dynamic testimonials and social proof systems
  - Time-sensitive offers with countdown timers
  - Exit-intent retention mechanisms

- **Intelligent Cross-Sell Engine** (`intelligent-cross-sell.js`):
  - AI-like product recommendations based on user behavior
  - Dynamic bundle creation with smart pricing
  - Real-time social proof feed integration
  - Personalized product suggestions

- **One-Click Express Checkout** (`one-click-express-checkout.js`):
  - 3-step express purchase flow
  - Smart defaults and location detection
  - Payment method optimization for Venezuelan market
  - Asset preloading for improved performance

#### CSS Architecture:
- **Mobile-First Design** (`mobile-conversion-optimizer.css`):
  - Touch-optimized interactions
  - Progressive enhancement for mobile devices
  - Strategic CTA positioning across breakpoints

- **Compact Navigation** (`compact-navigation.css`):
  - Optimized navbar height (30% reduction)
  - Responsive journey progress indicators
  - Hardware-accelerated animations

#### Logging and Analytics:
The system implements comprehensive tracking across all conversion touchpoints:
- **Button Interactions**: Click tracking, hover analysis, position effectiveness
- **Scroll Behavior**: Depth tracking at 25%, 50%, 75%, 100% milestones
- **Performance Metrics**: Load times, DOM ready states, asset loading
- **Conversion Funnel**: Page load → Button seen → Hover → Click → Checkout

#### Integration Pattern:
All conversion optimization modules follow a consistent pattern:
1. **Initialization**: DOM ready detection and module setup
2. **Element Creation**: Dynamic UI component generation
3. **Event Binding**: Comprehensive interaction tracking
4. **Analytics Collection**: Real-time data aggregation
5. **Performance Monitoring**: Resource usage and timing metrics

#### Development Notes:
- Modules are designed to work independently but enhance each other when combined
- All JavaScript follows strict error handling with try-catch blocks
- CSS uses hardware acceleration (`transform: translateZ(0)`) for optimal performance
- Comprehensive debug logging can be filtered by level for production deployment

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.

