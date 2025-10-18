# Fix Hooks Error - Clean Restart

## The Problem

Hot reload is confused after major code changes. Need a clean restart.

## Steps to Fix

### 1. Stop Dev Server
Press `Ctrl+C` to stop the current dev server.

### 2. Kill Any Hanging Processes
```bash
# Kill any running Next.js processes
pkill -f "next dev"
```

### 3. Clear All Caches
```bash
cd /Users/ykanapatskaya/Workspace/paypay/frontend

rm -rf .next
rm -f tsconfig.tsbuildinfo  
rm -rf node_modules/.cache
```

### 4. Verify Dependencies
```bash
npm install
```

### 5. Start Fresh
```bash
npm run dev
```

### 6. Hard Refresh Browser
- Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows/Linux)
- Or open DevTools and click "Disable cache" + refresh

## Alternative: Use the Script

```bash
chmod +x restart-dev.sh
./restart-dev.sh
npm run dev
```

## After Restart

The hooks error should be gone. If you still see it:

1. **Close all browser tabs** for localhost:3000
2. **Restart browser**  
3. **Go to http://localhost:3000** fresh

This ensures no stale React state in browser memory.

## Why This Happens

When you make major changes to:
- React hooks
- React Query configuration  
- Component structure

Hot reload can get confused about the hooks count. A clean restart solves it.

