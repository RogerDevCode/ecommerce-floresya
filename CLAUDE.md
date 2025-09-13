# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
- `npm start` - Start production server (compiled TypeScript)
- `npm run dev` - Full development workflow: compile TypeScript, initialize database, start server with nodemon
- `npm run demo` - Initialize demo database and start server
- `npm run demo-visual` - Start visual demo server without database

### TypeScript Development
- `npm run ts:build` - Compile TypeScript to JavaScript in `dist/`
- `npm run ts:watch` - Watch mode compilation (use `./tsw.sh on/off` for daemon control)
- `npm run ts:check` - Type check without compilation
- `./tsw.sh on` - Start TypeScript watch daemon in background
- `./tsw.sh off` - Stop TypeScript watch daemon
- `./tsw.sh status` - Check daemon status

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

## Architecture

### TypeScript Migration Status: COMPLETED
The project has been **fully migrated to TypeScript** with the following structure:

```
src/                          # TypeScript source code
├── frontend/
│   ├── main.ts              # Core app functionality  
│   ├── services/            # API, auth, cart, carousel services
│   └── utils/               # Logger, responsive image utilities
├── backend/
│   ├── server.ts            # Express server with type safety
│   ├── routes/              # API route handlers (TypeScript)
│   ├── middleware/          # Authentication, validation middleware
│   ├── services/            # Business logic services
│   ├── utils/               # Backend utilities (logger)
│   └── scripts/             # Database initialization scripts
└── shared/
    └── types/               # Shared TypeScript type definitions

dist/                        # Compiled JavaScript (auto-generated)
├── frontend/                # Compiled frontend modules
└── backend/                 # Compiled backend modules

frontend/                    # Static assets and HTML
├── index.html              # Main page (loads ES modules from dist/)
├── pages/                  # Additional HTML pages
├── css/                    # Stylesheets
└── js/                     # Legacy JavaScript (being phased out)
```

### Database Strategy
- **Primary**: Supabase PostgreSQL via official REST API (`@supabase/supabase-js`)
- **Development**: Stub routes provide mock data for frontend development
- **CRITICAL**: Never use direct database connections - only Supabase API client

### API Architecture
- **REST API**: Express.js with comprehensive TypeScript typing
- **Current Status**: Stub routes mounted at `/api/*` providing functional mock responses
- **Authentication**: JWT-based auth middleware (TypeScript)
- **Validation**: Express-validator middleware with type safety
- **Rate Limiting**: Express rate limiting enabled
- **Security**: Helmet middleware with strict CSP

### Frontend Architecture
- **Module System**: ES modules loaded with `type="module"`
- **TypeScript**: All core functionality migrated to TypeScript, compiled to `dist/frontend/`
- **Legacy Compatibility**: Existing JavaScript files in `frontend/js/` still function
- **Image Loading**: Responsive images with multi-provider support
- **Shopping Cart**: Type-safe cart with local storage and backend sync
- **API Client**: Typed HTTP client with error handling and logging

### File Serving Strategy
- **Static Files**: Express serves `frontend/` directory for HTML, CSS, images
- **Compiled Modules**: Express serves `dist/` with correct MIME types for JavaScript modules
- **TypeScript Sources**: Located in `src/`, compiled to `dist/` on build

## Development Guidelines

### TypeScript Development Workflow
1. **Source Code**: Write TypeScript in `src/` directory
2. **Compilation**: Use `npm run ts:build` or `./tsw.sh on` for auto-compilation
3. **Testing**: Run `npm test` to validate functionality
4. **Development Server**: Use `npm run dev` for full development stack

### API Development
- **Stub Routes**: Located in `src/backend/routes/stub-routes.ts`
- **Mock Data**: Provides realistic responses for frontend development
- **Type Safety**: All routes use TypeScript interfaces for request/response types
- **Logging**: Comprehensive logging via `src/backend/utils/bked_logger.ts`

### Testing Requirements
- **100% test coverage** required for new TypeScript code
- Use Vitest for unit and integration testing
- Frontend tests focus on DOM manipulation and API integration
- Backend tests validate API responses and business logic

### Code Quality Standards
- **TypeScript**: Strict configuration with ES2022 target
- **ESLint**: Strict configuration for code quality
- **Path Mappings**: Use `@frontend/*`, `@backend/*`, `@shared/*` aliases
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **Security**: JWT authentication, rate limiting, input validation

### CLI Tools (MANDATORY)
- **File Search**: Use `rg` (ripgrep) instead of `grep`
- **Text Search**: Use `fd` instead of `find`
- These tools are required for performance and reliability

## Key Dependencies

### Core Runtime
- Express.js 4.18.2 (web framework with TypeScript support)
- @supabase/supabase-js 2.57.4 (database client)
- TypeScript 5.9.2 (primary development language)
- Node.js with ES modules (type: "module" in package.json)

### Development Tools
- Vitest (testing framework)
- ESLint (code quality for TypeScript)
- Nodemon (development server)
- Sharp (image processing)

### Security & Performance
- Helmet (security headers)
- CORS (cross-origin resource sharing)
- Rate limiting (DDoS protection)
- Compression (response optimization)

## Current Project Status

### ✅ Completed
- TypeScript migration (100% core functionality)
- ES modules integration with proper MIME types
- Stub API routes providing functional responses
- Development workflow with automatic compilation
- Type-safe frontend and backend architecture

### 🔧 Development Ready
- All API endpoints functional with mock data
- Frontend loads without 404 errors
- TypeScript compilation working seamlessly
- Development server with hot reloading via nodemon

### 📋 Next Steps for Production
- Replace stub routes with actual Supabase integration
- Implement remaining API endpoints as needed
- Add comprehensive error handling for production scenarios
- Deploy to Vercel with environment-specific configurations

## Important Files

### Configuration
- `tsconfig.json` - TypeScript configuration with strict typing
- `package.json` - Scripts and dependencies
- `vitest.config.js` - Test configuration

### Development Scripts
- `tsw.sh` - TypeScript watch daemon controller
- `qs.sh` - Quick start development server

### Documentation
- `TYPESCRIPT_MIGRATION_COMPLETED.md` - Migration completion status
- `docs/API_DOCUMENTATION.md` - API endpoint documentation