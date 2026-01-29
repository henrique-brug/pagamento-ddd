import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssinaturaHttpModule } from './infrastructure/http/assinatura-http.module';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';

@Module({
  imports: [PrismaModule, AssinaturaHttpModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
