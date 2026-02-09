import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ImaiClient } from './imai/imai.client';

@Module({
  imports: [HttpModule],
  controllers: [AppController],
  providers: [AppService, ImaiClient],
})
export class AppModule {}
