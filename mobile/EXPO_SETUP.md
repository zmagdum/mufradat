# Expo Setup Guide for Mufradat

## What is Expo?

Expo is a framework and platform for universal React applications. It provides:

### Key Benefits for Mufradat:

1. **Faster Development**
   - No need to configure Xcode or Android Studio for development
   - Instant preview on real devices using Expo Go app
   - Hot reloading for instant feedback

2. **Built-in Features**
   - **expo-av**: Audio playback for pronunciation
   - **expo-notifications**: Push notifications for review reminders
   - **expo-secure-store**: Secure storage for authentication tokens
   - **expo-file-system**: Offline content management
   - **expo-font**: Custom Arabic fonts support

3. **Cross-Platform**
   - Write once, run on iOS, Android, and Web
   - Consistent API across platforms
   - Easy testing and deployment

4. **AWS Integration**
   - Works seamlessly with AWS Amplify
   - Easy Cognito integration
   - S3 file uploads and downloads

## Getting Started

### 1. Install Expo CLI (Optional)
```bash
npm install -g expo-cli
```

### 2. Install Dependencies
```bash
cd mobile
npm install
```

### 3. Start Development Server
```bash
npm start
```

This will open Expo Dev Tools in your browser with a QR code.

### 4. Test on Your Device

**Option A: Expo Go App (Easiest)**
1. Download "Expo Go" from App Store (iOS) or Google Play (Android)
2. Scan the QR code from the terminal or browser
3. App will load instantly on your device

**Option B: iOS Simulator**
```bash
npm run ios
```

**Option C: Android Emulator**
```bash
npm run android
```

**Option D: Web Browser**
```bash
npm run web
```

## Expo Modules Used in Mufradat

### 1. expo-av (Audio/Video)
```typescript
import { Audio } from 'expo-av';

// Play Quranic word pronunciation
const sound = new Audio.Sound();
await sound.loadAsync({ uri: audioUrl });
await sound.playAsync();
```

### 2. expo-notifications (Push Notifications)
```typescript
import * as Notifications from 'expo-notifications';

// Schedule review reminder
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Time to Review!",
    body: "You have 5 words ready for review",
  },
  trigger: { seconds: 3600 },
});
```

### 3. expo-secure-store (Secure Storage)
```typescript
import * as SecureStore from 'expo-secure-store';

// Store JWT token securely
await SecureStore.setItemAsync('authToken', token);

// Retrieve token
const token = await SecureStore.getItemAsync('authToken');
```

### 4. expo-file-system (Offline Content)
```typescript
import * as FileSystem from 'expo-file-system';

// Download audio for offline use
await FileSystem.downloadAsync(
  audioUrl,
  FileSystem.documentDirectory + 'audio/' + wordId + '.mp3'
);
```

### 5. expo-font (Custom Fonts)
```typescript
import * as Font from 'expo-font';

// Load Arabic calligraphy fonts
await Font.loadAsync({
  'Arabic-Calligraphy': require('./assets/fonts/arabic-calligraphy.ttf'),
});
```

## Development Workflow

### 1. Local Development
```bash
cd mobile
npm start
```
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go for device testing

### 2. Testing on Real Devices
- Install Expo Go app
- Ensure device is on same network as development machine
- Scan QR code
- Changes reflect instantly with hot reload

### 3. Debugging
```bash
# Open React DevTools
npm run start -- --devtools

# View logs
# Logs appear in terminal and Expo Dev Tools
```

## Building for Production

### Option 1: EAS Build (Recommended)

1. **Install EAS CLI**
```bash
npm install -g eas-cli
```

2. **Login to Expo**
```bash
eas login
```

3. **Configure EAS**
```bash
eas build:configure
```

4. **Build for iOS**
```bash
eas build --platform ios
```

5. **Build for Android**
```bash
eas build --platform android
```

6. **Submit to Stores**
```bash
eas submit --platform ios
eas submit --platform android
```

### Option 2: Expo Build (Classic)

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
```

## Over-the-Air (OTA) Updates

Expo allows updating your app without going through app store review:

```bash
# Publish update
expo publish

# Or with EAS Update
eas update --branch production
```

Users get the update next time they open the app!

## Environment Configuration

Create `.env` files for different environments:

**.env.development**
```
API_URL=http://localhost:3000
AWS_REGION=us-east-1
```

**.env.production**
```
API_URL=https://api.mufradat.com
AWS_REGION=us-east-1
```

Access in code:
```typescript
import Constants from 'expo-constants';

const apiUrl = Constants.expoConfig?.extra?.apiUrl;
```

## Common Commands

```bash
# Start development server
npm start

# Clear cache and restart
npm start -- --clear

# Run on specific device
npm run ios -- --device "iPhone 14"

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm test

# Build production APK/IPA
eas build

# Publish OTA update
eas update
```

## Troubleshooting

### Metro bundler issues
```bash
npm start -- --clear
rm -rf node_modules
npm install
```

### iOS simulator not opening
```bash
# Check simulator list
xcrun simctl list

# Open specific simulator
open -a Simulator
```

### Android emulator not starting
```bash
# List available devices
adb devices

# Start emulator
emulator -avd Pixel_5_API_31
```

### Expo Go not connecting
- Ensure device and computer are on same WiFi
- Try switching between LAN and Tunnel mode in Expo Dev Tools
- Disable firewall temporarily

## Next Steps

1. **Authentication**: Implement AWS Cognito integration
2. **State Management**: Set up Redux store
3. **Navigation**: Configure React Navigation
4. **API Integration**: Create service layer for backend calls
5. **Offline Support**: Implement caching with AsyncStorage

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo SDK Reference](https://docs.expo.dev/versions/latest/)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [AWS Amplify with Expo](https://docs.amplify.aws/start/q/integration/expo/)

## Support

For Expo-specific issues:
- [Expo Forums](https://forums.expo.dev/)
- [Expo Discord](https://chat.expo.dev/)
- [Stack Overflow - expo tag](https://stackoverflow.com/questions/tagged/expo)

