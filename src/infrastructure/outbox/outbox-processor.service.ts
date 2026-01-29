import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OutboxRepository } from './outbox.repository';
import { EventPublisherService } from './event-publisher.service';
import { DomainEvent } from '../../domain/shared/event/domain-event.interface';

/**
 * Outbox Processor - Processa eventos pendentes do outbox
 * Este serviço é responsável por:
 * 1. Buscar eventos pendentes periodicamente
 * 2. Publicar eventos para os handlers apropriados
 * 3. Marcar eventos como processados ou falhos
 * 4. Implementar retry logic para eventos que falharam
 *
 * Padrão Outbox garante:
 * - Consistência eventual entre banco de dados e mensagens
 * - At-least-once delivery de eventos
 * - Ordem de processamento preservada
 */
@Injectable()
export class OutboxProcessorService implements OnModuleInit {
  private readonly logger = new Logger(OutboxProcessorService.name);
  private isProcessing = false;

  constructor(
    private readonly outboxRepository: OutboxRepository,
    private readonly eventPublisher: EventPublisherService,
  ) {}

  async onModuleInit() {
    this.logger.log('Outbox Processor inicializado');
    // Processa eventos imediatamente na inicialização
    await this.processEvents();
  }

  /**
   * Processa eventos pendentes a cada 10 segundos
   * Em produção, ajuste o intervalo conforme necessário
   */
  @Cron(CronExpression.EVERY_10_SECONDS)
  async processEvents(): Promise<void> {
    if (this.isProcessing) {
      this.logger.debug('Processamento já em andamento, pulando...');
      return;
    }

    this.isProcessing = true;

    try {
      const pendingEvents = await this.outboxRepository.findPendingEvents(50);

      if (pendingEvents.length === 0) {
        this.logger.debug('Nenhum evento pendente para processar');
        return;
      }

      this.logger.log(`Processando ${pendingEvents.length} evento(s) pendente(s)`);

      for (const outboxEvent of pendingEvents) {
        await this.processEvent(outboxEvent);
      }

      // Reprocessa eventos falhos que ainda não atingiram o limite de tentativas
      await this.outboxRepository.retryFailedEvents(3);
    } catch (error) {
      this.logger.error('Erro no processamento de eventos:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Processa um único evento do outbox
   */
  private async processEvent(outboxEvent: any): Promise<void> {
    try {
      // Reconstrói o evento de domínio a partir do payload
      const domainEvent: DomainEvent = {
        eventId: outboxEvent.id,
        occurredOn: outboxEvent.createdAt,
        eventType: outboxEvent.eventType,
        aggregateId: outboxEvent.aggregateId,
        aggregateType: outboxEvent.aggregateType,
        payload: JSON.parse(outboxEvent.payload),
      };

      // Publica o evento para os handlers
      const success = await this.eventPublisher.publish(domainEvent);

      if (success) {
        await this.outboxRepository.markAsProcessed(outboxEvent.id);
        this.logger.log(`Evento ${outboxEvent.id} processado com sucesso`);
      } else {
        throw new Error('Falha ao processar evento');
      }
    } catch (error) {
      this.logger.error(
        `Erro ao processar evento ${outboxEvent.id}:`,
        error,
      );

      await this.outboxRepository.markAsFailed(
        outboxEvent.id,
        error.message || 'Erro desconhecido',
      );
    }
  }

  /**
   * Força o processamento imediato (útil para testes)
   */
  async processNow(): Promise<void> {
    this.logger.log('Processamento manual iniciado');
    await this.processEvents();
  }
}
