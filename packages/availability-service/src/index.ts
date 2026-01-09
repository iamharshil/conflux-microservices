import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/health', () => ({
    status: 'healthy',
    service: 'availability-service',
    timestamp: new Date().toISOString()
  }))
  .get('/ready', () => ({
    status: 'ready',
    service: 'availability-service',
    timestamp: new Date().toISOString()
  }))
  .get('/api/v1/availability/test', () => ({
    message: 'Availability service is working',
    service: 'availability-service'
  }))
  .listen(3003);

console.log(`🚀 Availability service is running on port ${app.server?.port}`);