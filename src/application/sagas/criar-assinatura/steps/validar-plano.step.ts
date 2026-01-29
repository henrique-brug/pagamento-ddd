import { Injectable, Logger } from '@nestjs/common';
import { ISagaStep } from '../../../../infrastructure/saga/saga-step.interface';
import {
  CriarAssinaturaSagaPayload,
  ValidarPlanoOutput,
} from '../criar-assinatura-saga.types';

/**
 * Passo 1: Validar Plano
 *
 * Valida se o plano existe e está disponível para assinatura
 * Compensação: Nenhuma (apenas leitura)
 */
@Injectable()
export class ValidarPlanoStep
  implements ISagaStep<CriarAssinaturaSagaPayload, ValidarPlanoOutput>
{
  name = 'ValidarPlano';
  private readonly logger = new Logger(ValidarPlanoStep.name);

  async invoke(input: CriarAssinaturaSagaPayload): Promise<ValidarPlanoOutput> {
    this.logger.log(`Validando plano ${input.planoId} para usuário ${input.usuarioId}`);

    // Simula validação do plano (em produção, consultaria banco/serviço)
    await this.sleep(500);

    // Simula que alguns planos não existem
    if (input.planoId === 'plano-inexistente') {
      throw new Error('Plano não encontrado');
    }

    const planos = {
      'plano-basico': { nome: 'Básico', valor: 29.90 },
      'plano-premium': { nome: 'Premium', valor: 59.90 },
      'plano-enterprise': { nome: 'Enterprise', valor: 99.90 },
    };

    const plano = planos[input.planoId] || planos['plano-basico'];

    this.logger.log(`Plano ${plano.nome} validado com sucesso`);

    return {
      planoValido: true,
      planoNome: plano.nome,
      planoValor: plano.valor,
    };
  }

  async compensate(
    input: CriarAssinaturaSagaPayload,
    output?: ValidarPlanoOutput,
  ): Promise<void> {
    // Validação é apenas leitura, não precisa compensar
    this.logger.log('ValidarPlano não requer compensação (read-only)');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
