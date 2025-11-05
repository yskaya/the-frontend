# 🎨 Frontend Feature Roadmap

**User-facing improvements and features**

---

## 🚀 High Priority (Do Next)

### 1. Fix Hardcoded Balance (30 min)
**File:** `src/features/wallet/SendCryptoDialog.tsx:186`
```tsx
// Current: Available: 3.847 ETH (hardcoded!)
// Fix: Available: {balance} ETH
```

### 2. USD Price Integration (4 hours)
**Impact:** Show real USD values everywhere

Currently all USD shows "$0". Add CoinGecko API:
```typescript
const price = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd');
const balanceUSD = (parseFloat(balance) * price).toFixed(2);
```

### 3. Gas Estimation UI (1 day)
**Impact:** Show gas fees before sending

Add gas selector:
- Slow: $1.89 (5 min)
- Normal: $2.21 (2 min)
- Fast: $2.84 (30 sec)

---

## 📋 Medium Priority

### 4. Transaction Retry UI (1 day)
Show retry progress: "Retrying 2/3..."

### 5. Error Rate Limiting (1 day)
Prevent duplicate notifications (5s cooldown)

### 6. Notification Stack (1 day)
Max 5 notifications, "Dismiss All" button

---

## 🎯 Low Priority

### 7. QR Code for Receive (2 hours)
Generate QR code for wallet address

### 8. Loading States (2 hours)
Better loading indicators

### 9. Form Validation (3 days)
React Hook Form integration

---

**See:** `BACKLOG_FRONTEND.md` for complete list

