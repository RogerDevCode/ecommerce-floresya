# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` - Start production server
- `npm run dev` - Initialize dev database and start development server with nodemon
- `npm run demo` - Initialize demo database and start server
- `npm run demo-visual` - Start visual demo server without database

### Testing
- `npm test` - Run all tests with Vitest
- `npm run test:controllers` - Run controller tests only 
- `npm run test:frontend` - Run frontend tests only
- `npm run test:supabase` - Run both controller and frontend tests
- `npm run test:ui` - Run tests with Vitest UI
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report

### Code Quality
- `npm run lint` - Lint backend code with ESLint
- `npm run lint:fix` - Auto-fix linting issues
- `npm run type:check` - TypeScript type checking without compilation

### TypeScript Migration
- `npm run ts:check` - Type check without compilation
- `npm run ts:build` - Compile TypeScript to JavaScript
- `npm run ts:watch` - Watch mode compilation
- `npm run dev:ts` - Development server with TypeScript support

## Architecture

### Database Strategy
- **Primary**: Supabase PostgreSQL via official API client (`@supabase/supabase-js`)
- **Migration Layer**: Prisma compatibility layer exists (`/backend/src/config/database_prisma.js`)
- **Legacy**: Sequelize models being phased out, located in `/oldfiles/`
- **IMPORTANT**: Never use direct database connections or ORMs other than Supabase API

### Project Structure
```
backend/src/
├── controllers/     # API route handlers (mix of JS/TS migration in progress)
├── services/        # Business logic and external API integration  
├── routes/          # Express route definitions
├── middleware/      # Authentication, validation, monitoring
├── config/          # Database, Swagger, and app configuration
├── utils/           # Logging utilities (bked_logger.js)
└── scripts/         # Database initialization and migration scripts

frontend/
├── js/              # Client-side JavaScript modules
├── css/             # Stylesheets
└── pages/           # HTML page templates

types/               # TypeScript type definitions
tests/unit/          # Vitest test files
```

### File Naming Convention
- Backend files must use `bked_` prefix to avoid naming conflicts
- Frontend files use descriptive names without prefixes
- Legacy files moved to `/oldfiles/` during migration

### TypeScript Migration Status
- **Active Migration**: JavaScript files being converted to TypeScript
- **Configuration**: Multiple tsconfig files for different environments
- **Strategy**: Gradual migration with strict typing enabled incrementally
- **Rule**: When editing any `.js` file, convert it to `.ts` and move old file to `/oldfiles/`

### Image Handling
- **Storage**: All images stored in Supabase Storage buckets
- **Upload**: Use `/backend/src/services/imageUploadService.js`
- **Processing**: Image optimization via Sharp in `/backend/src/services/imageProcessing.js`
- **CRITICAL**: Never store images locally except temporarily during upload process
- **Fallback**: Use local placeholders when Supabase returns null

### API Architecture
- **REST API**: Express.js with comprehensive middleware stack
- **Authentication**: JWT-based auth via `authController.js`
- **Validation**: Express-validator middleware
- **Monitoring**: Custom middleware in `/middleware/monitoringMiddleware.js`
- **Documentation**: Swagger/OpenAPI at `/backend/src/config/swagger.js`
- **Rate Limiting**: Express rate limiting enabled

### Frontend Architecture
- **Vanilla JS**: ES6+ modules with progressive enhancement
- **Responsive**: Mobile-first design (breakpoints: <768px, 768-1199px, >1200px)
- **Image Loading**: Responsive images with hover effects and loading states
- **Shopping Cart**: Local storage with backend sync
- **Product Details**: Dynamic loading with image galleries

## Development Guidelines

### Testing Requirements
- **100% test coverage** required for new code
- Create tests immediately after writing/editing code
- Maximum 5 fix attempts before manual review needed
- Use Vitest for unit and integration testing
- Frontend tests focus on DOM manipulation and API integration

### Code Quality Standards
- **ESLint**: Strict configuration with ES6+ rules
- **TypeScript**: Gradual migration with increasing strictness
- **Logging**: Use `/backend/src/utils/bked_logger.js` for all logging
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Security**: JWT authentication, rate limiting, input validation

### Database Development
- **Supabase Only**: Never use local databases or direct connections
- **Query Builder**: Use `/backend/src/services/queryBuilder.js` for complex queries
- **Migrations**: SQL scripts in root directory for schema changes
- **Backup**: Images backed up in `/dbimagenes/` before migrations

### Search and CLI Tools
- **MANDATORY**: Use `fd` instead of `find` for file searches
- **MANDATORY**: Use `rg` (ripgrep) instead of `grep` for text searches
- These tools are required due to better performance and reliability

### Deployment
- **Platform**: Vercel with automatic deployments
- **Environment**: Node.js with ES modules support
- **Build**: Static files served directly, no build step required
- **Database**: Supabase PostgreSQL in production

## Key Dependencies

### Core Runtime
- Express.js 4.18.2 (web framework)
- @supabase/supabase-js 2.57.4 (database client)
- Node.js with ES modules (type: "module" in package.json)

### Development Tools
- Vitest (testing framework)
- ESLint (code quality)
- TypeScript 5.9.2 (gradual migration)
- Nodemon (development server)

### Security & Performance
- Helmet (security headers)
- CORS (cross-origin resource sharing)
- Rate limiting (DDoS protection)
- Compression (response optimization)

## Important Files to Review

### Configuration
- `/tsconfig.json` - TypeScript configuration with path mappings
- `/.eslintrc.cjs` - ESLint rules and overrides
- `/vitest.config.js` - Test configuration and setup

### Documentation
- `/TYPESCRIPT_MIGRATION_STATUS.md` - Current migration progress
- `/code_metadata.json` - API and architecture documentation
- `/backend/src/docs/swagger.js` - API documentation

### Critical Services
- `/backend/src/services/supabaseClient.js` - Database connection
- `/backend/src/utils/bked_logger.js` - Logging utilities  
- `/backend/src/middleware/monitoringMiddleware.js` - Performance monitoring