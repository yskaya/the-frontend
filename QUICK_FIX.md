# Quick Fix for Errors

## Run These Steps in Order:

### 1. Flush Redis (Fix 429 Rate Limit)

```bash
# Find your Redis container
docker ps | grep redis

# Flush it (replace <container-name> with actual name)
docker exec <container-name> redis-cli FLUSHALL

# Common container names to try:
docker exec paypay-redis redis-cli FLUSHALL
# or
docker exec redis redis-cli FLUSHALL
# or
docker exec paypay_redis redis-cli FLUSHALL
```

### 2. Clear Frontend Cache

```bash
cd /Users/ykanapatskaya/Workspace/paypay/frontend

# Clear build cache
rm -rf .next tsconfig.tsbuildinfo node_modules/.cache
```

### 3. Restart Dev Server

```bash
# Stop current server (Ctrl+C)

# Start fresh
npm run dev
```

### 4. Test Login

1. Clear browser cache (Cmd+Shift+R on Mac)
2. Go to http://localhost:3000/login
3. Login with Google
4. Should redirect smoothly to dashboard

## If Still Getting Errors:

### Hooks Error?
Make sure you installed React Query:
```bash
npm install @tanstack/react-query @tanstack/react-query-devtools
```

### 429 Error Still Happening?
Temporarily increase rate limit in backend:

**File:** `backend/services/api-gateway/src/rate-limit.middleware.ts`

Change login limit from 5 to 100 for development:
```typescript
'/api/auth/login': {
  max: 100, // Increased for development
  // ...
}
```

Then restart backend:
```bash
cd backend
docker-compose restart api-gateway
```

## Verify Everything Works:

- ✅ No hooks errors
- ✅ No 429 rate limit errors  
- ✅ Smooth login flow
- ✅ Instant dashboard load
- ✅ No blinking or flashing

