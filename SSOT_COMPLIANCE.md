# 🌸 FloresYa SSOT (Single Source of Truth) Compliance Guide

## 📋 Overview

**Single Source of Truth (SSOT)** is a **CATEGORICAL REQUIREMENT** in the FloresYa project. This document outlines the absolute rules, validation mechanisms, and compliance procedures that **MUST** be followed without exception.

## 🚨 ZERO TOLERANCE POLICY

- ❌ **0 duplicates allowed** - Any duplicate type, interface, or constant will be rejected
- ❌ **0 file name conflicts** - Files with identical names in different directories are prohibited
- ❌ **0 redeclarations** - No type or variable can be declared more than once
- ❌ **0 exceptions** - All violations will be automatically blocked by pre-commit hooks

## 📁 Project Structure (SSOT Compliant)

```
src/
├── shared/                          # 🏛️ SINGLE SOURCE OF TRUTH
│   ├── types/                       # ✅ All interfaces, types, enums
│   │   └── index.ts                 # 📋 Consolidated type exports
│   ├── constants/                   # ✅ All constants, configurations
│   │   └── index.ts                 # 📋 Consolidated constant exports
│   └── utils/                       # ✅ Shared utility functions
│       └── index.ts                 # 📋 Consolidated utility exports
├── controllers/                     # ✅ Backend controllers
├── services/                        # ✅ Backend services
├── frontend/                        # ✅ Frontend modules
│   ├── types/                       # ✅ Frontend-specific types (re-exports only)
│   └── services/                    # ✅ Frontend services
└── utils/                           # ✅ Backend utilities
```

## ✅ ALLOWED PATTERNS

### 1. **Shared Types Structure**
```typescript
// ✅ CORRECT: All types in shared/
export interface User {
  id: number;
  email: string;
  // ... other properties
}

// ✅ CORRECT: Frontend re-exports from shared
export type { User, Product } from '../../shared/types/index.js';
```

### 2. **Index.ts Files in Shared Directory**
```typescript
// ✅ CORRECT: Multiple index.ts files in shared subdirectories
src/shared/types/index.ts      // Main types
src/shared/constants/index.ts  // Constants
src/shared/utils/index.ts      // Utilities
```

### 3. **Frontend Re-exports**
```typescript
// ✅ CORRECT: Frontend types re-export from shared
export type {
  User,
  Product,
  Order
} from '../../shared/types/index.js';
```

## ❌ PROHIBITED PATTERNS

### 1. **Duplicate Type Definitions**
```typescript
// ❌ WRONG: Same interface in multiple files
// File 1: src/types/user.ts
export interface User { id: number; }

// File 2: src/models/user.ts
export interface User { id: number; } // DUPLICATE!
```

### 2. **File Name Conflicts**
```typescript
// ❌ WRONG: Same filename in different directories
src/types/database.ts
src/models/database.ts  // CONFLICT!
```

### 3. **Direct Type Duplication**
```typescript
// ❌ WRONG: Copying types instead of importing
// File: src/frontend/types.ts
export interface User {  // DUPLICATE!
  id: number;
  email: string;
}
```

## 🔧 Validation Mechanisms

### 1. **Automated Validation Script**
```bash
# Run SSOT validation manually
node scripts/validate-ssot.js
```

**What it checks:**
- ✅ Duplicate export declarations
- ✅ File name conflicts
- ✅ Type redeclarations
- ✅ Import consistency

### 2. **Pre-commit Hook**
- ✅ Automatically runs before every commit
- ✅ Blocks commits with SSOT violations
- ✅ Provides clear error messages

### 3. **ESLint Rules**
```javascript
// eslint.config.js
rules: {
  '@typescript-eslint/no-redeclare': 'error',        // ❌ No redeclarations
  '@typescript-eslint/no-duplicate-imports': 'error', // ❌ No duplicate imports
  'no-redeclare': 'error'                           // ❌ No variable redeclarations
}
```

### 4. **TypeScript Configuration**
```json
// tsconfig.json
{
  "compilerOptions": {
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

## 🚀 Compliance Workflow

### For New Types/Interfaces
1. **ALWAYS** add to `src/shared/types/index.ts`
2. **NEVER** create duplicate definitions
3. **ALWAYS** import from shared types
4. **ALWAYS** run validation before commit

### For Existing Code
1. **IDENTIFY** all duplicate definitions
2. **REMOVE** duplicates, keep only in shared/
3. **UPDATE** all imports to use shared types
4. **VALIDATE** with SSOT script
5. **COMMIT** with confidence

## 📊 Monitoring & Reporting

### Validation Results
```bash
✅ SSOT VALIDATION PASSED
✅ No export violations found
✅ No file name violations found
✅ All type definitions follow Single Source of Truth principles
```

### Violation Examples
```bash
❌ SSOT VALIDATION FAILED
🚨 EXPORT VIOLATIONS FOUND (2):
  1. User:
     - src/types/user.ts
     - src/models/user.ts
  2. Product:
     - src/types/product.ts
     - src/frontend/types.ts
```

## 🛠️ Troubleshooting

### Common Issues & Solutions

**Issue:** "Export violation: User interface found in multiple files"
**Solution:** Remove duplicate User interfaces, keep only in `src/shared/types/index.ts`

**Issue:** "File name violation: index.ts found in multiple directories"
**Solution:** This is allowed only in `src/shared/` subdirectories

**Issue:** "Type redeclaration error"
**Solution:** Use unique names or consolidate into shared types

### Manual Validation
```bash
# Check for duplicate exports
node scripts/validate-ssot.js

# Check ESLint compliance
npm run lint

# Check TypeScript compilation
npm run build
```

## 📚 Best Practices

### 1. **Type Organization**
```typescript
// ✅ Group related types together
export interface User { /* ... */ }
export interface UserProfile extends User { /* ... */ }
export interface UserSettings { /* ... */ }
```

### 2. **Import Strategy**
```typescript
// ✅ Import from single source
import type { User, Product, Order } from '../../shared/types/index.js';

// ❌ Don't import from multiple sources
import type { User } from '../types/user.js';
import type { Product } from '../types/product.js';
```

### 3. **Naming Conventions**
```typescript
// ✅ Use descriptive, unique names
export interface UserAccount { /* ... */ }
export interface ProductInventory { /* ... */ }

// ❌ Avoid generic names that might conflict
export interface Data { /* ... */ } // Too generic!
export interface Item { /* ... */ } // Too generic!
```

## 🔒 Enforcement

### Automatic Enforcement
- ✅ Pre-commit hooks block violating commits
- ✅ ESLint rules prevent violations during development
- ✅ TypeScript compiler catches type conflicts

### Manual Enforcement
- ✅ Code reviews must verify SSOT compliance
- ✅ All PRs must pass SSOT validation
- ✅ Documentation must reflect current SSOT state

## 📈 Metrics

### Success Metrics
- ✅ **0 SSOT violations** in codebase
- ✅ **100% type coverage** from shared types
- ✅ **0 duplicate file names** (excluding shared/index.ts)
- ✅ **0 redeclared types** or variables

### Monitoring
- ✅ Daily automated SSOT validation
- ✅ Pre-commit validation on all branches
- ✅ ESLint compliance in CI/CD pipeline

---

## 🎯 Summary

**SSOT is NON-NEGOTIABLE** in FloresYa. Every type, interface, and constant must have exactly one source of truth. The automated validation, pre-commit hooks, and ESLint rules ensure this requirement is enforced at all times.

**Remember:** If you see a duplicate, remove it immediately. If you need a new type, add it to shared types first. Always validate before committing.

---

*This document is maintained by the FloresYa development team and updated with each SSOT enhancement.*