# Request Libraries: Axios + React Query

## 🎯 **Architecture**

**Hybrid approach**: Axios for HTTP, React Query for caching and state management.

```
Component → React Query Hook → Axios API Call → Backend
               ↓ (caching)        ↓ (errors)
            Cache Layer      Notification System
```

## 🏗️ **Two-Layer System**

### **Layer 1: Axios** (HTTP Client)

Handles:
- ✅ HTTP requests (GET, POST, PUT, DELETE)
- ✅ Error interception
- ✅ Notification triggers
- ✅ Request/response transformation

### **Layer 2: React Query** (Data Layer)

Handles:
- ✅ Caching (5 min fresh, 10 min garbage collection)
- ✅ Automatic refetching (focus, reconnect)
- ✅ Request deduplication
- ✅ Loading states (Suspense)
- ✅ Optimistic updates

## 📁 **Structure**

```
src/
├── api/
│   └── api.client.ts          ← Axios client + error handling
│
├── lib/
│   └── queryClient.ts         ← React Query configuration
│
└── features/auth/
    ├── auth.api.ts            ← API functions (Axios calls)
    └── useAuth.ts             ← React Query hooks
```

## 🔧 **Axios Setup**

### **API Client** (`api/api.client.ts`)

```tsx
import axios, { AxiosError, AxiosInstance } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private errorHandler?: (error: AxiosError) => void;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_USERS_SERVICE_URL,
      timeout: 10000,
      withCredentials: true,
    });
  }

  // Set global error handler (connects to notifications)
  setErrorHandler(handler: (error: AxiosError) => void) {
    this.errorHandler = handler;
  }

  // Wrapper methods with error handling
  async get<T>(url: string, options?: { silent?: boolean }) {
    try {
      const response = await this.client.get<T>(url);
      return { data: response.data };
    } catch (error) {
      if (!options?.silent) {
        this.handleError(error as AxiosError);
      }
      return { error: 'Request failed' };
    }
  }

  async post<T>(url: string, data?: unknown) {
    try {
      const response = await this.client.post<T>(url, data);
      return { data: response.data };
    } catch (error) {
      this.handleError(error as AxiosError);
      return { error: 'Request failed' };
    }
  }

  private handleError(error: AxiosError) {
    if (this.errorHandler) {
      this.errorHandler(error); // → Shows notification
    }
  }
}

export const api = new ApiClient();
```

### **Error Handler Connection** (`pages/_app.tsx`)

```tsx
import { useErrorHandling } from '@/features/errors';

function ApiErrorSetup({ children }) {
  const { handleApiError } = useErrorHandling();
  
  useEffect(() => {
    // Connect Axios errors to notification system
    api.setErrorHandler(handleApiError);
  }, [handleApiError]);
  
  return <>{children}</>;
}
```

## ⚡ **React Query Setup**

### **Query Client** (`lib/queryClient.ts`)

```tsx
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching
      staleTime: 1000 * 60 * 5,      // Fresh for 5 minutes
      gcTime: 1000 * 60 * 10,        // Cache kept for 10 minutes
      
      // Refetching
      refetchOnWindowFocus: true,     // Refetch when tab gains focus
      refetchOnReconnect: true,       // Refetch when internet reconnects
      
      // Retry
      retry: 1,                       // Retry once
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      
      // Suspense disabled globally (enable per-query)
      suspense: false,
    },
    mutations: {
      retry: 0, // Don't retry mutations
    },
  },
});
```

### **Provider Setup** (`pages/_app.tsx`)

```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';

export default function App({ Component, pageProps }) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## 🎯 **Usage Patterns**

### **Pattern 1: API Functions** (Axios Layer)

```tsx
// features/auth/auth.api.ts
import { api } from '@/api/api.client';

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

// ✅ User action - shows notifications on error
export const loginGoogle = async (code: string): Promise<LoginResponse | null> => {
  const response = await api.post<LoginResponse>('/auth/login/google', { code });
  return response.data || null;
};

// ✅ User action - shows notifications
export const logout = async (): Promise<{ message: string } | null> => {
  const response = await api.post<{ message: string }>('/auth/logout');
  return response.data || null;
};

// ✅ Background check - silent (no notifications)
export const validate = async (): Promise<User | null> => {
  try {
    const response = await api.client.get<User>('/users/me');
    return response.data;
  } catch {
    return null; // Expected to fail when not logged in
  }
};
```

### **Pattern 2: React Query Hooks** (Data Layer)

```tsx
// features/auth/useAuth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginGoogle, logout, validate } from './auth.api';

// ✅ Query with Suspense (for data fetching)
export const useValidateSession = () => {
  return useQuery<User | null>({
    queryKey: ['auth', 'session'],
    queryFn: validate,
    suspense: true,           // Enable Suspense
    refetchOnWindowFocus: true,
    retry: false,             // Don't retry 401s
  });
};

// ✅ Mutation for login (user action)
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LoginResponse | null, unknown, string>({
    mutationFn: loginGoogle,
    onSuccess: (data) => {
      if (data) {
        // Update cache with user data
        queryClient.setQueryData(['auth', 'session'], data.user);
      }
    },
  });
};

// ✅ Mutation for logout
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string } | null, unknown, void>({
    mutationFn: logout,
    onSuccess: (data) => {
      if (data) {
        // Clear all auth caches
        queryClient.removeQueries({ queryKey: ['auth'] });
      }
    },
  });
};
```

### **Pattern 3: Component Usage**

```tsx
// ✅ Query with Suspense
import { Suspense } from 'react';
import { useValidateSession } from '@/features/auth';

const DashboardContent = () => {
  const { data: user } = useValidateSession(); // Suspends while loading
  
  return <div>Welcome {user?.firstName}!</div>;
};

const Dashboard = () => {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
};

// ✅ Mutation with loading state
import { useLogin } from '@/features/auth';

const LoginButton = () => {
  const login = useLogin();
  
  const handleLogin = async (code: string) => {
    const data = await login.mutateAsync(code);
    if (data) {
      window.location.href = '/dashboard';
    }
  };
  
  return (
    <button disabled={login.isPending}>
      {login.isPending ? 'Logging in...' : 'Login'}
    </button>
  );
};
```

## 📊 **Feature Comparison**

| Feature | Axios Alone | + React Query |
|---------|------------|---------------|
| **HTTP Requests** | ✅ Yes | ✅ Yes (via Axios) |
| **Error Handling** | ✅ Custom | ✅ Same custom |
| **Notifications** | ✅ Yes | ✅ Yes |
| **Caching** | ❌ No | ✅ 5-10 min |
| **Auto-refetch** | ❌ Manual | ✅ Automatic |
| **Loading States** | ⚠️ Manual | ✅ Built-in |
| **Suspense** | ❌ No | ✅ Yes |
| **Request Dedup** | ❌ No | ✅ Yes |
| **Retry Logic** | ⚠️ Manual | ✅ Exponential backoff |
| **DevTools** | ❌ No | ✅ Visual debugger |

## 🔄 **Data Flow**

### **Query Flow** (Data Fetching)

```
1. Component calls useValidateSession()
2. React Query checks cache
   ├─ Cache hit (fresh) → Return cached data instantly
   └─ Cache miss/stale → Continue
3. React Query calls validate()
4. Axios makes GET /users/me
5. Response comes back
6. React Query updates cache
7. Component re-renders with data
```

### **Mutation Flow** (User Actions)

```
1. User clicks "Login"
2. Component calls login.mutateAsync(code)
3. React Query calls loginGoogle(code)
4. Axios makes POST /auth/login/google
   ├─ Success → Returns data
   └─ Error → Axios shows notification
5. onSuccess callback updates cache
6. Component uses isPending for loading state
```

## ⚡ **Benefits**

### **Caching** (No More Duplicate Requests)

```tsx
// Without React Query:
// Visit dashboard → Fetch user
// Visit profile → Fetch user again
// Return to dashboard → Fetch user again
// = 3 API calls 😢

// With React Query:
// Visit dashboard → Fetch user (cached 5 min)
// Visit profile → Use cache (instant!)
// Return to dashboard → Use cache (instant!)
// = 1 API call 🎉
```

### **Automatic Refetching**

```tsx
// Data auto-refetches when:
// - User switches browser tabs back (refetchOnWindowFocus)
// - Internet reconnects (refetchOnReconnect)
// - Data becomes stale (after 5 min)
// 
// = Always fresh data with no manual code!
```

### **Request Deduplication**

```tsx
// Without React Query:
<Dashboard>
  <UserInfo />   ← Calls useUser()
  <UserAvatar /> ← Calls useUser()
  <UserMenu />   ← Calls useUser()
</Dashboard>
// = 3 API calls for same data 😢

// With React Query:
// = 1 API call, all components share cache 🎉
```

## 🎨 **React Query DevTools**

Visual debugger showing:
- 📊 All queries and their states (loading, success, error)
- 🔍 Cached data inspection
- ⚡ Manual refetch/invalidate buttons
- 🐛 Query timings and dependencies

Access via floating icon in bottom-left corner (dev only).

## 🎯 **Decision Matrix**

| Use Case | Tool | Why |
|----------|------|-----|
| Make HTTP request | Axios | Network layer |
| Show error notification | Axios error handler | User feedback |
| Cache API data | React Query | Performance |
| Background refetch | React Query | Data freshness |
| Loading state (query) | React Query + Suspense | Clean UI |
| Loading state (mutation) | React Query isPending | Button feedback |
| Silent validation | Axios (bypass error handler) | No noise |
| User action | Axios + React Query mutation | Feedback + cache |

## ✅ **Current Implementation**

Your app uses **both**:
- ✅ **Axios** - HTTP layer, error handling, notifications
- ✅ **React Query** - Caching, refetching, loading states
- ✅ **Integrated** - React Query calls Axios functions
- ✅ **Error system preserved** - Same beautiful notifications

**Best of both worlds!** 🎉

## 🚀 **Example: Adding a New Feature**

```tsx
// 1. Create API functions (Axios)
// features/payments/payment.api.ts
export const getPayments = async () => {
  const response = await api.get<Payment[]>('/payments');
  return response.data || [];
};

export const createPayment = async (data: PaymentData) => {
  const response = await api.post<Payment>('/payments', data);
  return response.data || null;
};

// 2. Create React Query hooks
// features/payments/usePayments.ts
export const usePayments = () => {
  return useQuery({
    queryKey: ['payments'],
    queryFn: getPayments,
    suspense: true,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createPayment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
    },
  });
};

// 3. Use in component
const PaymentsList = () => {
  const { data: payments } = usePayments(); // Suspense
  const createMutation = useCreatePayment();
  
  return (
    <div>
      {payments.map(p => <PaymentItem key={p.id} {...p} />)}
      <button onClick={() => createMutation.mutate(newPayment)}>
        Add Payment
      </button>
    </div>
  );
};
```

**Simple, consistent, powerful!** 🚀

