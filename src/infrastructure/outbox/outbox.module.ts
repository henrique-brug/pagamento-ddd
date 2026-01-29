import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { OutboxRepository } from './outbox.repository';
import { EventPublisherService } from './event-publisher.service';
import { OutboxProcessorService } from './outbox-processor.service';

/**
 * Módulo Outbox
 *
 * Fornece infraestrutura para o padrão Outbox:
 * - OutboxRepository: Gerencia eventos no banco
 * - EventPublisherService: Publica eventos para handlers
 * - OutboxProcessorService: Processa eventos pendentes periodicamente
 *
 * Exporta serviços para uso em outros módulos
 */
@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(), // Necessário para @Cron
  ],
  providers: [OutboxRepository, EventPublisherService, OutboxProcessorService],
  exports: [OutboxRepository, EventPublisherService, OutboxProcessorService],
})
export class OutboxModule {}
