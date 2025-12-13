// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

// Load .env file
function loadEnvFile() {
  const envPath = path.resolve(__dirname, '.env');
  const env = {};
  
  if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=').trim();
          // Remove quotes if present
          const cleanValue = value.replace(/^["']|["']$/g, '');
          env[key] = cleanValue;
        }
      }
    });
  }
  
  return env;
}

// Load environment variables from .env
const envVars = loadEnvFile();

// Set environment variables for Metro bundler
// This ensures they're available during the build process
Object.keys(envVars).forEach((key) => {
  if (key.startsWith('EXPO_PUBLIC_')) {
    process.env[key] = envVars[key];
    console.log(`✅ Loaded ${key} from .env file`);
  }
});

const config = getDefaultConfig(__dirname);

// Log loaded env vars for debugging
if (process.env.EXPO_PUBLIC_API_BASE_URL) {
  console.log('🔗 Metro config loaded EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL);
}

module.exports = config;

