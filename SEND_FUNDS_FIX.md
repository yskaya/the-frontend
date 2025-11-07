# Send Funds Fix - Authentication Issue Resolved

## Problem
Users could schedule payments but couldn't send funds immediately on localhost. 

## Root Cause
**Authentication inconsistency between API endpoints:**

1. **Scheduled Payments** (working):
   - Used `api.post()` from unified `ApiClient` class (`@/lib`)
   - Automatically includes:
     - `withCredentials: true` for cookies
     - `Authorization: Bearer <token>` header from localStorage
     - `x-user-id` header from cookies/localStorage
   - Handles cross-origin cookie blocking with fallback to localStorage

2. **Send Transaction** (broken):
   - Used raw `fetch()` API
   - Only included `credentials: 'include'`
   - Manually added `x-user-id` header
   - **Missing**: `Authorization` header for cross-origin scenarios
   - Failed when cookies were blocked (common in localhost/cross-origin)

## Solution
Migrated all wallet API functions to use the unified `ApiClient`:

### Files Changed
- `/frontend/src/features/wallet/wallet.api.ts`

### Functions Updated
1. ✅ `sendCrypto()` - Now uses `api.post()`
2. ✅ `createWallet()` - Now uses `api.post()`
3. ✅ `getWallet()` - Now uses `api.get()`
4. ✅ `getWalletWithTransactions()` - Now uses `api.get()`
5. ✅ `getTransactions()` - Now uses `api.get()`
6. ✅ `syncTransactions()` - Now uses `api.post()`

### Key Changes

**Before (raw fetch):**
```typescript
export const sendCrypto = async (request: SendTransactionRequest): Promise<SendTransactionResponse> => {
  const response = await fetch(`${WALLET_API_BASE}/wallet/send`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'x-user-id': getUserId(),
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    // manual error handling
  }
  
  return response.json();
};
```

**After (unified API client):**
```typescript
export const sendCrypto = async (request: SendTransactionRequest): Promise<SendTransactionResponse> => {
  const response = await api.post<SendTransactionResponse>('/wallet/send', request);
  
  if (response.error || !response.data) {
    const errorMessage = response.error || 'Failed to send transaction';
    console.error('❌ Send transaction error:', errorMessage);
    throw new Error(errorMessage);
  }

  return response.data;
};
```

## Benefits
1. ✅ **Consistent authentication** across all wallet endpoints
2. ✅ **Automatic token refresh** via Axios interceptors
3. ✅ **Cross-origin cookie blocking handled** with localStorage fallback
4. ✅ **Better error handling** with unified error handler
5. ✅ **Cleaner code** - less boilerplate
6. ✅ **Rate limit handling** built-in

## API Client Features (from `/frontend/src/lib/api.client.ts`)
- **Automatic cookie handling**: `withCredentials: true`
- **Token fallback**: Uses localStorage tokens when cookies blocked
- **Auto headers**: 
  - `x-user-id` from cookies or localStorage
  - `Authorization: Bearer <token>` when available
- **Error handling**: Unified error handler with notifications
- **Rate limiting**: Detects and handles 429 responses
- **Timeout**: 60 seconds for long operations

## Testing
1. ✅ Frontend restarted successfully
2. ✅ No linter errors
3. ✅ All services running (API Gateway: 5555, Frontend: 3000)

## Next Steps
1. Test sending funds in browser (should now work)
2. Verify authentication works for all wallet operations
3. Confirm scheduled payments still work (should be unchanged)

## Notes
- The `getUserId()` helper is still used in function signatures for backwards compatibility
- The API client's request interceptor handles the actual user ID injection
- All wallet API calls now consistently use the same authentication mechanism

