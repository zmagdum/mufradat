/**
 * LocalStack Endpoint Resolution
 * Handles endpoint resolution for Lambda functions running in Docker containers
 * 
 * When Lambda functions run in Docker containers (via LocalStack),
 * they need to use host.docker.internal instead of localhost to reach LocalStack
 */

/**
 * Get the correct LocalStack endpoint for Lambda functions
 * Replaces localhost/127.0.0.1 with host.docker.internal when running in containers
 */
export function getLocalStackEndpoint(): string {
  const endpoint = process.env.AWS_ENDPOINT_URL || 'http://localhost:4566';
  
  // If we're in a Lambda container (running in Docker), replace localhost with host.docker.internal
  // This allows Lambda containers to reach LocalStack running on the host
  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    // Check if we're likely in a Lambda container (Lambda runtime environment)
    // Lambda functions run in containers, so they need host.docker.internal
    const dockerHost = process.env.LOCALSTACK_HOST || 'host.docker.internal';
    const resolvedEndpoint = endpoint.replace('localhost', dockerHost).replace('127.0.0.1', dockerHost);
    console.error('[LocalStack] Using Docker host endpoint:', resolvedEndpoint, '(original:', endpoint, ')');
    return resolvedEndpoint;
  }
  
  console.error('[LocalStack] Using endpoint:', endpoint);
  return endpoint;
}

