# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 🌸 FloresYa - Enterprise E-commerce Platform

## Project Overview
Enterprise-grade TypeScript e-commerce platform for flower delivery with **absolute zero tolerance for code quality violations**. Built with Node.js/Express, **tRPC for end-to-end type safety**, Supabase PostgreSQL, and deployed on Vercel. Implements Silicon Valley-grade **Single Source of Truth (SSOT)** architecture with complete type safety enforcement between frontend and backend.

## Core Architecture Principles

### Single Source of Truth (SSOT)
**ABSOLUTE RULE**: Each type, interface, or constant must exist in ONLY ONE location.
- All types consolidated in `src/shared/types/index.ts`
- Shared utilities in `src/shared/`
- Legacy type files removed to prevent duplication

### tRPC Type-Safe API Architecture
The project uses **tRPC** for end-to-end type safety between frontend and backend:
```typescript
// ✅ CORRECT: tRPC approach with full type safety
const result = await trpc.user.login.mutate({ email, password });
// TypeScript knows the exact shape of result.data

// ❌ LEGACY: REST API with manual typing
const response = await fetch('/api/users/login', { /* ... */ });
const data = response.json() as any; // Type safety lost
```

**tRPC Architecture:**
- `src/app/trpc/` - Server-side tRPC routers and configuration
- `src/frontend/trpc/` - Client-side tRPC hooks and utilities
- `/trpc` endpoint exposes all type-safe procedures
- Automatic type inference from server to client

### TypeSafe Database Architecture
The project uses `TypeSafeDatabaseService` with Supabase-generated types:
```typescript
// ✅ CORRECT: TypeSafe approach with Supabase types
import type { Database } from '../shared/types/schema_supabase.js';
const client: SupabaseClient<Database> = createClient<Database>(url, key);

// ❌ WRONG: Manual casting approach
const db = supabaseService as any;
```

## Build Commands

### Essential Commands
```bash
# Full production build (REQUIRED before commits)
npm run build

# Development with watch mode
npm run dev

# Type checking only (ZERO errors tolerance)
npm run type:check

# ESLint with strict rules (ZERO warnings tolerance)
npm run lint
npm run lint:fix

# Testing with Vitest
npm run test
npm run test:coverage

# Master validation (Enterprise critical points)
npm run validate

# Quick validation pipeline
npm run validate:quick

# SSOT validation (Single Source of Truth)
node scripts/validate-ssot.js
```

### Build Process Details
- `npm run build:css` - Compiles Tailwind CSS
- `npm run build:prod` - Full TypeScript compilation + static file copying
- `npm run build:robust` - Uses custom robust-build.mjs for error recovery
- Frontend files compiled to `dist/frontend/`, backend to `dist/backend/`

## Project Structure

```
src/
├── app/                   # Express server setup
│   ├── trpc/              # ✅ tRPC ROUTERS (Type-safe API)
│   │   ├── router.ts      # Main app router combining all domains
│   │   ├── trpc.ts        # Base tRPC configuration & context
│   │   ├── trpcMiddleware.ts # Express middleware integration
│   │   └── routers/       # Domain-specific routers
│   │       ├── userRouter.ts     # User operations (login, register, etc.)
│   │       ├── productRouter.ts  # Product operations (CRUD, search)
│   │       ├── orderRouter.ts    # Order operations (user orders, status)
│   │       ├── occasionRouter.ts # Occasion operations (list, filter)
│   │       ├── imageRouter.ts    # Image operations (upload, resize)
│   │       └── dashboardRouter.ts # Admin dashboard stats
│   ├── routes/            # ❌ LEGACY REST routes (maintained for compatibility)
│   └── middleware/        # Auth, validation middleware
├── services/              # Business logic layer
│   ├── TypeSafeDatabaseService.ts  # ✅ PRIMARY - ZERO 'any' types
│   └── *Service.ts        # Domain services (User, Product, etc.)
├── controllers/           # ❌ LEGACY HTTP request handlers (being replaced by tRPC)
├── frontend/              # TypeScript frontend code
│   ├── trpc/              # ✅ tRPC CLIENT (Type-safe frontend)
│   │   ├── client.ts      # Main tRPC client configuration
│   │   ├── index.ts       # Consolidated exports
│   │   ├── demo.ts        # Usage examples and demos
│   │   └── hooks/         # Custom hooks for each domain
│   │       ├── useAuth.ts      # Login, register, profile hooks
│   │       ├── useProducts.ts  # Product management hooks
│   │       ├── useOrders.ts    # Order management hooks
│   │       ├── useOccasions.ts # Occasion hooks
│   │       └── useDashboard.ts # Dashboard hooks
│   ├── admin/             # Admin panel modules
│   └── services/          # ❌ LEGACY API clients (being replaced by tRPC)
└── shared/                # ✅ SSOT Cross-cutting utilities
    ├── types/             # ✅ EXCLUSIVE SOURCE OF TRUTH
    │   ├── index.ts       # ✅ Zod schemas & re-exported Supabase types
    │   └── schema_supabase.ts # ✅ AUTO-GENERATED Supabase types
    └── utils/             # Shared utilities
        └── typeGuards.ts  # Runtime type validation helpers
```

### Key Files Reference
**tRPC Architecture:**
- `src/app/trpc/router.ts:15` - Main tRPC app router with type inference
- `src/app/trpc/trpc.ts:41` - tRPC instance configuration & middlewares
- `src/frontend/trpc/client.ts:11` - Frontend tRPC client with auth headers
- `src/frontend/trpc/hooks/useAuth.ts:18` - Authentication hooks

**SSOT Types:**
- `src/shared/types/schema_supabase.ts:9` - Auto-generated Supabase Database types
- `src/shared/types/index.ts:19` - Zod schemas + re-exported Database types
- `src/shared/utils/typeGuards.ts:20` - Runtime type validation helpers

**Legacy (Being Migrated):**
- `src/services/TypeSafeDatabaseService.ts:24` - Main database service class
- `src/app/server.ts:231` - Express server entry point with tRPC integration
- `package.json:50` - Build scripts and tRPC dependencies

## Development Guidelines

### Code Quality Standards ⚡ ZERO TOLERANCE POLICY
- **🚫 ABSOLUTE ZERO ESLint errors**: Any warning = build failure
- **🚫 ABSOLUTE ZERO `any` types**: Type safety is NON-NEGOTIABLE
- **🚫 ABSOLUTE ZERO duplicate types**: Only `src/shared/types/index.ts` allowed
- **🚫 ABSOLUTE ZERO duplicate filenames**: Unique names across entire project
- **🚫 ABSOLUTE ZERO legacy imports**: Only `../shared/types/index.js` allowed
- **✅ REQUIRED**: TypeScript strict mode compliance
- **✅ REQUIRED**: Modern ESLint flat config with typed linting
- **✅ REQUIRED**: Master validation passing (4 enterprise validators)

### Database Operations
All critical database operations use atomic PostgreSQL functions:
- Order creation with items and status history
- Product management with occasion associations
- Image uploads with batch processing
- Status updates with audit trails

### Frontend Architecture
- Vanilla TypeScript compiled to `dist/frontend/`
- **tRPC hooks** for type-safe API communication (replacing legacy apiClient)
- Static files served from `public/`
- Tailwind CSS for styling

### tRPC Development Workflow
**Server-side (Adding new API endpoint):**
```typescript
// 1. Add procedure to appropriate router
export const userRouter = router({
  getUserProfile: protectedProcedure
    .output(z.object({ success: z.boolean(), data: UserSchema }))
    .query(async ({ ctx }) => {
      // Implementation with full type safety
      return { success: true, data: ctx.user };
    }),
});
```

**Client-side (Using the endpoint):**
```typescript
// 2. Create hook in frontend/trpc/hooks/
export function useUserProfile() {
  return {
    async getProfile() {
      return safeTRPCCall(() => trpc.user.getUserProfile.query());
    },
  };
}

// 3. Use in components with full type safety
const { getProfile } = useUserProfile();
const result = await getProfile();
if (result.success) {
  // TypeScript knows exact shape of result.data
  console.log(result.data.data.email); // Fully typed!
}
```

## Testing Strategy

### Test Configuration
- **Framework**: Vitest with node environment
- **Coverage**: V8 provider with HTML/LCOV reports
- **Aliases**: `@backend` points to `./src/`
- **Timeout**: 15s for integration tests

### Test Structure
```bash
npm run test          # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Generate coverage reports
```

## Environment & Deployment

### Required Environment Variables
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
JWT_SECRET=your_jwt_secret
NODE_ENV=production
```

### Deployment Commands
```bash
# Vercel deployment (automatic)
vercel-build  # Runs npm run build:prod

# Manual deployment
npm run build && npm start
```

## Important Development Rules

### MANDATORY Development Workflow ⚡ ENFORCED
1. **🚫 NEVER modify .js files** in `dist/` - only edit .ts files in `src/`
2. **🚫 NEVER create new type files** - use `src/shared/types/index.ts` exclusively
3. **🚫 NEVER use legacy services** - only `TypeSafeDatabaseService` allowed
4. **🚫 NEVER commit without validation** - run full pipeline first
5. **✅ ALWAYS prefer editing existing files** over creating new ones
6. **✅ ALWAYS run pre-commit validation**:
   ```bash
   npm run validate:quick  # ESLint + TypeScript + Critical validators
   ```

### ⚠️ CRITICAL ARCHITECTURE VIOLATIONS (AUTO-REJECT)
- **🚫 IMMEDIATE REJECTION**: Creating duplicate type definitions
- **🚫 IMMEDIATE REJECTION**: Using `any` casting anywhere in codebase
- **🚫 IMMEDIATE REJECTION**: Importing from legacy type files
- **🚫 IMMEDIATE REJECTION**: Creating new type files outside `src/shared/types/`
- **🚫 IMMEDIATE REJECTION**: Bypassing TypeSafeDatabaseService
- **🚫 IMMEDIATE REJECTION**: Files with duplicate names across directories
- **🚫 IMMEDIATE REJECTION**: Modifying critical config files without validation
- **🚫 IMMEDIATE REJECTION**: Bypassing transaction atomicity for critical operations

### Build System Notes
- Frontend TypeScript compiles with separate tsconfig (`src/frontend/tsconfig.frontend.json`)
- Custom build script `scripts/robust-build.mjs` handles error recovery
- Static files automatically copied from `public/` to `dist/frontend/`
- MIME type issues resolved through proper build structure

## Code References Format
When referencing code, use the pattern `file_path:line_number` for easy navigation.

Example: The main consolidated types are defined in `src/shared/types/index.ts:1` and the TypeSafe service initializes at `src/services/TypeSafeDatabaseService.ts:24`.

---

# 🚫 DEVELOPMENT PROHIBITIONS - CLEAN CODE MANDATE

## ZERO TOLERANCE POLICY FOR CODE QUALITY

### **MANDATORY CLEAN CODE REQUIREMENTS**

#### 1. **EXCLUSIVE USE OF SHARED TYPES**
- **✅ REQUIRED**: ALL type definitions, interfaces, enums, and constants MUST come from `src/shared/types/index.ts`
- **✅ REQUIRED**: Import ONLY from `../shared/types/index.js` in frontend files
- **✅ REQUIRED**: Import ONLY from `../../shared/types/index.js` in backend files
- **❌ FORBIDDEN**: Creating new type files anywhere except `src/shared/types/`
- **❌ FORBIDDEN**: Using types from legacy files (`src/types/`, `src/frontend/types/`)
- **❌ FORBIDDEN**: Creating duplicate type definitions in any location

#### 2. **TYPE SAFETY ENFORCEMENT**
- **✅ REQUIRED**: Complete type safety with zero `any` types
- **✅ REQUIRED**: Proper TypeScript strict mode compliance
- **✅ REQUIRED**: Safe type assertions with runtime checks
- **❌ FORBIDDEN**: Using `any` casting or type assertions without validation
- **❌ FORBIDDEN**: Bypassing TypeScript compiler checks
- **❌ FORBIDDEN**: Unsafe property access on unknown types

#### 3. **ERROR HANDLING STANDARDS**
- **✅ REQUIRED**: Safe error handling with proper type guards
- **✅ REQUIRED**: Runtime type checking before property access
- **✅ REQUIRED**: Descriptive error messages with context
- **❌ FORBIDDEN**: Unsafe calls on potentially undefined objects
- **❌ FORBIDDEN**: Direct property access on unknown types
- **❌ FORBIDDEN**: Ignoring TypeScript compiler warnings

#### 4. **CODE ORGANIZATION RULES**
- **✅ REQUIRED**: Single Source of Truth for all shared code
- **✅ REQUIRED**: No duplicate function or class definitions
- **✅ REQUIRED**: Consistent import patterns across all files
- **❌ FORBIDDEN**: Creating utility functions outside `src/shared/utils/`
- **❌ FORBIDDEN**: Duplicating constants or enums
- **❌ FORBIDDEN**: Mixed import styles within the same file

### **BUILD VALIDATION REQUIREMENTS**

#### PRE-COMMIT VALIDATION (MANDATORY)
```bash
# ✅ REQUIRED before any commit (NON-NEGOTIABLE)
npm run validate:quick    # Complete pipeline validation

# Individual commands (if validate:quick fails)
npm run lint             # ZERO ESLint errors tolerance
npm run type:check       # ZERO TypeScript errors tolerance
npm run build            # ZERO build warnings tolerance
npm run validate         # Enterprise critical validators
node scripts/validate-ssot.js  # SSOT compliance validation
```

#### Code Quality Gates
- **✅ REQUIRED**: All PRs must pass ESLint with zero warnings
- **✅ REQUIRED**: TypeScript strict mode must pass completely
- **✅ REQUIRED**: No unsafe type assertions allowed
- **❌ FORBIDDEN**: Committing code with TypeScript errors
- **❌ FORBIDDEN**: Committing code with ESLint warnings
- **❌ FORBIDDEN**: Bypassing build validation

### **VIOLATION CONSEQUENCES**

#### Automatic Rejection
- **❌ IMMEDIATE REJECTION**: Any code with `any` types
- **❌ IMMEDIATE REJECTION**: Any code with unsafe type assertions
- **❌ IMMEDIATE REJECTION**: Any code creating duplicate types
- **❌ IMMEDIATE REJECTION**: Any code bypassing TypeScript checks

#### Required Corrections
- **✅ MANDATORY**: Remove all `any` types with proper interfaces
- **✅ MANDATORY**: Replace unsafe calls with type-safe alternatives
- **✅ MANDATORY**: Consolidate duplicate types to `src/shared/types/index.ts`
- **✅ MANDATORY**: Add proper error handling and type guards

### **DEVELOPMENT WORKFLOW**

#### Safe Development Pattern
```typescript
// ✅ CORRECT: Safe type checking
const response = await api.getProducts();
if (response && typeof response === 'object' && 'success' in response) {
  const successResponse = response as ApiResponse<Product[]>;
  if (successResponse.success && successResponse.data) {
    // Safe to use successResponse.data
  }
}

// ❌ WRONG: Unsafe direct access
const data = response.data; // TypeScript error - response is unknown
```

#### Required Type Guards
```typescript
// ✅ REQUIRED: Always check types before access
function isApiResponse(obj: unknown): obj is ApiResponse<unknown> {
  return typeof obj === 'object' &&
         obj !== null &&
         'success' in obj &&
         typeof (obj as any).success === 'boolean';
}

// ✅ REQUIRED: Use type guards before casting
if (isApiResponse(response)) {
  // Now safe to use response.data
}
```

### **ENFORCEMENT PROTOCOL** ⚡ AUTOMATED REJECTION

This policy is **ABSOLUTE** and **NON-NEGOTIABLE**. The Master Validator enforces these standards with **ZERO TOLERANCE**:

#### Master Validator Architecture (4 Enterprise Validators)
1. **TypeSafetyValidator**: Detects all `any` types, SSOT violations, unsafe casting
2. **ArchitectureValidator**: Prevents duplicate filenames, legacy pattern usage
3. **SecurityValidator**: Scans hardcoded secrets, unsafe practices
4. **PerformanceValidator**: Monitors database access patterns, optimization issues

#### Automated Quality Gates
- **Build Pipeline**: `npm run validate:quick` runs on every commit
- **Type Safety**: TypeScript strict mode with zero error tolerance
- **Import Validation**: Automatic detection of legacy import patterns
- **SSOT Compliance**: Real-time monitoring of type definition locations

#### Violation Consequences
- **🚫 AUTO-REJECT**: Any commit with `any` types
- **🚫 AUTO-REJECT**: Any commit with ESLint warnings
- **🚫 AUTO-REJECT**: Any commit bypassing SSOT architecture
- **🚫 AUTO-REJECT**: Any commit with duplicate type definitions

**The FloresYa platform maintains Silicon Valley-grade code quality through absolute enforcement of these standards. Clean code is not optional - it's the foundation of enterprise reliability.**