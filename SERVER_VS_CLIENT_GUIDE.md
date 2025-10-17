# Server vs Client Components Guide

## ✅ What Changed

Your auth system now uses **server-side rendering** for better performance and UX:

### Before (Client-Side)
```tsx
// ❌ Old way - causes loading flicker
const Dashboard = () => {
  const { user, loading } = useAuthContext();
  
  useEffect(() => {
    validateMe(); // Client API call
  }, []);
  
  if (loading) return <div>Loading...</div>; // Flash!
  if (!user) return null; // Then redirect...
```

### After (Server-Side)
```tsx
// ✅ New way - instant, no flicker
const Dashboard = ({ user }: DashboardProps) => {
  return <div>Welcome {user.firstName}!</div>;
};

export const getServerSideProps: GetServerSideProps = async (context) => {
  return requireAuth(context); // Validates on server, redirects instantly
};
```

## 🎯 When to Use Server vs Client

### Use Server-Side (getServerSideProps) for:

✅ **Auth validation** - Check if user is logged in
✅ **Protected routes** - Redirect before page loads
✅ **Initial data fetching** - Fetch data user needs to see
✅ **SEO-important pages** - Content that crawlers need
✅ **Redirects** - Send user elsewhere based on conditions

### Use Client Components ('use client') for:

✅ **Interactivity** - onClick, onChange, form submissions
✅ **State** - useState, useReducer
✅ **Effects** - useEffect, useLayoutEffect
✅ **Browser APIs** - window, localStorage, navigator
✅ **Real-time updates** - WebSockets, polling
✅ **Context that uses hooks** - useState, useEffect inside providers

## 📋 Simple Rules

### Rule 1: Default to Server
```tsx
// ✅ This is a server component (default in Pages Router)
const Dashboard = ({ user }) => {
  return <div>{user.email}</div>;
};
```

### Rule 2: Add Client Only When Needed
```tsx
// ✅ Only this button needs to be client
'use client'
const LogoutButton = () => {
  const handleClick = () => { /* needs onClick */ };
  return <button onClick={handleClick}>Logout</button>;
};
```

### Rule 3: Auth Goes Server-Side
```tsx
// ✅ Always validate auth on server
export const getServerSideProps: GetServerSideProps = async (context) => {
  const user = await validateServerAuth(context);
  
  if (!user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  
  return { props: { user } };
};
```

## 🚀 Your New Auth Pattern

### Protected Pages (like Dashboard)
```tsx
import { requireAuth } from '@/lib/serverAuth';

const ProtectedPage = ({ user }) => {
  return <div>Protected content for {user.email}</div>;
};

// Just one line - handles everything!
export const getServerSideProps = requireAuth;
```

### Public Pages (like Login)
```tsx
import { redirectIfAuthenticated } from '@/lib/serverAuth';

const LoginPage = () => {
  return <LoginForm />;
};

// Redirects to dashboard if already logged in
export const getServerSideProps = redirectIfAuthenticated;
```

### Pages That Don't Need Auth
```tsx
const HomePage = () => {
  return <div>Welcome to PayPay!</div>;
};

// No getServerSideProps needed - just works!
export default HomePage;
```

## 🎨 Component Examples

### ✅ Server Component (Default)
```tsx
// No 'use client' - this is server by default
const UserProfile = ({ user }) => {
  return (
    <div>
      <h1>{user.firstName}</h1>
      <p>{user.email}</p>
    </div>
  );
};
```

### ✅ Client Component (When Needed)
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

### ✅ Mixed (Server with Client Children)
```tsx
// Parent is server component
const Dashboard = ({ user }) => {
  return (
    <div>
      <h1>Welcome {user.firstName}</h1>
      {/* Child can be client component */}
      <InteractiveWidget />
    </div>
  );
};
```

## 🔄 Auth Flow Diagram

### Old Client-Side Flow
```
1. Page loads → 2. Show loading → 3. Validate API call → 4. Redirect or show content
   ⏱️ Slow        👀 Visible      ⏱️ Wait            👀 Flash!
```

### New Server-Side Flow
```
1. Server validates → 2. Server redirects OR renders with data → 3. User sees final page
   ⚡ Fast            ⚡ Instant                                   ✅ No flash!
```

## 🛠️ Your Helper Functions

Located in `/src/lib/serverAuth.ts`:

### `validateServerAuth(context)`
Returns user object or null. Use for custom logic.

### `requireAuth(context)`
Protects a page - redirects to `/login` if not authenticated.
```tsx
export const getServerSideProps = requireAuth;
```

### `redirectIfAuthenticated(context)`
Redirects to `/dashboard` if already logged in. Use on login/register pages.
```tsx
export const getServerSideProps = redirectIfAuthenticated;
```

## 🎯 Quick Decision Tree

```
Need to:
├─ Show data? 
│  └─ Fetch on server → use getServerSideProps
│
├─ Protect route?
│  └─ Validate on server → use requireAuth
│
├─ Handle click?
│  └─ Need client component → add 'use client'
│
├─ Use useState/useEffect?
│  └─ Need client component → add 'use client'
│
└─ Just display props?
   └─ Keep as server component → do nothing!
```

## 💡 Benefits You Get Now

✅ **No loading flicker** - Server handles redirects before render
✅ **Better SEO** - Search engines see proper redirects
✅ **Faster perceived performance** - Users see final content immediately
✅ **More secure** - Auth validation happens on server
✅ **Simpler code** - No complex useEffect chains
✅ **Better UX** - No "Loading..." → redirect sequence

## 📝 Next Steps

If you want even better performance later:

1. **Add middleware** - Protect multiple routes at once at the Edge
2. **Migrate to App Router** - Get React Server Components
3. **Add ISR/SSG** - Cache pages that don't need real-time data

But for now, your current setup is **production-ready**! 🎉

