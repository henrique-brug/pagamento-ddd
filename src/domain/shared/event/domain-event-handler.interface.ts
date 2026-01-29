import { DomainEvent } from './domain-event.interface';

export interface DomainEventHandler<T extends DomainEvent = DomainEvent> {
  handle(event: T): Promise<void>;
  eventType: string;
}
