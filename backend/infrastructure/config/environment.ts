/**
 * Environment configuration for AWS infrastructure
 * Supports LocalStack for local development
 */

export interface EnvironmentConfig {
  stage: 'local' | 'dev' | 'test' | 'prod';
  aws: {
    region: string;
    accountId: string;
  };
  localStack: {
    enabled: boolean;
    endpoint: string;
  };
  api: {
    stageName: string;
    corsAllowedOrigins: string[];
  };
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST' | 'PROVISIONED';
    readCapacity?: number;
    writeCapacity?: number;
  };
  s3: {
    mediaBucketName: string;
    lifecycleEnabled: boolean;
  };
  jwt: {
    secretKeyName: string;
    accessTokenExpiry: number; // in seconds
    refreshTokenExpiry: number; // in seconds
  };
  elasticache: {
    enabled: boolean;
    nodeType?: string;
    numCacheNodes?: number;
  };
  tags: {
    Project: string;
    Environment: string;
  };
}

/**
 * Local development configuration (using LocalStack)
 */
export const localConfig: EnvironmentConfig = {
  stage: 'local',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accountId: '000000000000', // LocalStack default account ID
  },
  localStack: {
    enabled: true,
    endpoint: process.env.LOCALSTACK_ENDPOINT || 'http://localhost:4566',
  },
  api: {
    stageName: 'v1',
    corsAllowedOrigins: [
      'http://localhost:19006', // Expo web
      'http://localhost:3000',  // Alternative dev server
      'http://localhost:8081',  // React Native Metro
    ],
  },
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST',
  },
  s3: {
    mediaBucketName: 'mufradat-media-local',
    lifecycleEnabled: false,
  },
  jwt: {
    secretKeyName: 'mufradat-jwt-local',
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 2592000, // 30 days
  },
  elasticache: {
    enabled: false, // Disabled for local development
  },
  tags: {
    Project: 'Mufradat',
    Environment: 'local',
  },
};

/**
 * Development environment configuration (AWS)
 */
export const devConfig: EnvironmentConfig = {
  stage: 'dev',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accountId: process.env.CDK_DEFAULT_ACCOUNT || '',
  },
  localStack: {
    enabled: false,
    endpoint: '',
  },
  api: {
    stageName: 'v1',
    corsAllowedOrigins: [
      'https://dev.mufradat.com',
      'http://localhost:19006', // Allow local testing with dev backend
    ],
  },
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST',
  },
  s3: {
    mediaBucketName: 'mufradat-media-dev',
    lifecycleEnabled: true,
  },
  jwt: {
    secretKeyName: 'mufradat-jwt-dev',
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 2592000, // 30 days
  },
  elasticache: {
    enabled: true,
    nodeType: 'cache.t3.micro',
    numCacheNodes: 1,
  },
  tags: {
    Project: 'Mufradat',
    Environment: 'development',
  },
};

/**
 * Test environment configuration (AWS)
 */
export const testConfig: EnvironmentConfig = {
  stage: 'test',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accountId: process.env.CDK_DEFAULT_ACCOUNT || '',
  },
  localStack: {
    enabled: false,
    endpoint: '',
  },
  api: {
    stageName: 'v1',
    corsAllowedOrigins: [
      'https://test.mufradat.com',
    ],
  },
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST',
  },
  s3: {
    mediaBucketName: 'mufradat-media-test',
    lifecycleEnabled: true,
  },
  jwt: {
    secretKeyName: 'mufradat-jwt-test',
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 2592000, // 30 days
  },
  elasticache: {
    enabled: true,
    nodeType: 'cache.t3.micro',
    numCacheNodes: 1,
  },
  tags: {
    Project: 'Mufradat',
    Environment: 'test',
  },
};

/**
 * Production environment configuration (AWS)
 */
export const prodConfig: EnvironmentConfig = {
  stage: 'prod',
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    accountId: process.env.CDK_DEFAULT_ACCOUNT || '',
  },
  localStack: {
    enabled: false,
    endpoint: '',
  },
  api: {
    stageName: 'v1',
    corsAllowedOrigins: [
      'https://mufradat.com',
      'https://www.mufradat.com',
    ],
  },
  dynamodb: {
    billingMode: 'PAY_PER_REQUEST',
  },
  s3: {
    mediaBucketName: 'mufradat-media-prod',
    lifecycleEnabled: true,
  },
  jwt: {
    secretKeyName: 'mufradat-jwt-prod',
    accessTokenExpiry: 3600, // 1 hour
    refreshTokenExpiry: 2592000, // 30 days
  },
  elasticache: {
    enabled: true,
    nodeType: 'cache.t3.medium',
    numCacheNodes: 2,
  },
  tags: {
    Project: 'Mufradat',
    Environment: 'production',
  },
};

/**
 * Get configuration for current environment
 */
export function getConfig(): EnvironmentConfig {
  const stage = (process.env.STAGE || 'local') as EnvironmentConfig['stage'];
  
  switch (stage) {
    case 'local':
      return localConfig;
    case 'dev':
      return devConfig;
    case 'test':
      return testConfig;
    case 'prod':
      return prodConfig;
    default:
      console.warn(`Unknown stage "${stage}", using local config`);
      return localConfig;
  }
}

/**
 * Check if running in LocalStack mode
 */
export function isLocalStack(): boolean {
  const config = getConfig();
  return config.localStack.enabled;
}

/**
 * Get LocalStack endpoint URL
 */
export function getLocalStackEndpoint(): string | undefined {
  const config = getConfig();
  return config.localStack.enabled ? config.localStack.endpoint : undefined;
}

