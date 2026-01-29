import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AssinaturaHttpModule } from './infrastructure/http/assinatura-http.module';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { OutboxModule } from './infrastructure/outbox/outbox.module';
import { SagaModule } from './infrastructure/saga/saga.module';
import { EventHandlersModule } from './application/event-handlers/event-handlers.module';
import { CriarAssinaturaSagaModule } from './application/sagas/criar-assinatura/criar-assinatura-saga.module';
import { CriarAssinaturaSagaUseCase } from './application/use-cases/criar-assinatura-saga/criar-assinatura-saga.use-case';
import { SagaController } from './infrastructure/http/controllers/saga.controller';

@Module({
  imports: [
    PrismaModule,
    AssinaturaHttpModule,
    OutboxModule, // Padrão Outbox para eventos
    SagaModule, // Padrão Saga para transações distribuídas
    EventHandlersModule, // Handlers de eventos de domínio
    CriarAssinaturaSagaModule, // Saga de criação de assinatura
  ],
  controllers: [AppController, SagaController],
  providers: [AppService, CriarAssinaturaSagaUseCase],
})
export class AppModule {}
