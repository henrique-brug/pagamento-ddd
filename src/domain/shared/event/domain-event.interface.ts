export interface DomainEvent {
  eventId: string;
  occurredOn: Date;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  payload: any;
}
