# PayPay Frontend

Modern Next.js application with React Query, Server-Side Rendering, and beautiful error handling.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Install React Query
npm install @tanstack/react-query @tanstack/react-query-devtools

# Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📚 Documentation

Comprehensive documentation is in the [`docs/`](./docs/) folder:

- **[docs/README.md](./docs/README.md)** - Start here! Documentation index
- **[docs/Structure.md](./docs/Structure.md)** - Project organization
- **[docs/Auth.md](./docs/Auth.md)** - Authentication system
- **[docs/Errors.md](./docs/Errors.md)** - Error handling system
- **[docs/SSR-vs-Client.md](./docs/SSR-vs-Client.md)** - Server vs client rendering
- **[docs/Types.md](./docs/Types.md)** - TypeScript organization
- **[docs/Request-Libraries.md](./docs/Request-Libraries.md)** - Axios + React Query
- **[BACKLOG.md](./BACKLOG.md)** - Production roadmap and backlog

## 🎯 Tech Stack

- **Framework:** Next.js 14 (Pages Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **HTTP:** Axios
- **Data:** React Query
- **Auth:** Google OAuth + JWT
- **State:** React Context

## 🏗️ Project Structure

```
src/
├── api/              ← Axios client
├── components/       ← Shared UI (Notification)
├── features/         ← Business logic (auth, errors)
├── lib/              ← Utilities (queryClient)
└── pages/            ← Next.js routes
```

See [docs/structure.md](./docs/structure.md) for details.

## ✅ Features

- ✅ Server-side auth (instant redirects, no flicker)
- ✅ React Query (caching, refetching, Suspense)
- ✅ Beautiful error notifications (Adobe Spectrum style)
- ✅ TypeScript (fully typed)
- ✅ Feature-based architecture (scalable)
- ✅ React Query DevTools (visual debugging)

## 🔧 Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5555/api
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id
```

## 📦 Available Scripts

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## 🐛 Troubleshooting

### TypeScript Errors?

```bash
rm -rf .next tsconfig.tsbuildinfo
npm run dev
```

### Stale Cache?

```bash
rm -rf .next node_modules/.cache
npm run dev
```

## 📖 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🎉 You're Ready!

Start with [docs/README.md](./docs/README.md) for comprehensive guides.

**Happy coding!** 🚀
