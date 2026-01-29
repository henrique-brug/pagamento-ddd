import { Injectable } from '@nestjs/common';
import { SagaOrchestratorService } from '../../../infrastructure/saga/saga-orchestrator.service';
import { CriarAssinaturaSagaPayload } from '../../sagas/criar-assinatura/criar-assinatura-saga.types';

/**
 * Use Case para iniciar a Saga de Criação de Assinatura
 */
@Injectable()
export class CriarAssinaturaSagaUseCase {
  constructor(private readonly orchestrator: SagaOrchestratorService) {}

  async execute(input: CriarAssinaturaSagaPayload): Promise<{ sagaId: string }> {
    const sagaId = await this.orchestrator.execute(
      'CriarAssinaturaSaga',
      input,
    );

    return { sagaId };
  }

  async getStatus(sagaId: string) {
    return await this.orchestrator.getSagaStatus(sagaId);
  }
}
