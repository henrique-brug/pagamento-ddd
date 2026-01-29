import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import {
  CreateOutboxEventDto,
  OutboxEvent,
  OutboxEventStatus,
} from './outbox.types';
import { randomUUID } from 'crypto';

@Injectable()
export class OutboxRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Adiciona um evento ao outbox dentro de uma transação
   * Isso garante que o evento seja salvo atomicamente com as mudanças de dados
   */
  async addEvent(
    event: CreateOutboxEventDto,
    prismaClient?: any,
  ): Promise<OutboxEvent> {
    const client = prismaClient || this.prisma;

    const outboxEvent = await client.outboxEvent.create({
      data: {
        id: randomUUID(),
        aggregateId: event.aggregateId,
        aggregateType: event.aggregateType,
        eventType: event.eventType,
        payload: JSON.stringify(event.payload),
        status: OutboxEventStatus.PENDING,
        attempts: 0,
      },
    });

    return this.toDomain(outboxEvent);
  }

  /**
   * Busca eventos pendentes para processamento
   * Usa order by para garantir processamento em ordem cronológica
   */
  async findPendingEvents(limit: number = 100): Promise<OutboxEvent[]> {
    const events = await this.prisma.outboxEvent.findMany({
      where: {
        status: OutboxEventStatus.PENDING,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: limit,
    });

    return events.map((event) => this.toDomain(event));
  }

  /**
   * Marca um evento como processado
   */
  async markAsProcessed(eventId: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxEventStatus.PROCESSED,
        processedAt: new Date(),
      },
    });
  }

  /**
   * Marca um evento como falho e incrementa tentativas
   */
  async markAsFailed(eventId: string, error: string): Promise<void> {
    await this.prisma.outboxEvent.update({
      where: { id: eventId },
      data: {
        status: OutboxEventStatus.FAILED,
        error,
        attempts: {
          increment: 1,
        },
      },
    });
  }

  /**
   * Reprocessa eventos falhos (reseta status para PENDING)
   * Útil para retry de eventos que falharam
   */
  async retryFailedEvents(maxAttempts: number = 3): Promise<void> {
    await this.prisma.outboxEvent.updateMany({
      where: {
        status: OutboxEventStatus.FAILED,
        attempts: {
          lt: maxAttempts,
        },
      },
      data: {
        status: OutboxEventStatus.PENDING,
      },
    });
  }

  private toDomain(data: any): OutboxEvent {
    return {
      id: data.id,
      aggregateId: data.aggregateId,
      aggregateType: data.aggregateType,
      eventType: data.eventType,
      payload: data.payload,
      status: data.status as OutboxEventStatus,
      createdAt: data.createdAt,
      processedAt: data.processedAt,
      attempts: data.attempts,
      error: data.error,
    };
  }
}
