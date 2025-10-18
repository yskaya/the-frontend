#!/bin/bash

echo "🔧 Fixing development issues..."
echo ""

# 1. Stop dev server
echo "📍 Step 1: Make sure dev server is stopped (Ctrl+C if running)"
echo ""

# 2. Clear build cache
echo "📍 Step 2: Clearing build cache..."
rm -rf .next
rm -f tsconfig.tsbuildinfo
rm -rf node_modules/.cache
echo "✅ Cache cleared"
echo ""

# 3. Flush Redis (multiple possible container names)
echo "📍 Step 3: Flushing Redis..."
if docker ps | grep -q redis; then
    # Try common Redis container names
    docker exec paypay-redis redis-cli FLUSHALL 2>/dev/null || \
    docker exec redis redis-cli FLUSHALL 2>/dev/null || \
    docker exec paypay_redis redis-cli FLUSHALL 2>/dev/null || \
    echo "⚠️  Could not auto-flush Redis. Run manually:"
    echo "   docker ps | grep redis"
    echo "   docker exec <container-name> redis-cli FLUSHALL"
else
    echo "⚠️  Redis container not found. Make sure backend is running."
fi
echo ""

# 4. Restart dev server
echo "📍 Step 4: Start dev server..."
echo "   Run: npm run dev"
echo ""

echo "✅ Done! Now run: npm run dev"

