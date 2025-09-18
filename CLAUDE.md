# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FloresYa is an enterprise-grade e-commerce platform for flower sales built with TypeScript in strict mode, Node.js, Express, and Supabase PostgreSQL. The project follows clean architecture principles with zero technical debt tolerance and extensive use of atomic database transactions.

## Essential Commands

### Development
```bash
npm run dev              # Development server with TypeScript watch + nodemon
npm run dev:build        # Single build + start (for quick testing)
npm run ts:watch         # TypeScript compilation in watch mode only
```

### Build & Production
```bash
npm run build           # Production build (uses tsconfig.prod.json)
npm run start           # Build + start production server
npm run clean           # Remove dist/ directory
npm run reset           # Clean + build
```

### Quality Assurance
```bash
npm run lint            # Run ESLint on src/**/*.ts
npm run lint:fix        # Auto-fix ESLint issues
npm run type:check      # TypeScript type checking without emit
```

### Testing
```bash
npm run test            # Run Vitest tests
npm run test:watch      # Tests in watch mode
npm run test:coverage   # Coverage report
npm run test:ui         # Vitest UI interface
```

### Schema & Database
```bash
npm run schema:update   # Extract schema from Supabase
```

## Architecture Overview

### Directory Structure
```
src/
├── app/                 # Express server setup and routes
│   ├── server.ts       # Main FloresYaServer class
│   ├── routes/         # API route definitions
│   └── middleware/     # Express middleware (auth, etc.)
├── controllers/        # API endpoint handlers
├── services/           # Business logic layer
├── config/             # Configuration (Supabase, Swagger)
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
└── frontend/           # Frontend TypeScript code

api/                    # Vercel serverless handler
public/                 # Static files served by Express
dist/                   # Compiled TypeScript output
```

### Key Architectural Patterns

**Service Layer Pattern**: All business logic is encapsulated in service classes (ProductService, OrderService, etc.). Controllers are thin and delegate to services.

**Atomic Transactions**: All critical database operations use PostgreSQL functions defined in `database-transactions.sql` to ensure data integrity:
- `create_order_with_items()` - Order creation with items and status history
- `update_order_status_with_history()` - Status updates with audit trail
- `create_product_with_occasions()` - Product creation with occasion associations
- `update_carousel_order_atomic()` - Carousel position management
- `create_product_images_atomic()` - Multi-image creation

**Type Safety**: The project uses strict TypeScript with no `any` types. All database types are defined in `src/config/supabase.ts` and shared types in `src/types/globals.ts`.

## Database Integration

### Supabase Configuration
- **Client**: `supabase` (anonymous key) - for general operations
- **Service Client**: `supabaseService` (service role key) - for admin operations
- **Types**: All database types are inlined in `src/config/supabase.ts`

### Transaction Requirements
Before making database changes, ensure PostgreSQL transaction functions are deployed by executing `database-transactions.sql` in Supabase Dashboard > SQL Editor.

### Critical Schema Files
- `supabase_schema.sql` - **Single source of truth** for database schema (never modify)
- `database-transactions.sql` - PostgreSQL functions for atomic operations

## Development Standards

### TypeScript Configuration
- **Strict mode enabled**: No `any` types allowed
- **Module system**: ESNext with bundler resolution
- **Path mapping**: `@shared-types/*` and `@database-types/*` aliases
- **Build target**: ES2022 with DOM types

### Code Quality
- **ESLint**: Strict configuration in `.eslintrc.json`
- **Type checking**: Must pass `npm run type:check`
- **No technical debt**: Zero tolerance for stubs, commented code, or temporary fixes

### Frontend Architecture
- **Vanilla TypeScript**: No framework dependencies
- **Module compilation**: TypeScript files transpiled to `dist/` then copied to `public/`
- **Bootstrap 5**: For UI components and styling
- **API communication**: Via `src/frontend/services/api.ts`

## Authentication & Security

### JWT Authentication
- **Middleware**: `src/app/middleware/auth.ts`
- **Service**: `UserService` handles authentication logic
- **Roles**: `admin`, `user`, `support` with role-based access control

### Security Middleware Stack
1. Helmet - Security headers
2. CORS - Cross-origin configuration
3. Rate limiting - 100 requests/15min (production)
4. Body parsing - 10MB limit
5. Compression - Response compression

## API Documentation

### Swagger/OpenAPI
- **Access**: `/api-docs` endpoint
- **JSON spec**: `/api-docs.json`
- **Configuration**: `src/config/swagger.ts`

### Health Check
- **Endpoint**: `GET /api/health`
- **Purpose**: Server status, memory usage, uptime monitoring

## Environment Configuration

### Required Environment Variables
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_jwt_secret
NODE_ENV=development|production
PORT=3000
```

### Deployment
- **Platform**: Vercel
- **Handler**: `api/index.ts` (serverless function)
- **Static files**: Served from `public/`
- **Build process**: TypeScript compilation to `dist/`, then copying to `public/`

## Build Process Details

### TypeScript Compilation Flow
1. `npx tsc --project tsconfig.prod.json` - Compiles src/ to dist/src/
2. `npm run build:post` - Copies dist/src/* to dist/ for flat structure
3. `npm run build:copy` - Copies frontend files to public/ for Vercel static serving

### Critical Build Dependencies
- TypeScript and @types packages are in `dependencies` (not devDependencies) for Vercel build compatibility
- Build process creates both server files in `dist/` and frontend files in `public/`

## Search and Development Tools

### File Operations
- **File search**: Use `fdfind` (fd) for file searching
- **Content search**: Use `rg` (ripgrep) for content searching
- **Avoid**: Standard `find` and `grep` commands

### Logging System
- **Server**: `src/utils/serverLogger.ts` - Comprehensive server logging
- **Frontend**: `src/frontend/utils/logger.ts` - Client-side logging
- **Categories**: SYSTEM, SECURITY, DATABASE, API, PERF, STATIC

## Important Constraints

### Configuration Changes
**CRITICAL**: Always ask for explicit permission before modifying:
- `tsconfig.json`, `tsconfig.prod.json`, `tsconfig.dev.json`
- `package.json`
- `vercel.json`
- `.eslintrc.json`

### Vercel Configuration (vercel.json)
**NEVER MODIFY WITHOUT PERMISSION** - Current working configuration:
- Simple structure with `buildCommand`, `outputDirectory: "public"`, and `installCommand`
- Avoids complex builds/routes that caused MIME type issues
- Frontend files are copied to `public/` during build for static serving

### Database Schema
- **Never modify** `supabase_schema.sql` - it's the single source of truth
- **Always reference** schema file to ensure controller compatibility
- **Use atomic transactions** for all critical operations

### Code Standards
- **No `any` types**: Use specific types or create custom interfaces
- **No stubs or TODO comments**: Implement complete solutions
- **Event handling**: Use proper DOM lifecycle and event delegation
- **Error handling**: Comprehensive error handling with logging

## Frontend Development Guidelines

### DOM Event Handling
- **Event Assignment**: Only assign events when elements exist in DOM and are visible
- **Event Delegation**: Assign listeners to parent containers, filter by target element
- **Avoid Duplicates**: Prevent duplicate listeners when showing/hiding elements multiple times
- **Dynamic Elements**: Consider MutationObserver for dynamically added elements

### Module Loading
- Frontend TypeScript files are compiled to JavaScript and served from `public/`
- Import paths in HTML should match the flat structure in `public/` (e.g., `/utils/logger.js`, `/services/api.js`)
- Module preloading is configured for performance optimization

## Testing Strategy

### Framework
- **Test runner**: Vitest
- **HTTP testing**: Supertest for API endpoint testing
- **Coverage**: Available via `npm run test:coverage`

### Focus Areas
- API endpoint functionality
- Service layer business logic
- Database transaction integrity
- Input validation rules

## Performance Considerations

### Static File Serving
- **Production**: Optimized caching for static assets via Vercel
- **Development**: No caching for faster iteration
- **Compression**: Enabled for all responses

### Database Optimization
- **Prepared statements**: All queries use parameterized statements
- **Connection pooling**: Managed by Supabase
- **Transaction batching**: Related operations grouped in single transactions

## Troubleshooting

### Common Issues
1. **Build failures**: Check TypeScript errors with `npm run type:check`
2. **Lint errors**: Run `npm run lint:fix` for auto-fixable issues
3. **Database connection**: Verify environment variables and Supabase status
4. **Transaction failures**: Ensure PostgreSQL functions are deployed
5. **Frontend module loading**: Verify file paths match public/ structure and MIME types are correct

### Debug Commands
```bash
# Check server health
curl http://localhost:3000/api/health

# Verify database connection
npm run schema:info

# Test build process
npm run build && ls -la public/

# Check TypeScript compilation
npm run type:check
```

## Development Philosophy

This project maintains enterprise-grade standards with zero tolerance for technical debt. All solutions must be:
- **Complete**: No stubs, TODO comments, or temporary fixes
- **Type-safe**: Strict TypeScript with no `any` types
- **Atomic**: Database operations use PostgreSQL functions for integrity
- **Tested**: Code changes must include appropriate tests
- **Documented**: All functions documented with Swagger/JSDoc comments

When working on this codebase, always implement robust, production-ready solutions that follow established patterns and maintain the high code quality standards already in place.