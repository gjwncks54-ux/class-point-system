#!/bin/bash
# ═══════════════════════════════════════
# Class Point System — Deploy to Firebase
# ═══════════════════════════════════════

set -e

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building app..."
npm run build

echo "🔥 Deploying to Firebase Hosting..."
npx firebase deploy --only hosting

echo ""
echo "✅ Done! Your app is live at:"
echo "   https://class-point-system-f3bec.web.app"
echo ""
