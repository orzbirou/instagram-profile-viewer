import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImaiClient } from './imai/imai.client';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [AppService, ImaiClient],
})
export class AppModule {}
