import { Injectable, Logger } from '@nestjs/common';
import { ISagaStep } from '../../../../infrastructure/saga/saga-step.interface';
import {
  CriarAssinaturaOutput,
  ValidarPlanoOutput,
} from '../criar-assinatura-saga.types';
import { randomUUID } from 'crypto';

/**
 * Passo 2: Criar Assinatura
 *
 * Cria a assinatura no banco de dados
 * Compensação: Remove a assinatura criada
 */
@Injectable()
export class CriarAssinaturaStep
  implements ISagaStep<ValidarPlanoOutput, CriarAssinaturaOutput>
{
  name = 'CriarAssinatura';
  private readonly logger = new Logger(CriarAssinaturaStep.name);

  // Armazena IDs criados para compensação
  private createdAssinaturas = new Map<string, string>();

  async invoke(input: ValidarPlanoOutput): Promise<CriarAssinaturaOutput> {
    this.logger.log('Criando assinatura no banco de dados...');

    // Simula criação da assinatura
    await this.sleep(500);

    const assinaturaId = randomUUID();

    // Em produção, aqui seria a chamada real ao repository
    // await this.assinaturaRepository.salvar(...)

    this.logger.log(`Assinatura ${assinaturaId} criada com sucesso`);

    // Armazena para compensação
    this.createdAssinaturas.set(assinaturaId, 'PENDENTE');

    return {
      assinaturaId,
      status: 'PENDENTE',
    };
  }

  async compensate(
    input: ValidarPlanoOutput,
    output?: CriarAssinaturaOutput,
  ): Promise<void> {
    if (!output) {
      this.logger.warn('Nenhuma assinatura para compensar');
      return;
    }

    this.logger.log(`Compensando: removendo assinatura ${output.assinaturaId}`);

    // Simula remoção da assinatura
    await this.sleep(300);

    // Em produção, aqui seria a chamada real ao repository
    // await this.assinaturaRepository.remover(output.assinaturaId)

    this.createdAssinaturas.delete(output.assinaturaId);

    this.logger.log(`Assinatura ${output.assinaturaId} removida (compensado)`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
