import { Injectable, Logger } from '@nestjs/common';
import { ISagaStep } from '../../../../infrastructure/saga/saga-step.interface';
import {
  ProcessarPagamentoOutput,
  EnviarNotificacaoOutput,
} from '../criar-assinatura-saga.types';
import { randomUUID } from 'crypto';

/**
 * Passo 4: Enviar Notificação
 *
 * Envia notificação de boas-vindas ao usuário
 * Compensação: Envia notificação de cancelamento
 */
@Injectable()
export class EnviarNotificacaoStep
  implements ISagaStep<ProcessarPagamentoOutput, EnviarNotificacaoOutput>
{
  name = 'EnviarNotificacao';
  private readonly logger = new Logger(EnviarNotificacaoStep.name);

  async invoke(
    input: ProcessarPagamentoOutput,
  ): Promise<EnviarNotificacaoOutput> {
    this.logger.log('Enviando notificação de boas-vindas...');

    // Simula envio de notificação
    await this.sleep(500);

    const notificacaoId = randomUUID();

    // Em produção, aqui seria a chamada real ao serviço de notificações
    // await this.notificationService.send(...)

    this.logger.log(
      `Notificação ${notificacaoId} enviada com sucesso`,
    );

    return {
      notificacaoId,
      enviado: true,
    };
  }

  async compensate(
    input: ProcessarPagamentoOutput,
    output?: EnviarNotificacaoOutput,
  ): Promise<void> {
    this.logger.log('Compensando: enviando notificação de cancelamento...');

    // Simula envio de notificação de cancelamento
    await this.sleep(500);

    // Em produção, aqui seria a chamada real ao serviço de notificações
    // await this.notificationService.sendCancellation(...)

    this.logger.log('Notificação de cancelamento enviada (compensado)');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
