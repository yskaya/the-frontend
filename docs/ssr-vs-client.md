# Server-Side vs Client-Side Rendering

## 🎯 **Philosophy**

**Server-first**: Validate auth and fetch initial data on the server for instant, flicker-free pages. Use client components only when needed for interactivity.

## 📊 **When to Use What**

### **Use Server-Side (getServerSideProps)** ✅

| Use Case | Why | Example |
|----------|-----|---------|
| **Auth validation** | Instant redirect before page loads | Protected routes (dashboard) |
| **Auth redirect** | Prevent logged-in users seeing login | Login/register pages |
| **Initial data** | Pre-render with user's data | Dashboard with user info |
| **SEO** | Crawlers need content | Public pages, marketing |
| **Redirects** | Send users based on conditions | `/` → `/dashboard` if logged in |

### **Use Client Components ('use client')** ⚡

| Use Case | Why | Example |
|----------|-----|---------|
| **Interactivity** | onClick, onChange handlers | Buttons, forms, dropdowns |
| **State** | useState, useReducer | Form inputs, toggles |
| **Effects** | useEffect, timers | Data polling, animations |
| **Browser APIs** | window, localStorage | Theme toggle, offline detection |
| **Real-time** | WebSockets, SSE | Chat, notifications |
| **Providers with hooks** | Context with useState | AuthProvider, NotificationProvider |

## 🎯 **Decision Tree**

```
Need to:
├─ Validate auth?
│  └─ Server (getServerSideProps + requireAuth)
│
├─ Fetch initial data?
│  └─ Server (getServerSideProps)
│
├─ Handle user interaction?
│  └─ Client ('use client' + onClick/onChange)
│
├─ Use state/effects?
│  └─ Client ('use client' + useState/useEffect)
│
└─ Just display props?
   └─ Server (default, do nothing)
```

## 🔐 **Auth Patterns**

### **Pattern 1: Protected Route (Server Validation)**

```tsx
// pages/dashboard.tsx
import { requireAuth, type User } from '@/features/auth';

interface Props {
  initialUser: User;
}

const Dashboard = ({ initialUser }: Props) => {
  return <div>Welcome {initialUser.firstName}!</div>;
};

// ✅ Server validates - instant redirect if not logged in
export const getServerSideProps = async (context) => {
  const result = await requireAuth(context);
  
  if ('props' in result && result.props) {
    return {
      props: {
        initialUser: result.props.user,
      },
    };
  }
  
  return result; // Redirect to /login
};

export default Dashboard;
```

**Benefits:**
- ✅ No loading flicker
- ✅ Instant redirect
- ✅ User never sees protected content
- ✅ SEO-friendly (proper 302 redirect)

### **Pattern 2: Public Route (Redirect if Authenticated)**

```tsx
// pages/login.tsx
import { redirectIfAuthenticated } from '@/features/auth';

const LoginPage = () => {
  return <LoginForm />;
};

// ✅ Redirects to dashboard if already logged in
export const getServerSideProps = redirectIfAuthenticated;

export default LoginPage;
```

**Benefits:**
- ✅ No flicker
- ✅ Logged-in users instantly go to dashboard
- ✅ Clean UX

### **Pattern 3: Mixed (Server + Client)**

```tsx
// Server component (page)
const Dashboard = ({ initialUser }: Props) => {
  return (
    <div>
      <h1>Welcome {initialUser.firstName}</h1>
      {/* Client component for interactivity */}
      <LogoutButton />
    </div>
  );
};

// LogoutButton.tsx (client component)
'use client'
const LogoutButton = () => {
  const handleClick = () => { /* ... */ };
  return <button onClick={handleClick}>Logout</button>;
};
```

## 🛠️ **Server Auth Helpers**

Located in `features/auth/serverAuth.ts`:

### **`validateServerAuth(context)`**

Validates user session from cookies. Returns user or null.

```tsx
export const validateServerAuth = async (context: GetServerSidePropsContext) => {
  const token = context.req.cookies.access_token;
  
  if (!token) return null;
  
  try {
    const response = await fetch(`${API_URL}/users/me`, {
      headers: { Cookie: `access_token=${token}` }
    });
    
    return response.ok ? await response.json() : null;
  } catch {
    return null;
  }
};
```

### **`requireAuth(context)`**

Protects a route. Redirects to `/login` if not authenticated.

```tsx
export const requireAuth = async (context: GetServerSidePropsContext) => {
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

### **`redirectIfAuthenticated(context)`**

Redirects to `/dashboard` if already logged in.

```tsx
export const redirectIfAuthenticated = async (context: GetServerSidePropsContext) => {
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

## 🔄 **Auth Flow Comparison**

### **❌ Old: Client-Side (Slow, Flickers)**

```
1. Page loads
2. Show "Loading..."          ← User sees this
3. Client calls /users/me
4. Wait for response
5. Check auth
6. Redirect or show content   ← Flash/flicker

⏱️ Time: 500-1000ms of loading state
👀 User sees: Loading → Redirect (bad UX)
```

### **✅ New: Server-Side (Fast, No Flicker)**

```
1. Server validates session
2. Server redirects OR renders with data
3. User sees final page       ← Instant!

⏱️ Time: 50-100ms (server-only)
👀 User sees: Final page immediately (great UX)
```

## 📋 **Component Examples**

### **✅ Server Component (Default)**

```tsx
// No 'use client' - runs on server
const UserProfile = ({ user }) => {
  return (
    <div>
      <h1>{user.firstName}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

### **✅ Client Component (Interactive)**

```tsx
'use client'
import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);
  
  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  );
};
```

### **✅ Mixed Pattern**

```tsx
// Server component
const Dashboard = ({ user }) => {
  return (
    <div>
      {/* Static content - server rendered */}
      <h1>Welcome {user.firstName}</h1>
      
      {/* Interactive - client component */}
      <InteractiveWidget />
    </div>
  );
};
```

## 🎯 **Rules of Thumb**

### **Rule 1: Default to Server**
```tsx
// ✅ Just render props? Keep it server (default)
const Profile = ({ user }) => {
  return <div>{user.email}</div>;
};
```

### **Rule 2: Client Only When Needed**
```tsx
// ✅ Need onClick? Make it client
'use client'
const Button = () => {
  return <button onClick={...}>Click</button>;
};
```

### **Rule 3: Auth Always on Server**
```tsx
// ✅ Always validate auth server-side
export const getServerSideProps = requireAuth;
```

## 💡 **Benefits**

### **Server-Side Benefits:**
- ⚡ Faster initial load (no loading state)
- 🔒 More secure (auth on server)
- 🎨 No flicker/flash
- 🤖 Better SEO (proper redirects)
- 📱 Better mobile (less JS)

### **Client-Side Benefits:**
- ⚡ Instant interactions
- 🎨 Rich interactivity
- 📊 Real-time updates
- 💾 Local state management

## 🚀 **Best of Both**

Our hybrid approach:
1. **Server validates** → Instant redirects
2. **React Query caches** → Instant navigation
3. **Client interacts** → Smooth UX

**Perfect balance!** 🎉

## 📚 **Additional Resources**

- Next.js Pages Router: Server-side rendering by default
- Next.js Middleware: Advanced edge-based auth (future)
- App Router: React Server Components (future migration)

