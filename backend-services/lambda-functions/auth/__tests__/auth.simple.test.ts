import { APIGatewayProxyEvent } from 'aws-lambda';

// Simple test to verify the handlers can be imported and basic structure
describe('Authentication Handlers', () => {
  it('should import register handler without errors', async () => {
    const { handler } = await import('../register');
    expect(typeof handler).toBe('function');
  });

  it('should import login handler without errors', async () => {
    const { handler } = await import('../login');
    expect(typeof handler).toBe('function');
  });

  it('should import profile handler without errors', async () => {
    const { handler } = await import('../profile');
    expect(typeof handler).toBe('function');
  });

  it('should handle missing request body in register', async () => {
    const { handler } = await import('../register');
    
    const event: Partial<APIGatewayProxyEvent> = {
      body: null,
      httpMethod: 'POST',
      headers: {},
    };

    const result = await handler(event as APIGatewayProxyEvent);
    
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'Request body is required',
    });
  });

  it('should handle missing request body in login', async () => {
    const { handler } = await import('../login');
    
    const event: Partial<APIGatewayProxyEvent> = {
      body: null,
      httpMethod: 'POST',
      headers: {},
    };

    const result = await handler(event as APIGatewayProxyEvent);
    
    expect(result.statusCode).toBe(400);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'Request body is required',
    });
  });

  it('should handle missing authorization header in profile', async () => {
    const { handler } = await import('../profile');
    
    const event: Partial<APIGatewayProxyEvent> = {
      httpMethod: 'GET',
      headers: {},
    };

    const result = await handler(event as APIGatewayProxyEvent);
    
    expect(result.statusCode).toBe(401);
    expect(JSON.parse(result.body)).toMatchObject({
      error: 'Authorization token required',
    });
  });
});