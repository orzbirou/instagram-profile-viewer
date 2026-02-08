import { config } from 'dotenv';
config(); // Load .env file

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  
  // Disable ETag to prevent 304 Not Modified responses
  const server = app.getHttpAdapter().getInstance();
  server.set('etag', false);
  
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
