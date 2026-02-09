import { config } from 'dotenv';
config(); // Load .env file

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS Configuration - Production-ready for Render deployment
  const isDev = process.env.NODE_ENV !== 'production';
  const corsOriginEnv = process.env.CORS_ORIGIN || '';
  
  // Parse CORS origins from comma-separated env var
  let allowedOrigins: string[] | boolean = corsOriginEnv
    .split(',')
    .map(o => o.trim())
    .filter(o => o.length > 0);
  
  // Development fallback
  if (isDev && allowedOrigins.length === 0) {
    allowedOrigins = ['http://localhost:4200'];
  }
  
  // Production security: if no origins specified, deny all (secure default)
  if (!isDev && allowedOrigins.length === 0) {
    console.warn('[CORS] No CORS_ORIGIN set in production - CORS will block all origins');
    allowedOrigins = false;
  }
  
  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false, // Set to true only if you need cookies/auth headers
  });
  
  // Disable ETag to prevent 304 Not Modified responses
  const server = app.getHttpAdapter().getInstance();
  server.set('etag', false);
  
  // Listen on Render's PORT env var (fallback 3000 for local dev)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`[Server] Listening on http://0.0.0.0:${port}`);
  if (isDev) {
    console.log(`[CORS] Allowed origins:`, allowedOrigins);
  }
}
void bootstrap();
