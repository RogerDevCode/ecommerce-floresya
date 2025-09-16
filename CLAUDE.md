# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build & Development
- `npm run build` - Production build using tsconfig.prod.json (strict, no source maps)
- `npm run start` - Build and start production server
- `npm run dev` - Development with TypeScript watch mode + nodemon
- `npm run dev:build` - Quick development build and run (most used)
- `npm run ts:watch` - TypeScript compiler in watch mode

### Code Quality
- `npm run lint` - ESLint validation for TypeScript files
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run type:check` - TypeScript type checking without emission
- `npm run clean` - Remove dist/ directory
- `npm run reset` - Clean and rebuild

### Testing
- `npm test` - Run Vitest test suite
- `npm run test:watch` - Tests in watch mode
- `npm run test:ui` - Vitest UI interface
- `npm run test:coverage` - Generate coverage reports

## Architecture Overview

This is a TypeScript-first e-commerce application for FloresYa with strict typing and zero technical debt policy.

### Core Stack
- **Backend**: Node.js + Express + TypeScript (ES Modules)
- **Database**: Supabase PostgreSQL (REST API only, no direct client)
- **Frontend**: Vanilla TypeScript with modular architecture
- **Deployment**: Vercel with specialized build configurations
- **Testing**: Vitest with comprehensive coverage

### Project Structure

#### TypeScript Configuration
- **Development**: `tsconfig.json` - Incremental builds, source maps, declaration files
- **Production**: `tsconfig.prod.json` - Optimized, no source maps, strict checks
- **Compilation Target**: ES2022 with ESNext modules
- **Output**: All TypeScript compiles to `dist/` directory maintaining structure

#### Database Architecture
- **Schema**: `supabase_schema.sql` contains complete database structure
- **Key Tables**: products, orders, occasions, users, product_images, order_items
- **Custom Types**: Extensive PostgreSQL enums (order_status, payment_status, occasion_type, etc.)
- **Access**: Exclusively through REST API endpoints, no direct Supabase client usage

#### Backend Architecture (`src/`)
```
app/
├── server.ts          # Express application entry point
└── routes/            # Route definitions
    ├── productRoutes.ts
    ├── orderRoutes.ts
    ├── occasionsRoutes.ts
    ├── imageRoutes.ts
    └── logsRoutes.ts

controllers/           # Request handlers with validation
services/             # Business logic layer
config/               # Supabase connection and types
types/                # Global TypeScript definitions
models/               # Database interaction layer
```

#### Frontend Architecture (`src/frontend/`)
```
frontend/
├── main.ts           # Main application controller
├── auth.ts           # Authentication management
├── admin.ts          # Admin panel functionality
├── services/
│   └── api.ts        # FloresYaAPI class - centralized API communication
├── types/            # Frontend-specific types
└── utils/
    └── logger.ts     # Frontend logging system
```

#### Static Assets (`public/`)
```
public/
├── index.html        # Main application entry
├── pages/            # Additional HTML pages
├── css/              # Modular stylesheets
└── images/           # Static assets and placeholders
```

## Critical Development Rules

### TypeScript Standards
- **Strict Mode**: All configurations enforce strict typing
- **No 'any' Types**: Use specific interfaces and types defined in `src/types/globals.ts`
- **ES Modules**: Exclusive use of import/export syntax
- **Path Aliases**: Use `@shared-types/*` and `@database-types/*` for common imports

### Code Organization
- **Clean Architecture**: Controllers → Services → Models pattern
- **Type Safety**: Every function must have explicit return types
- **API Communication**: All database operations through `FloresYaAPI` class
- **Error Handling**: Comprehensive logging through custom Logger interface

### File Search Commands
- **File Search**: Use `fdfind` (fd) instead of find
- **Content Search**: Use `rg` (ripgrep) instead of grep

## API Architecture

### Core API Class
All backend communication flows through `FloresYaAPI` class in `src/frontend/services/api.ts`:
```typescript
// Centralized API instance
export const api = new FloresYaAPI();

// Usage in other files
import { api } from './api';
```

### REST Endpoints
- `GET /api/products` - Product catalog with filtering
- `POST /api/orders` - Order creation
- `GET /api/occasions` - Available occasions
- `POST /api/images/upload` - Image handling
- `POST /api/logs` - System logging

### Database Integration
- **Connection**: Managed through `supabaseManager` in `src/config/supabase.ts`
- **Types**: Auto-generated from schema in `src/config/supabase-types.ts`
- **Transactions**: Handled at service layer with proper error management

## Development Workflow

### Starting Development
1. `npm install` - Install dependencies
2. `npm run dev:build` - Build and start development server
3. Server runs on port from environment variables

### Making Changes
1. Edit TypeScript files in `src/`
2. TypeScript auto-compiles to `dist/`
3. Frontend references compiled JavaScript files
4. Always run `npm run type:check` before commits

### Database Updates
1. Modify `supabase_schema.sql`
2. Update types in `src/config/supabase-types.ts`
3. Adjust controllers to match new schema
4. Test with `npm run dev:build`

## Deployment

### Vercel Configuration
- API routes handled by `api/index.ts`
- Static files served from `public/` and `dist/`
- Production builds use optimized TypeScript configuration

### Environment Variables
- Supabase connection details required
- Check `.env.example` for required variables

## Image Handling

### Strategy
- Primary images stored in Supabase storage
- Local placeholders used when Supabase returns null
- Multiple image sizes supported (thumb, small, medium, large)
- Automatic cleanup of temporary files after upload

## Logging System

### Frontend Logging
- Centralized logger in `src/frontend/utils/logger.ts`
- Categories: info, success, error, warn, debug, api, user, cart, perf
- Auto-send capability with configurable intervals
- Structured logging with performance metrics

### Backend Logging
- Critical process logging only
- Error tracking through service layer
- Integration with frontend logging system via `/api/logs` endpoint

## Performance Considerations

### TypeScript Compilation
- Development: Incremental builds for speed
- Production: Full optimization with comment removal
- Watch mode available for continuous development

### Frontend Architecture
- Modular loading of TypeScript modules
- Efficient API caching through FloresYaAPI
- Optimized image loading with size variants

### Database Optimization
- Indexed queries for product searches
- Efficient pagination implementation
- Proper foreign key relationships

## Testing Strategy

### Test Structure
- Unit tests in `tests/unit/`
- Vitest configuration optimized for ES6 modules
- Coverage reporting enabled
- Mock support for Supabase operations

### Running Tests
- `npm test` for full test suite
- `npm run test:watch` during development
- `npm run test:coverage` for coverage analysis

When working with this codebase, always prioritize type safety, maintain the clean architecture patterns, and ensure all changes are reflected in both TypeScript source and the database schema.