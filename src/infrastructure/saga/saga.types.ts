export enum SagaStatus {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
}

export enum SagaStepStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  COMPENSATED = 'COMPENSATED',
}

export interface SagaStep {
  id: string;
  sagaId: string;
  stepName: string;
  stepOrder: number;
  status: SagaStepStatus;
  input?: string;
  output?: string;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SagaInstance {
  id: string;
  sagaType: string;
  status: SagaStatus;
  currentStep: number;
  payload: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
  steps: SagaStep[];
}

export interface CreateSagaDto {
  sagaType: string;
  payload: any;
}
