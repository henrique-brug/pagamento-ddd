import { Module, OnModuleInit } from '@nestjs/common';
import { SagaModule } from '../../../infrastructure/saga/saga.module';
import { SagaOrchestratorService } from '../../../infrastructure/saga/saga-orchestrator.service';
import { CriarAssinaturaSaga } from './criar-assinatura.saga';
import { ValidarPlanoStep } from './steps/validar-plano.step';
import { CriarAssinaturaStep } from './steps/criar-assinatura.step';
import { ProcessarPagamentoStep } from './steps/processar-pagamento.step';
import { EnviarNotificacaoStep } from './steps/enviar-notificacao.step';

/**
 * Módulo da Saga de Criação de Assinatura
 *
 * Registra a saga e seus passos no orchestrator
 */
@Module({
  imports: [SagaModule],
  providers: [
    CriarAssinaturaSaga,
    ValidarPlanoStep,
    CriarAssinaturaStep,
    ProcessarPagamentoStep,
    EnviarNotificacaoStep,
  ],
  exports: [CriarAssinaturaSaga],
})
export class CriarAssinaturaSagaModule implements OnModuleInit {
  constructor(
    private readonly orchestrator: SagaOrchestratorService,
    private readonly criarAssinaturaSaga: CriarAssinaturaSaga,
  ) {}

  onModuleInit() {
    // Registra a saga quando o módulo inicializa
    this.orchestrator.registerSaga(this.criarAssinaturaSaga);
  }
}
