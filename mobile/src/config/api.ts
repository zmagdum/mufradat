/**
 * API Configuration
 * Centralized configuration for API endpoints
 * 
 * SETUP INSTRUCTIONS:
 * 1. Deploy your backend: cd backend && npm run deploy:local
 * 2. Get your API Gateway ID:
 *    awslocal apigateway get-rest-apis --query 'items[0].id' --output text
 * 3. Set environment variable in .env file:
 *    EXPO_PUBLIC_API_ID=your-api-id-here
 *    OR
 *    EXPO_PUBLIC_API_BASE_URL=https://your-api-id.execute-api.localhost.localstack.cloud:4566/v1
 * 4. Restart your Expo app with: npm start -- --clear
 */

// Safe access to process.env that works in both web and native
const getEnv = (key: string): string | undefined => {
  // For native (iOS/Android), process.env should be available via babel-plugin-inline-dotenv
  // For web, process.env is available via webpack DefinePlugin
  if (typeof process !== 'undefined' && process.env) {
    const value = process.env[key];
    // Return the value if it exists and is not undefined
    if (value !== undefined && value !== null && value !== '') {
      return value;
    }
  }
  // Fallback: try to access via window (for webpack DefinePlugin)
  if (typeof window !== 'undefined' && (window as any).__ENV__) {
    return (window as any).__ENV__[key];
  }
  return undefined;
};

const getApiBaseUrl = (): string => {
  // Get environment variables safely
  const API_BASE_URL = getEnv('EXPO_PUBLIC_API_BASE_URL');
  const API_ID = getEnv('EXPO_PUBLIC_API_ID');
  const STAGE = getEnv('EXPO_PUBLIC_API_STAGE') || 'v1';

  // Debug: Log all environment variables (in development only)
  if (__DEV__) {
    console.log('🔍 Environment variables check:');
    console.log('  EXPO_PUBLIC_API_BASE_URL:', API_BASE_URL || '(not set)');
    console.log('  EXPO_PUBLIC_API_ID:', API_ID || '(not set)');
    console.log('  EXPO_PUBLIC_API_STAGE:', STAGE);
    // Also log the raw process.env to debug
    if (typeof process !== 'undefined' && process.env) {
      console.log('  process.env.EXPO_PUBLIC_API_BASE_URL:', process.env.EXPO_PUBLIC_API_BASE_URL || '(not set)');
      console.log('  process.env keys with EXPO_PUBLIC_:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC_')));
    }
  }

  // Option 1: Use full URL from environment variable (recommended)
  if (API_BASE_URL) {
    const url = API_BASE_URL.trim();
    // Validate URL format
    try {
      new URL(url);
      if (__DEV__) {
        console.log('✅ Using EXPO_PUBLIC_API_BASE_URL:', url);
      }
      return url;
    } catch (error) {
      console.error('⚠️  Invalid EXPO_PUBLIC_API_BASE_URL format:', url);
      throw new Error('Invalid EXPO_PUBLIC_API_BASE_URL format. Please provide a valid URL.');
    }
  }

  // Option 2: Construct from API ID
  if (__DEV__) {
    if (!API_ID || API_ID === '<api-id>') {
      const errorMessage = 
        '⚠️  API_ID not set! Please set EXPO_PUBLIC_API_ID or EXPO_PUBLIC_API_BASE_URL.\n' +
        '   Get your API ID: awslocal apigateway get-rest-apis --query "items[0].id" --output text\n' +
        '   Then set in .env file: EXPO_PUBLIC_API_ID=your-api-id\n' +
        '   OR set: EXPO_PUBLIC_API_BASE_URL=https://your-api-id.execute-api.localhost.localstack.cloud:4566/v1\n' +
        '   NOTE: After setting .env file, you MUST restart Expo with: npm start -- --clear';
      console.error(errorMessage);
      // Return localhost as fallback for web development
      // This allows the app to start but API calls will fail with clear error messages
      console.warn('⚠️  Falling back to http://localhost:3000 (this will likely fail)');
      return 'http://localhost:3000';
    }
    
    // LocalStack execute-api format
    const url = `https://${API_ID}.execute-api.localhost.localstack.cloud:4566/${STAGE}`;
    // Validate constructed URL
    try {
      new URL(url);
      if (__DEV__) {
        console.log('✅ Using constructed URL from API_ID:', url);
      }
      return url;
    } catch (error) {
      console.error('⚠️  Invalid API URL constructed:', url);
      throw new Error('Failed to construct valid API URL. Please check EXPO_PUBLIC_API_ID.');
    }
  } else {
    // Production API URL - update this for production
    const prodUrl = API_BASE_URL || 'https://your-production-api.com/v1';
    try {
      new URL(prodUrl);
      return prodUrl;
    } catch (error) {
      console.error('⚠️  Invalid production API URL:', prodUrl);
      throw new Error('Invalid production API URL. Please set EXPO_PUBLIC_API_BASE_URL.');
    }
  }
};

export const API_BASE_URL = getApiBaseUrl();

// Log the API URL in development (helpful for debugging)
if (__DEV__) {
  console.log('🔗 API Base URL:', API_BASE_URL);
}
