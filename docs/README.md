# PayPay Frontend Documentation

## 📚 **Documentation Index**

### **Core Concepts**

1. **[Structure](./Structure.md)** - Project organization and folder structure
2. **[Auth](./Auth.md)** - Authentication system (Google OAuth + JWT)
3. **[Errors](./Errors.md)** - Error handling system and notification banners
4. **[SSR vs Client](./SSR-vs-Client.md)** - Server-side vs client-side rendering
5. **[Types](./Types.md)** - TypeScript type organization
6. **[Request Libraries](./Request-Libraries.md)** - Axios + React Query integration

### **Planning**

7. **[BACKLOG](../BACKLOG.md)** - Future improvements and production roadmap

## 🎯 **Quick Start**

### **Project Overview**

This is a Next.js (Pages Router) application with:
- ✅ **Feature-based structure** - Organized by business domain
- ✅ **Server-side auth** - Instant redirects, no flicker
- ✅ **React Query** - Caching, refetching, Suspense
- ✅ **Axios** - HTTP client with custom error handling
- ✅ **Beautiful notifications** - Adobe Spectrum-style error banners

### **Tech Stack**

- **Framework:** Next.js 14 (Pages Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP:** Axios
- **Data:** React Query
- **Auth:** Google OAuth + JWT cookies
- **State:** React Context

## 📖 **Documentation Guide**

### **1. Structure** 

**Read this if you're:**
- New to the project
- Adding new features
- Wondering where to put code

**Learn:**
- Folder organization (api/, components/, features/, pages/)
- Feature-based architecture
- Co-location principles
- Import patterns

### **2. Auth**

**Read this if you're:**
- Implementing login/logout
- Protecting routes
- Understanding the auth flow

**Learn:**
- Google OAuth flow
- Cookie-based authentication
- Server-side validation helpers
- React Query hooks for auth
- Session management

### **3. Errors**

**Read this if you're:**
- Handling API errors
- Creating new API endpoints
- Customizing error messages

**Learn:**
- Error handling flow (API → Axios → Notification)
- When to show vs. silent errors
- Notification banner system
- Custom error messages

### **4. SSR vs Client**

**Read this if you're:**
- Creating new pages
- Protecting routes with auth
- Wondering when to use 'use client'

**Learn:**
- Server-side rendering (getServerSideProps)
- Client components ('use client')
- Auth validation on server
- When to use which approach

### **5. Types**

**Read this if you're:**
- Creating new TypeScript types
- Organizing interfaces
- Wondering where types should live

**Learn:**
- Inline vs. feature vs. shared types
- Type co-location rules
- When to extract types
- Import patterns

### **6. Request Libraries**

**Read this if you're:**
- Making API calls
- Using React Query
- Understanding caching

**Learn:**
- Axios setup and error handling
- React Query configuration
- Query vs. Mutation patterns
- Caching and refetching

## 🚀 **Common Tasks**

### **Add a New Feature**

1. Create `features/feature-name/`
2. Add API functions in `feature-name.api.ts`
3. Add React Query hooks in `useFeatureName.ts`
4. Add components in `ComponentName/`
5. Export from `index.ts`

→ See: [Structure](./Structure.md)

### **Protect a Page with Auth**

1. Import `requireAuth` or `redirectIfAuthenticated`
2. Add `getServerSideProps` with helper
3. Use user from props
4. Test redirect behavior

→ See: [Auth](./Auth.md)

### **Add a New Page**

1. Create `pages/page-name.tsx`
2. Add `getServerSideProps` if needs auth/data
3. Use Suspense for data fetching
4. Add loading skeleton if needed

→ See: [SSR vs Client](./SSR-vs-Client.md)

### **Handle New Error Types**

1. Add case to `useErrorHandling.ts`
2. Define message, button, action
3. Test on `/test-errors` page

→ See: [Errors](./Errors.md)

### **Make API Calls**

1. Add function to `feature.api.ts` using Axios
2. Create React Query hook in `useFeature.ts`
3. Use hook in component
4. Errors handled automatically

→ See: [Request Libraries](./Request-Libraries.md)

## 🎯 **Best Practices**

### **Do's** ✅

- Use server-side auth validation (getServerSideProps)
- Co-locate types with code that uses them
- Use React Query for data fetching
- Show notifications for user-initiated errors
- Keep folder structure flat
- Use Suspense for loading states

### **Don'ts** ❌

- Don't create folders for 1-2 files
- Don't duplicate types across features
- Don't show notifications for background checks
- Don't validate auth on client-side
- Don't nest folders more than 2-3 levels
- Don't use manual loading states (use React Query)

## 🔧 **Development**

### **Setup**

```bash
cd frontend
npm install
npm run dev
```

### **Environment Variables**

```env
NEXT_PUBLIC_USERS_SERVICE_URL=http://localhost:5002
NEXT_PUBLIC_WALLET_SERVICE_URL=http://localhost:5006
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

### **Useful Commands**

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Run ESLint
npm run type-check   # Check TypeScript
```

### **Clean Build**

```bash
rm -rf .next tsconfig.tsbuildinfo
npm run dev
```

## 📊 **Project Stats**

- **Total folders:** 10
- **Max nesting:** 2 levels
- **Features:** 2 (auth, errors)
- **Pages:** 4 (index, login, dashboard, test-errors)
- **Lint errors:** 0 ✅

## 🎉 **You're Ready!**

Pick a doc above and start reading. The documentation is:
- ✅ Concise (no fluff)
- ✅ Practical (real examples)
- ✅ Up-to-date (matches current code)
- ✅ Searchable (clear headings)

**Happy coding!** 🚀

