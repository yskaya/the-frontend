# Type Organization

## 🎯 **Philosophy**

**Co-locate types with what uses them**. Start inline, extract when reused. Move to shared only when multiple features need them.

## 📊 **The Simple Rule**

```
1. Used in 1 file?           → Inline in that file
2. Used in 1 feature?        → features/feature-name/feature-name.types.ts
3. Used by 2+ features?      → Move to feature that owns it, export
4. Used by shared code?      → components/Component/component.types.ts
```

## 🗂️ **Current Organization**

```
src/
├── components/
│   └── Notification/
│       └── notification.types.ts    ← Used by Notification + errors
│
└── features/
    ├── auth/
    │   └── auth.api.ts              ← User, LoginResponse types inline
    │
    └── errors/
        └── error.types.ts           ← ErrorContext type (currently unused)
```

## 📋 **Type Locations**

### **Inline Types** (Single File Usage)

✅ **When to use:**
- Type used in only 1 file
- Small types (1-3 properties)
- Component-specific props

```tsx
// LoginGoogleButton.tsx
interface LoginGoogleButtonProps {
  children?: React.ReactNode;
  loading?: boolean;
}

export const LoginGoogleButton = ({ children, loading }: LoginGoogleButtonProps) => {
  // ...
};
```

### **Feature Types** (Feature-Specific)

✅ **When to use:**
- Used by 2+ files in same feature
- Domain-specific to that feature
- Not needed elsewhere

```tsx
// features/auth/auth.api.ts
export interface User {
  email: string;
  firstName: string;
  lastName: string;
  id: string;
}

export interface LoginResponse {
  user: User;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}
```

### **Shared Types** (Cross-Feature)

✅ **When to use:**
- Used by 2+ different features
- Infrastructure types (API, errors)
- Core domain models

```tsx
// components/Notification/notification.types.ts
export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}
```

## 🔄 **Type Evolution**

Types should evolve as your app grows:

### **Stage 1: Inline**
```tsx
// Component.tsx
interface Props {
  name: string;
}
```

### **Stage 2: Feature Types**
```tsx
// features/auth/auth.types.ts (when 2+ files need it)
export interface User {
  name: string;
}
```

### **Stage 3: Shared Types**
```tsx
// When profile, admin, settings all need User
// Keep in features/auth/ but export widely
export interface User {
  name: string;
}
```

## 📊 **Decision Matrix**

| Type | Used By | Location | Filename |
|------|---------|----------|----------|
| **User** | auth only | `features/auth/auth.api.ts` | Inline export |
| **User** | auth + profile + settings | `features/auth/auth.api.ts` | Inline export |
| **LoginResponse** | auth only | `features/auth/auth.api.ts` | Inline export |
| **Notification** | components + errors | `components/Notification/notification.types.ts` | Separate file |
| **ApiError** | api.client | `api/api.client.ts` | Inline |
| **ButtonProps** | Button component only | `components/Button/Button.tsx` | Inline |

## 💡 **Current Types**

### **User Type** (Auth)

```tsx
// features/auth/auth.api.ts
export interface User {
  email: string;
  firstName: string;
  lastName: string;
  id: string;
}
```

**Location reasoning:**
- Currently only auth needs it
- Exported from auth.api.ts
- When other features need User, they import from `@/features/auth`
- No need to move until 3+ features use it

### **Notification Types** (Shared UI)

```tsx
// components/Notification/notification.types.ts
export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  duration?: number;
}

export type NotificationType = Notification['type'];
```

**Location reasoning:**
- Used by Notification components
- Used by error handling feature
- Shared UI infrastructure
- Separate file for clarity

### **API Types** (Infrastructure)

```tsx
// api/api.client.ts
interface ApiError {
  message: string;
  statusCode?: number;
  data?: unknown;
}
```

**Location reasoning:**
- Only used by api.client.ts
- Infrastructure type
- Inline is perfect

## 🎯 **Import Patterns**

### **Feature Types**
```tsx
// Import from feature barrel
import { User, LoginResponse } from '@/features/auth';
import type { User } from '@/features/auth'; // Type-only import
```

### **Shared Types**
```tsx
// Import from component
import { Notification } from '@/components/Notification';
import type { NotificationType } from '@/components/Notification';
```

### **Inline Types**
```tsx
// Not exported, can't import
// Use only within the file
```

## 🚀 **Best Practices**

### **1. Start Inline**
```tsx
// ✅ Start here
const Component = () => {
  interface Data { name: string; }
  // ...
};
```

### **2. Extract When Reused**
```tsx
// ✅ Move to feature types when 2+ files need it
// features/feature/feature.types.ts
export interface Data { name: string; }
```

### **3. Type-Only Imports**
```tsx
// ✅ Use type imports when only importing types
import type { User } from '@/features/auth';
import { loginGoogle, type LoginResponse } from '@/features/auth';
```

### **4. Co-locate with Logic**
```tsx
// ✅ Keep types near related code
features/auth/
├── auth.api.ts        ← User, LoginResponse types here
├── useAuth.ts         ← React Query types here
└── AuthProvider.tsx   ← Context types here
```

### **5. Don't Premature Abstract**
```tsx
// ❌ Don't create until needed
shared/types/user.types.ts  // Only if 3+ features need it

// ✅ Keep in feature until proven needed
features/auth/auth.api.ts   // Export User from here
```

## 📝 **Future Growth**

As your app grows:

```
features/
├── auth/
│   └── auth.api.ts          ← User (exported, used by multiple features)
│
├── payments/
│   └── payment.types.ts     ← Payment, PaymentMethod
│
└── transactions/
    └── transaction.types.ts ← Transaction

// Only create shared/types/ if types are truly cross-cutting
```

## ✅ **Current State**

Your type organization is optimal:
- ✅ Types are co-located
- ✅ No premature abstraction
- ✅ Clear import paths
- ✅ Feature-based organization

**Don't create more type files until you actually need them!**

## 🎯 **Quick Reference**

```
New type?

1. Used in 1 file only?
   → Inline in that file

2. Used in same feature (2+ files)?
   → Inline export in main feature file (e.g., auth.api.ts)

3. Used by 2+ features?
   → Keep in owning feature, import from there

4. Infrastructure type (API, errors)?
   → Inline in infrastructure file (api.client.ts)

5. When in doubt?
   → Start inline, move later when needed
```

**Let usage patterns drive organization, not speculation!** 🎯

