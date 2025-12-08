#!/bin/bash

echo "🔧 Fixing Mufradat Mobile App..."
echo ""

# Navigate to mobile directory
cd "$(dirname "$0")"

echo "📦 Cleaning old installation..."
rm -rf node_modules
rm -rf package-lock.json
rm -rf .expo
rm -rf /tmp/metro-* 2>/dev/null

echo ""
echo "⬇️  Installing correct package versions..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "🚀 Starting Expo development server..."
echo ""
echo "Once started, you can:"
echo "  - Press 'w' to open in web browser"
echo "  - Press 'i' to open in iOS simulator"
echo "  - Press 'a' to open in Android emulator"
echo "  - Scan QR code with Expo Go app on your phone"
echo ""
echo "Starting now..."
echo ""

npm start

