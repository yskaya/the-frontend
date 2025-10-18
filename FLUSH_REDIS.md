# Fix 429 Rate Limit Error

## Quick Fix (Flush Redis Cache)

Run this command to clear all rate limit counters:

```bash
# Connect to Redis and flush all data
docker exec -it paypay-redis redis-cli FLUSHALL

# Or if Redis is running locally:
redis-cli FLUSHALL
```

## Verify It Worked

```bash
# Check Redis is empty
docker exec -it paypay-redis redis-cli DBSIZE
# Should return: (integer) 0
```

## Alternative: Increase Rate Limit for Development

If you keep hitting rate limits, increase the limit in the backend:

**File:** `backend/services/api-gateway/src/rate-limit.middleware.ts`

```typescript
// Find the login endpoint and increase the limit
'/api/auth/login': {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Increase from 5 to 100 for development
  message: 'Too many login attempts',
},
```

Then restart the backend:

```bash
cd backend
# Restart api-gateway service
docker-compose restart api-gateway
```

## Why This Happens

Rate limiting tracks requests by IP address in Redis. During development with hot-reload, each page refresh counts as a new request, quickly exceeding the limit.

**Production:** Keep strict limits (5-10 requests per 15 min)  
**Development:** Increase limits (50-100 requests) or disable entirely

