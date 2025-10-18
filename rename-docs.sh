#!/bin/bash

# Rename documentation files to CamelCase
cd "$(dirname "$0")/docs"

# Rename files (Structure.md already exists)
[ -f "auth.md" ] && cp "auth.md" "Auth.md" && rm "auth.md" && echo "✓ Renamed auth.md → Auth.md"
[ -f "errors.md" ] && cp "errors.md" "Errors.md" && rm "errors.md" && echo "✓ Renamed errors.md → Errors.md"
[ -f "ssr-vs-client.md" ] && cp "ssr-vs-client.md" "SSR-vs-Client.md" && rm "ssr-vs-client.md" && echo "✓ Renamed ssr-vs-client.md → SSR-vs-Client.md"
[ -f "types.md" ] && cp "types.md" "Types.md" && rm "types.md" && echo "✓ Renamed types.md → Types.md"
[ -f "request-libraries.md" ] && cp "request-libraries.md" "Request-Libraries.md" && rm "request-libraries.md" && echo "✓ Renamed request-libraries.md → Request-Libraries.md"
[ -f "structure.md" ] && rm "structure.md" && echo "✓ Removed structure.md (Structure.md exists)"

echo ""
echo "✅ All documentation files renamed to CamelCase!"
echo ""
echo "Files in docs/:"
ls -la

