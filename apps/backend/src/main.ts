import { config } from 'dotenv';
config(); // Load .env file

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // CORS Configuration - Allow GitHub Pages and local development
  app.enableCors({
    origin: [
      'https://orzbirou.github.io',
      'http://localhost:4200',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });
  
  // Disable ETag to prevent 304 Not Modified responses
  const server = app.getHttpAdapter().getInstance();
  server.set('etag', false);
  
  // Listen on Render's PORT env var (fallback 3000 for local dev)
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port, '0.0.0.0');
  
  console.log(`[Server] Listening on http://0.0.0.0:${port}`);
  console.log(`[CORS] Allowed origins: GitHub Pages + localhost:4200`);
}
void bootstrap();
