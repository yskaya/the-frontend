# Server vs Client - Quick Reference Card

## 🎯 One-Second Decision

**Ask yourself:** "Does this need to run in the browser?"
- **NO** → Keep as server component (default)
- **YES** → Add `'use client'`

## 📋 Checklist: Do I Need Client?

Need ANY of these? → Use `'use client'`
- [ ] `onClick`, `onChange`, `onSubmit`
- [ ] `useState`, `useReducer`
- [ ] `useEffect`, `useLayoutEffect`
- [ ] `window`, `document`, `localStorage`
- [ ] Browser APIs (WebSocket, Geolocation, etc.)
- [ ] Context with hooks inside

Have NONE of these? → Keep as server (default)

## 🚀 Common Patterns

### Pattern: Protected Page
```tsx
import { requireAuth } from '@/lib/serverAuth';

const Page = ({ user }) => {
  return <div>Hello {user.firstName}</div>;
};

export const getServerSideProps = requireAuth;
```

### Pattern: Login/Register Page
```tsx
import { redirectIfAuthenticated } from '@/lib/serverAuth';

const LoginPage = () => {
  return <LoginForm />;
};

export const getServerSideProps = redirectIfAuthenticated;
```

### Pattern: Public Page
```tsx
const HomePage = () => {
  return <div>Welcome!</div>;
};

export default HomePage;
// No getServerSideProps needed
```

### Pattern: Client Component
```tsx
'use client'
import { useState } from 'react';

const Counter = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>{count}</button>;
};
```

### Pattern: Server with Client Children
```tsx
// Parent: Server (no 'use client')
const Dashboard = ({ user }) => {
  return (
    <div>
      <h1>{user.name}</h1>
      <InteractiveWidget /> {/* Child: Client */}
    </div>
  );
};
```

## ⚡ Quick Fixes

### Problem: "Loading flicker on protected page"
```tsx
// ❌ Don't do this
const Page = () => {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  ...
};

// ✅ Do this instead
const Page = ({ user }) => { // Get from server props
  return <div>{user.name}</div>;
};
export const getServerSideProps = requireAuth;
```

### Problem: "Need user data in component"
```tsx
// Option 1: Pass as prop (preferred)
const Page = ({ user }) => {
  return <UserProfile user={user} />;
};

// Option 2: Use context (if deep nesting)
const SomeDeepComponent = () => {
  const { user } = useAuthContext();
  return <div>{user?.name}</div>;
};
```

### Problem: "Custom auth logic needed"
```tsx
import { validateServerAuth } from '@/lib/serverAuth';

export const getServerSideProps = async (context) => {
  const user = await validateServerAuth(context);
  
  // Your custom logic here
  if (!user || !user.isAdmin) {
    return { redirect: { destination: '/', permanent: false } };
  }
  
  return { props: { user } };
};
```

## 🎨 Component Type Cheat Sheet

| Component | Type | Why |
|-----------|------|-----|
| `<Page />` with props | Server | Just displays data |
| `<Button onClick={...} />` | Client | Has event handler |
| `<Form />` with inputs | Client | Manages state |
| `<Modal />` | Client | Uses state (open/closed) |
| `<Card />` with static text | Server | No interactivity |
| `<Layout />` | Server | Just wraps children |
| `<Dropdown />` | Client | Manages open/closed state |
| `<Link />` (Next.js) | Either | Works in both |
| `<AuthProvider />` | Client | Uses useState |
| `<ThemeProvider />` | Client | Uses useState |

## 📊 Quick Decision Tree

```
Creating a component...
│
├─ Shows user data from props?
│  └─ Server component (default)
│
├─ Has a button that does something?
│  └─ Client component ('use client')
│
├─ Uses form with useState?
│  └─ Client component ('use client')
│
├─ Fetches data on server?
│  └─ Server component + getServerSideProps
│
├─ Uses browser APIs?
│  └─ Client component ('use client')
│
└─ Just displays props/children?
   └─ Server component (default)
```

## 🔥 Hot Tips

1. **Start with server** - Add `'use client'` only when needed
2. **Split components** - Keep interactive parts separate
3. **Use props over context** - When possible, pass data down
4. **One getServerSideProps per page** - Not per component
5. **Auth always on server** - Never validate on client only

## 📝 Your Auth Helpers

Located in `/src/lib/serverAuth.ts`:

```tsx
// Use on protected pages (dashboard, profile, etc.)
export const getServerSideProps = requireAuth;

// Use on login/register pages
export const getServerSideProps = redirectIfAuthenticated;

// Custom logic
const user = await validateServerAuth(context);
```

## ⚠️ Common Mistakes

```tsx
// ❌ DON'T: Client-side auth redirect
useEffect(() => {
  if (!user) router.push('/login');
}, [user]);

// ✅ DO: Server-side auth redirect
export const getServerSideProps = requireAuth;
```

```tsx
// ❌ DON'T: Unnecessary 'use client'
'use client'
const Card = ({ title }) => <div>{title}</div>;

// ✅ DO: Keep it server
const Card = ({ title }) => <div>{title}</div>;
```

```tsx
// ❌ DON'T: Fetch data on client mount
useEffect(() => {
  fetch('/api/data').then(...);
}, []);

// ✅ DO: Fetch on server
export const getServerSideProps = async () => {
  const data = await fetch('/api/data');
  return { props: { data } };
};
```

## 🎯 Remember

**Server = Fast, secure, SEO-friendly**
**Client = Interactive, stateful, browser APIs**

When in doubt, keep it server! Add `'use client'` only when you get an error about hooks or browser APIs.

---

Keep this file open while coding! 🚀

