import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DomainEvent } from '../../domain/shared/event/domain-event.interface';
import { DomainEventHandler } from '../../domain/shared/event/domain-event-handler.interface';

/**
 * Event Publisher - Publica eventos de domínio para os handlers registrados
 * Este serviço é responsável por:
 * 1. Registrar handlers de eventos
 * 2. Publicar eventos para os handlers apropriados
 * 3. Gerenciar o fluxo de eventos assíncronos
 */
@Injectable()
export class EventPublisherService implements OnModuleInit {
  private readonly logger = new Logger(EventPublisherService.name);
  private handlers = new Map<string, DomainEventHandler[]>();

  constructor(private readonly moduleRef: ModuleRef) {}

  async onModuleInit() {
    // Aqui você pode auto-descobrir handlers se necessário
    this.logger.log('Event Publisher inicializado');
  }

  /**
   * Registra um handler para um tipo específico de evento
   */
  registerHandler(handler: DomainEventHandler): void {
    const eventType = handler.eventType;

    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType)!.push(handler);
    this.logger.log(`Handler registrado para evento: ${eventType}`);
  }

  /**
   * Publica um evento para todos os handlers registrados
   * Retorna true se todos os handlers executaram com sucesso
   */
  async publish(event: DomainEvent): Promise<boolean> {
    const handlers = this.handlers.get(event.eventType) || [];

    if (handlers.length === 0) {
      this.logger.warn(
        `Nenhum handler registrado para evento: ${event.eventType}`,
      );
      return true; // Não é um erro se não há handlers
    }

    this.logger.log(
      `Publicando evento ${event.eventType} para ${handlers.length} handler(s)`,
    );

    try {
      // Executa todos os handlers em paralelo
      await Promise.all(handlers.map((handler) => handler.handle(event)));

      this.logger.log(`Evento ${event.eventType} processado com sucesso`);
      return true;
    } catch (error) {
      this.logger.error(
        `Erro ao processar evento ${event.eventType}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Retorna o número de handlers registrados para um tipo de evento
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * Lista todos os tipos de eventos registrados
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}
