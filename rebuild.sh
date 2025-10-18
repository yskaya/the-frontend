#!/bin/bash

echo "🧹 Cleaning build cache..."

# Stop any running dev servers
pkill -f "next dev" 2>/dev/null || true

# Remove build artifacts
rm -rf .next
rm -rf tsconfig.tsbuildinfo
rm -rf node_modules/.cache

echo "✅ Cache cleared!"
echo ""
echo "🚀 Starting dev server..."
npm run dev

