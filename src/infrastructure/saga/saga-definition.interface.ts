import { ISagaStep } from './saga-step.interface';

/**
 * Interface que define uma Saga completa
 * Uma saga é uma sequência de passos que podem ser compensados
 */
export interface ISagaDefinition<TPayload = any> {
  /**
   * Nome da saga (deve ser único)
   */
  name: string;

  /**
   * Lista ordenada de passos da saga
   */
  steps: ISagaStep[];

  /**
   * Callback opcional executado quando a saga é completada com sucesso
   */
  onComplete?(payload: TPayload, results: any[]): Promise<void>;

  /**
   * Callback opcional executado quando a saga falha após compensação
   */
  onCompensated?(payload: TPayload, error: Error): Promise<void>;
}
