export enum OutboxEventStatus {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  FAILED = 'FAILED',
}

export interface OutboxEvent {
  id: string;
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: string;
  status: OutboxEventStatus;
  createdAt: Date;
  processedAt?: Date;
  attempts: number;
  error?: string;
}

export interface CreateOutboxEventDto {
  aggregateId: string;
  aggregateType: string;
  eventType: string;
  payload: any;
}
