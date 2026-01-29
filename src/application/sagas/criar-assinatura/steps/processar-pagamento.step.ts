import { Injectable, Logger } from '@nestjs/common';
import { ISagaStep } from '../../../../infrastructure/saga/saga-step.interface';
import {
  CriarAssinaturaOutput,
  ProcessarPagamentoOutput,
} from '../criar-assinatura-saga.types';
import { randomUUID } from 'crypto';

/**
 * Passo 3: Processar Pagamento
 *
 * Processa o pagamento da assinatura com gateway de pagamento
 * Compensação: Estorna o pagamento
 */
@Injectable()
export class ProcessarPagamentoStep
  implements ISagaStep<CriarAssinaturaOutput, ProcessarPagamentoOutput>
{
  name = 'ProcessarPagamento';
  private readonly logger = new Logger(ProcessarPagamentoStep.name);

  // Armazena pagamentos para compensação
  private processedPayments = new Map<string, ProcessarPagamentoOutput>();

  async invoke(input: CriarAssinaturaOutput): Promise<ProcessarPagamentoOutput> {
    this.logger.log(
      `Processando pagamento para assinatura ${input.assinaturaId}...`,
    );

    // Simula processamento do pagamento
    await this.sleep(1000);

    const pagamentoId = randomUUID();
    const transacaoId = `TXN-${Date.now()}`;

    // Simula aprovação aleatória (90% de chance de aprovar)
    const aprovado = Math.random() > 0.1;

    if (!aprovado) {
      throw new Error('Pagamento recusado pelo gateway');
    }

    const result: ProcessarPagamentoOutput = {
      pagamentoId,
      status: 'APROVADO',
      transacaoId,
    };

    // Armazena para compensação
    this.processedPayments.set(pagamentoId, result);

    this.logger.log(
      `Pagamento ${pagamentoId} aprovado (transação: ${transacaoId})`,
    );

    return result;
  }

  async compensate(
    input: CriarAssinaturaOutput,
    output?: ProcessarPagamentoOutput,
  ): Promise<void> {
    if (!output) {
      this.logger.warn('Nenhum pagamento para compensar');
      return;
    }

    this.logger.log(
      `Compensando: estornando pagamento ${output.pagamentoId}...`,
    );

    // Simula estorno do pagamento
    await this.sleep(800);

    // Em produção, aqui seria a chamada real ao gateway de pagamento
    // await this.paymentGateway.refund(output.transacaoId)

    this.processedPayments.delete(output.pagamentoId);

    this.logger.log(
      `Pagamento ${output.pagamentoId} estornado (compensado)`,
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
