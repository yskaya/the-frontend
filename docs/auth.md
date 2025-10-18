# Authentication System

## 🎯 **Architecture**

**Google OAuth + JWT Cookies + Server-Side Validation**

```
User → Google OAuth → Backend → JWT Cookie → Frontend → Server validates → Page renders
```

## 🔐 **Authentication Flow**

### **1. Login Flow**

```
1. User clicks "Login with Google"
2. Google OAuth popup opens
3. User authorizes
4. Google returns auth code
5. Frontend sends code to backend
6. Backend validates with Google
7. Backend creates user (if new)
8. Backend generates JWT tokens
9. Backend sets httpOnly cookie (access_token)
10. Frontend redirects to /dashboard
11. Server validates cookie in getServerSideProps
12. Dashboard renders with user data
```

### **2. Session Validation**

```
Server-side (SSR):
1. getServerSideProps reads access_token cookie
2. Calls backend /users/me with cookie
3. Backend validates JWT
4. Returns user data or 401
5. Page renders or redirects

Client-side (React Query):
1. useValidateSession() called
2. React Query checks cache
3. If stale, calls /users/me (silent)
4. Updates cache with fresh user data
5. Component re-renders
```

### **3. Logout Flow**

```
1. User clicks "Logout"
2. Frontend calls logout mutation
3. Backend invalidates tokens
4. Backend clears cookies
5. React Query clears cache
6. Frontend redirects to /
```

## 🏗️ **Components**

### **Server-Side Helpers** (`features/auth/serverAuth.ts`)

#### **validateServerAuth(context)**

Validates user session from cookies on the server.

```tsx
export const validateServerAuth = async (
  context: GetServerSidePropsContext
): Promise<User | null> => {
  const token = context.req.cookies.access_token;
  
  if (!token) {
    return null;
  }
  
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: {
        Cookie: `access_token=${token}`,
      },
    });
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json();
    return data.user || data;
  } catch (error) {
    return null;
  }
};
```

#### **requireAuth(context)**

Protects a route. Redirects to `/login` if not authenticated.

```tsx
export const requireAuth = async (
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{ user: User }>> => {
  const user = await validateServerAuth(context);
  
  if (!user) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }
  
  return {
    props: { user },
  };
};
```

**Usage:**
```tsx
// pages/dashboard.tsx
export const getServerSideProps = async (context) => {
  return requireAuth(context);
};
```

#### **redirectIfAuthenticated(context)**

Redirects to `/dashboard` if already logged in. Use on login/register pages.

```tsx
export const redirectIfAuthenticated = async (
  context: GetServerSidePropsContext
): Promise<GetServerSidePropsResult<{}>> => {
  const user = await validateServerAuth(context);
  
  if (user) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false,
      },
    };
  }
  
  return {
    props: {},
  };
};
```

**Usage:**
```tsx
// pages/login.tsx
export const getServerSideProps = redirectIfAuthenticated;
```

### **API Functions** (`features/auth/auth.api.ts`)

#### **loginGoogle(code)**

Exchanges Google auth code for JWT tokens.

```tsx
export const loginGoogle = async (code: string): Promise<LoginResponse | null> => {
  const response = await api.post<LoginResponse>('/auth/login/google', { code });
  return response.data || null;
};
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

#### **logout()**

Invalidates session and clears cookies.

```tsx
export const logout = async (): Promise<{ message: string } | null> => {
  const response = await api.post<{ message: string }>('/auth/logout');
  return response.data || null;
};
```

#### **validate()**

Validates current session (silent, no error notifications).

```tsx
export const validate = async (): Promise<User | null> => {
  try {
    const response = await api.client.get<User>('/users/me');
    return response.data;
  } catch {
    return null; // Expected when not logged in
  }
};
```

### **React Query Hooks** (`features/auth/useAuth.ts`)

#### **useValidateSession()**

Query hook with Suspense for session validation.

```tsx
export const useValidateSession = () => {
  return useQuery<User | null>({
    queryKey: ['auth', 'session'],
    queryFn: validate,
    suspense: true,
    refetchOnWindowFocus: true,
    retry: false, // Don't retry 401s
  });
};
```

**Usage:**
```tsx
const DashboardContent = () => {
  const { data: user } = useValidateSession();
  return <div>Welcome {user?.firstName}!</div>;
};
```

#### **useLogin()**

Mutation hook for login.

```tsx
export const useLogin = () => {
  const queryClient = useQueryClient();
  
  return useMutation<LoginResponse | null, unknown, string>({
    mutationFn: loginGoogle,
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(['auth', 'session'], data.user);
      }
    },
  });
};
```

**Usage:**
```tsx
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

#### **useLogout()**

Mutation hook for logout.

```tsx
export const useLogout = () => {
  const queryClient = useQueryClient();
  
  return useMutation<{ message: string } | null, unknown, void>({
    mutationFn: logout,
    onSuccess: (data) => {
      if (data) {
        queryClient.removeQueries({ queryKey: ['auth'] });
      }
    },
  });
};
```

### **Context Providers**

#### **GoogleAuthProvider** (`features/auth/GoogleAuthProvider.tsx`)

Wraps app with Google OAuth library.

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

export const GoogleAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
      {children}
    </GoogleOAuthProvider>
  );
};
```

#### **AuthProvider** (`features/auth/AuthProvider.tsx`)

Provides auth context for client-side state.

```tsx
interface AuthContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  const refreshUser = async () => {
    const userData = await validate();
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
```

**Usage:**
```tsx
const { user, setUser, refreshUser } = useAuthContext();
```

### **Components**

#### **LoginGoogleButton**

Google OAuth login button with loading state.

```tsx
import { useGoogleLogin } from '@react-oauth/google';
import { useLogin } from '../useAuth';

export const LoginGoogleButton = () => {
  const loginMutation = useLogin();
  
  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (codeResponse) => {
      const data = await loginMutation.mutateAsync(codeResponse.code);
      if (data) {
        window.location.href = '/dashboard';
      }
    },
    flow: 'auth-code',
    scope: 'email profile openid'
  });
  
  return (
    <button 
      onClick={handleGoogleLogin}
      disabled={loginMutation.isPending}
    >
      {loginMutation.isPending ? 'Logging in...' : 'Login with Google'}
    </button>
  );
};
```

#### **LogoutButton**

Logout button with loading state.

```tsx
import { useLogout } from '../useAuth';

export const LogoutButton = () => {
  const logoutMutation = useLogout();
  
  const handleLogout = async () => {
    const data = await logoutMutation.mutateAsync();
    if (data) {
      window.location.href = '/';
    }
  };
  
  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
};
```

## 🔒 **Security**

### **Cookie Configuration**

Backend sets httpOnly cookies:

```
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Lax; Path=/
```

- **HttpOnly**: JavaScript can't access (XSS protection)
- **Secure**: Only sent over HTTPS (production)
- **SameSite=Lax**: CSRF protection
- **Path=/**: Available to all routes

### **Token Storage**

✅ **DO:** Store in httpOnly cookies
- Automatic inclusion in requests
- Protected from XSS
- Managed by browser

❌ **DON'T:** Store in localStorage/sessionStorage
- Vulnerable to XSS attacks
- Manual inclusion in requests
- Not ideal for sensitive tokens

### **Server-Side Validation**

Always validate on server before rendering:

```tsx
// ✅ Server validates first
export const getServerSideProps = requireAuth;

// ❌ Don't validate only on client
const Dashboard = () => {
  const { user } = useAuthContext();
  if (!user) return <Redirect to="/login" />;
  // ❌ User sees page flash before redirect
};
```

## 📋 **Page Protection Patterns**

### **Protected Route** (Requires Auth)

```tsx
// pages/dashboard.tsx
import { requireAuth } from '@/features/auth';

const Dashboard = ({ user }) => {
  return <div>Welcome {user.firstName}!</div>;
};

export const getServerSideProps = requireAuth;
export default Dashboard;
```

### **Public Route** (Redirect if Authenticated)

```tsx
// pages/login.tsx
import { redirectIfAuthenticated } from '@/features/auth';

const LoginPage = () => {
  return <LoginForm />;
};

export const getServerSideProps = redirectIfAuthenticated;
export default LoginPage;
```

### **Hybrid Route** (Optional Auth)

```tsx
// pages/home.tsx
import { validateServerAuth } from '@/features/auth';

const HomePage = ({ user }) => {
  return (
    <div>
      {user ? (
        <div>Welcome back, {user.firstName}!</div>
      ) : (
        <div>Welcome! Please login.</div>
      )}
    </div>
  );
};

export const getServerSideProps = async (context) => {
  const user = await validateServerAuth(context);
  return { props: { user } };
};

export default HomePage;
```

## 🔄 **Full Page Reload After Auth Actions**

**Why:**
```tsx
// After login/logout, use full page reload
window.location.href = '/dashboard';

// NOT router.push() because:
// - Need fresh cookies in getServerSideProps
// - Ensure server validates with new auth state
// - Prevent stale client state
```

## 🎯 **Best Practices**

### **DO ✅**

1. **Validate on server** - Use `getServerSideProps`
2. **Use httpOnly cookies** - Secure token storage
3. **Full page reload** - After login/logout
4. **Silent validation** - Background session checks
5. **React Query caching** - Fast navigation
6. **Error notifications** - User-initiated actions only

### **DON'T ❌**

1. **Client-only validation** - Causes flicker, insecure
2. **Store tokens in localStorage** - XSS vulnerable
3. **Use router.push()** - After auth (stale cookies)
4. **Show errors for background checks** - Spam user
5. **Manual loading states** - Use React Query
6. **Validate in useEffect** - Slow, flickers

## 🧪 **Testing Auth**

### **Manual Test Flow**

```
1. Visit /dashboard while logged out
   → Should instantly redirect to /login (no flash)

2. Login with Google
   → Should redirect to /dashboard with user data

3. Navigate away and back to /dashboard
   → Should be instant (cached)

4. Wait 5 minutes, return to /dashboard
   → Should refetch in background (still instant)

5. Logout
   → Should redirect to / with cleared cache

6. Visit /login while logged in
   → Should instantly redirect to /dashboard
```

## 🚨 **Common Issues**

### **Issue: "Session Expired" after successful login**

**Cause:** Cookie not set or wrong cookie name

**Fix:**
```tsx
// Backend should set: access_token
// Frontend reads: access_token (snake_case)
context.req.cookies.access_token
```

### **Issue: Redirect loop (login ↔ dashboard)**

**Cause:** Cookie not sent to getServerSideProps

**Fix:** Use `window.location.href` instead of `router.push()`

### **Issue: "Welcome, !" (empty name)**

**Cause:** Backend response structure mismatch

**Fix:**
```tsx
// Backend returns { user: {...} }
// Frontend expects user object directly
const user = data.user || data; // Handle both
```

## 📊 **Auth State Management**

```
┌─────────────────────────────────────────────────┐
│                     User                         │
│                                                  │
│  Server-side (SSR)    Client-side (Cached)      │
│  ├─ Cookie            ├─ React Query Cache      │
│  ├─ getServerSideProps├─ AuthContext            │
│  └─ Initial render    └─ Client hydration       │
│                                                  │
│  Source of Truth      Performance Layer         │
└─────────────────────────────────────────────────┘
```

**Flow:**
1. Server reads cookie → Validates → Renders with user
2. Client hydrates → React Query caches user
3. Navigation → React Query serves from cache (instant)
4. Tab focus → React Query refetches (fresh data)

## ✅ **Checklist**

When adding auth to a new page:

- [ ] Import `requireAuth` or `redirectIfAuthenticated`
- [ ] Add `getServerSideProps` with auth helper
- [ ] Use user from props (not context)
- [ ] Add TypeScript interface for props
- [ ] Test redirect when not logged in
- [ ] Test with valid session
- [ ] Check no loading flicker

**Perfect auth UX!** 🔐

