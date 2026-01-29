import { Injectable, Logger } from '@nestjs/common';
import { ISagaDefinition } from '../../../infrastructure/saga/saga-definition.interface';
import { CriarAssinaturaSagaPayload } from './criar-assinatura-saga.types';
import { ValidarPlanoStep } from './steps/validar-plano.step';
import { CriarAssinaturaStep } from './steps/criar-assinatura.step';
import { ProcessarPagamentoStep } from './steps/processar-pagamento.step';
import { EnviarNotificacaoStep } from './steps/enviar-notificacao.step';

/**
 * Saga de Criação de Assinatura
 *
 * Orquestra o processo completo de criação de assinatura:
 * 1. Validar Plano
 * 2. Criar Assinatura
 * 3. Processar Pagamento
 * 4. Enviar Notificação
 *
 * Em caso de falha em qualquer passo, executa compensações na ordem reversa
 *
 * Exemplo de cenário:
 * - Se o pagamento falhar, a assinatura criada será removida
 * - Se a notificação falhar após pagamento, o pagamento será estornado e a assinatura removida
 */
@Injectable()
export class CriarAssinaturaSaga
  implements ISagaDefinition<CriarAssinaturaSagaPayload>
{
  name = 'CriarAssinaturaSaga';
  private readonly logger = new Logger(CriarAssinaturaSaga.name);
  steps: any[];

  constructor(
    private readonly validarPlanoStep: ValidarPlanoStep,
    private readonly criarAssinaturaStep: CriarAssinaturaStep,
    private readonly processarPagamentoStep: ProcessarPagamentoStep,
    private readonly enviarNotificacaoStep: EnviarNotificacaoStep,
  ) {
    this.steps = [
      this.validarPlanoStep,
      this.criarAssinaturaStep,
      this.processarPagamentoStep,
      this.enviarNotificacaoStep,
    ];
  }

  async onComplete(
    payload: CriarAssinaturaSagaPayload,
    results: any[],
  ): Promise<void> {
    this.logger.log('🎉 Saga de criação de assinatura completada com sucesso!');
    this.logger.log(`Usuário: ${payload.usuarioId}`);
    this.logger.log(`Plano: ${payload.planoId}`);
    this.logger.log(`Assinatura ID: ${results[1]?.assinaturaId}`);
    this.logger.log(`Pagamento ID: ${results[2]?.pagamentoId}`);
    this.logger.log(`Notificação ID: ${results[3]?.notificacaoId}`);
  }

  async onCompensated(
    payload: CriarAssinaturaSagaPayload,
    error: Error,
  ): Promise<void> {
    this.logger.error('❌ Saga de criação de assinatura falhou e foi compensada');
    this.logger.error(`Usuário: ${payload.usuarioId}`);
    this.logger.error(`Erro: ${error.message}`);
    this.logger.log('Todas as operações foram revertidas com sucesso');
  }
}
