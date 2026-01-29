import { Injectable, Logger } from '@nestjs/common';
import { SagaRepository } from './saga.repository';
import { ISagaDefinition } from './saga-definition.interface';
import { SagaStatus, SagaStepStatus } from './saga.types';

/**
 * Saga Orchestrator - Orquestra a execução de sagas
 *
 * Responsabilidades:
 * 1. Executar os passos da saga em ordem
 * 2. Gerenciar o estado da saga
 * 3. Executar compensações em caso de falha
 * 4. Garantir consistência através de transações distribuídas
 *
 * Padrão Saga garante:
 * - Consistência eventual em transações distribuídas
 * - Rollback através de compensações
 * - Rastreabilidade de cada passo
 */
@Injectable()
export class SagaOrchestratorService {
  private readonly logger = new Logger(SagaOrchestratorService.name);
  private sagaDefinitions = new Map<string, ISagaDefinition>();

  constructor(private readonly sagaRepository: SagaRepository) {}

  /**
   * Registra uma definição de saga
   */
  registerSaga(saga: ISagaDefinition): void {
    this.sagaDefinitions.set(saga.name, saga);
    this.logger.log(`Saga registrada: ${saga.name} com ${saga.steps.length} passo(s)`);
  }

  /**
   * Inicia a execução de uma saga
   */
  async execute<T = any>(sagaName: string, payload: T): Promise<string> {
    const sagaDefinition = this.sagaDefinitions.get(sagaName);
    if (!sagaDefinition) {
      throw new Error(`Saga ${sagaName} não encontrada`);
    }

    this.logger.log(`Iniciando saga: ${sagaName}`);

    // Cria instância da saga no banco
    const sagaInstance = await this.sagaRepository.create({
      sagaType: sagaName,
      payload,
    });

    // Cria os passos no banco
    for (let i = 0; i < sagaDefinition.steps.length; i++) {
      await this.sagaRepository.addStep(
        sagaInstance.id,
        sagaDefinition.steps[i].name,
        i,
      );
    }

    // Executa a saga de forma assíncrona
    this.executeSaga(sagaInstance.id, sagaDefinition, payload).catch((error) => {
      this.logger.error(`Erro ao executar saga ${sagaInstance.id}:`, error);
    });

    return sagaInstance.id;
  }

  /**
   * Executa os passos da saga sequencialmente
   */
  private async executeSaga<T = any>(
    sagaId: string,
    definition: ISagaDefinition<T>,
    payload: T,
  ): Promise<void> {
    const results: any[] = [];
    let currentStepIndex = 0;

    try {
      // Executa cada passo em ordem
      for (let i = 0; i < definition.steps.length; i++) {
        currentStepIndex = i;
        const step = definition.steps[i];

        this.logger.log(`Executando passo ${i + 1}/${definition.steps.length}: ${step.name}`);

        // Busca o passo no banco
        const sagaInstance = await this.sagaRepository.findById(sagaId);
        const stepRecord = sagaInstance!.steps[i];

        try {
          // Prepara input (usa resultado do passo anterior ou payload inicial)
          const input = i === 0 ? payload : results[i - 1];

          // Executa o passo
          const output = await step.invoke(input);
          results.push(output);

          // Atualiza status do passo
          await this.sagaRepository.updateStepStatus(
            stepRecord.id,
            SagaStepStatus.COMPLETED,
            output,
          );

          // Atualiza passo atual da saga
          await this.sagaRepository.updateSagaStatus(
            sagaId,
            SagaStatus.STARTED,
            i + 1,
          );

          this.logger.log(`Passo ${step.name} completado com sucesso`);
        } catch (error) {
          this.logger.error(`Erro no passo ${step.name}:`, error);

          // Marca passo como falho
          await this.sagaRepository.updateStepStatus(
            stepRecord.id,
            SagaStepStatus.FAILED,
            undefined,
            error.message,
          );

          throw error;
        }
      }

      // Saga completada com sucesso
      await this.sagaRepository.updateSagaStatus(
        sagaId,
        SagaStatus.COMPLETED,
        definition.steps.length,
      );

      this.logger.log(`Saga ${sagaId} completada com sucesso`);

      // Callback de sucesso
      if (definition.onComplete) {
        await definition.onComplete(payload, results);
      }
    } catch (error) {
      // Saga falhou, inicia compensação
      this.logger.warn(`Saga ${sagaId} falhou, iniciando compensação...`);

      await this.sagaRepository.updateSagaStatus(
        sagaId,
        SagaStatus.COMPENSATING,
        currentStepIndex,
        error.message,
      );

      await this.compensate(sagaId, definition, payload, results, currentStepIndex);
    }
  }

  /**
   * Executa compensações dos passos já executados
   * Compensações são executadas na ordem reversa
   */
  private async compensate<T = any>(
    sagaId: string,
    definition: ISagaDefinition<T>,
    payload: T,
    results: any[],
    failedStepIndex: number,
  ): Promise<void> {
    this.logger.log(`Iniciando compensação da saga ${sagaId}`);

    // Compensa passos em ordem reversa (do último executado até o primeiro)
    for (let i = failedStepIndex - 1; i >= 0; i--) {
      const step = definition.steps[i];

      this.logger.log(`Compensando passo ${i + 1}: ${step.name}`);

      const sagaInstance = await this.sagaRepository.findById(sagaId);
      const stepRecord = sagaInstance!.steps[i];

      try {
        const input = i === 0 ? payload : results[i - 1];
        const output = results[i];

        await step.compensate(input, output);

        // Marca passo como compensado
        await this.sagaRepository.updateStepStatus(
          stepRecord.id,
          SagaStepStatus.COMPENSATED,
        );

        this.logger.log(`Passo ${step.name} compensado com sucesso`);
      } catch (error) {
        this.logger.error(`Erro ao compensar passo ${step.name}:`, error);
        // Continua compensando outros passos mesmo em caso de erro
      }
    }

    // Marca saga como compensada
    await this.sagaRepository.updateSagaStatus(
      sagaId,
      SagaStatus.COMPENSATED,
      0,
    );

    this.logger.log(`Saga ${sagaId} compensada`);

    // Callback de compensação
    if (definition.onCompensated) {
      await definition.onCompensated(payload, new Error('Saga failed and compensated'));
    }
  }

  /**
   * Obtém o status de uma saga
   */
  async getSagaStatus(sagaId: string) {
    return await this.sagaRepository.findById(sagaId);
  }
}
