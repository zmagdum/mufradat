#!/bin/bash

# Fix iOS Simulator Runtime Issue for Expo
# This script helps resolve the "Unable to boot device because we cannot determine the runtime bundle" error

echo "🔧 Fixing iOS Simulator Runtime Issue..."

# Shutdown any booted simulators first
echo "🛑 Shutting down any booted simulators..."
xcrun simctl shutdown all 2>/dev/null || true

# Get available runtimes
echo "📋 Checking available iOS runtimes..."
LATEST_RUNTIME=$(xcrun simctl list runtimes | grep -i "iOS" | tail -1 | awk '{print $NF}')

if [ -z "$LATEST_RUNTIME" ]; then
    echo "❌ No iOS runtime found. Please install Xcode and iOS simulators."
    exit 1
fi

echo "✅ Found runtime: $LATEST_RUNTIME"

# Get the first available iPhone device with the latest runtime
echo "📱 Looking for iPhone simulator..."
DEVICE_INFO=$(xcrun simctl list devices available | grep -i "iPhone" | grep -v "unavailable" | head -1)

if [ -z "$DEVICE_INFO" ]; then
    echo "❌ No iPhone simulator found. Please create one in Xcode."
    echo "   Open Xcode → Window → Devices and Simulators → Simulators → +"
    exit 1
fi

# Extract device UDID and name
DEVICE_UDID=$(echo "$DEVICE_INFO" | grep -oE '\([A-F0-9-]+\)' | tr -d '()')
DEVICE_NAME=$(echo "$DEVICE_INFO" | sed 's/(.*//' | xargs)

echo "📱 Found device: $DEVICE_NAME (UDID: $DEVICE_UDID)"

# Try to boot the simulator
echo "🚀 Booting simulator..."
if xcrun simctl boot "$DEVICE_UDID" 2>&1; then
    echo "✅ Simulator booted successfully"
else
    echo "⚠️  Boot command returned error (may already be booted)"
fi

# Open Simulator app
echo "📱 Opening Simulator app..."
open -a Simulator

# Wait for simulator to be ready
echo "⏳ Waiting for simulator to be ready..."
sleep 5

# Verify simulator is booted
BOOTED=$(xcrun simctl list devices booted | grep -c "$DEVICE_UDID" || echo "0")
if [ "$BOOTED" -gt 0 ]; then
    echo "✅ Simulator is now booted and ready!"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Make sure Expo is running: npm start"
    echo "   2. Press 'i' to launch your app on iOS simulator"
    echo "   3. Or run: npm run ios"
else
    echo "⚠️  Simulator may not be fully ready yet."
    echo ""
    echo "💡 Try these steps:"
    echo "   1. Open Simulator manually: open -a Simulator"
    echo "   2. In Simulator menu: Device → Manage Devices"
    echo "   3. Select a device and click 'Boot'"
    echo "   4. Then run: npm start"
    echo "   5. Press 'i' to launch your app"
fi

