#!/bin/bash

echo "🔄 Restarting dev server cleanly..."
echo ""

# Kill any running dev servers
echo "📍 Stopping any running dev servers..."
pkill -f "next dev" 2>/dev/null || true
sleep 2

# Clear all caches
echo "📍 Clearing all caches..."
rm -rf .next
rm -f tsconfig.tsbuildinfo
rm -rf node_modules/.cache
echo "✅ Caches cleared"
echo ""

# Reinstall dependencies to be safe
echo "📍 Verifying dependencies..."
npm install --silent
echo "✅ Dependencies verified"
echo ""

echo "✅ Ready to start!"
echo ""
echo "Now run: npm run dev"
echo ""

