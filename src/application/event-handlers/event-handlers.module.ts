import { Module, OnModuleInit } from '@nestjs/common';
import { OutboxModule } from '../../infrastructure/outbox/outbox.module';
import { EventPublisherService } from '../../infrastructure/outbox/event-publisher.service';
import { AssinaturaCriadaHandler } from './assinatura-criada.handler';

/**
 * Módulo de Event Handlers
 *
 * Registra todos os handlers de eventos de domínio
 * no Event Publisher quando o módulo inicializa
 */
@Module({
  imports: [OutboxModule],
  providers: [AssinaturaCriadaHandler],
})
export class EventHandlersModule implements OnModuleInit {
  constructor(
    private readonly eventPublisher: EventPublisherService,
    private readonly assinaturaCriadaHandler: AssinaturaCriadaHandler,
  ) {}

  onModuleInit() {
    // Registra todos os handlers
    this.eventPublisher.registerHandler(this.assinaturaCriadaHandler);
  }
}
