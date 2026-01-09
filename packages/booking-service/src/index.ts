import { Elysia } from 'elysia';

const app = new Elysia()
  .get('/health', () => ({
    status: 'healthy',
    service: 'booking-service',
    timestamp: new Date().toISOString()
  }))
  .get('/ready', () => ({
    status: 'ready',
    service: 'booking-service',
    timestamp: new Date().toISOString()
  }))
  .get('/api/v1/appointments/test', () => ({
    message: 'Booking service is working',
    service: 'booking-service'
  }))
  .listen(3002);

console.log(`🚀 Booking service is running on port ${app.server?.port}`);