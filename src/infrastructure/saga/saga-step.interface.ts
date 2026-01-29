/**
 * Interface que representa um passo de uma Saga
 * Cada passo deve implementar:
 * - invoke: lógica de negócio do passo
 * - compensate: lógica de compensação (rollback) em caso de falha
 */
export interface ISagaStep<TInput = any, TOutput = any> {
  /**
   * Nome do passo (deve ser único dentro da saga)
   */
  name: string;

  /**
   * Executa a lógica de negócio do passo
   * @param input Dados de entrada do passo
   * @returns Dados de saída do passo
   */
  invoke(input: TInput): Promise<TOutput>;

  /**
   * Executa a lógica de compensação (rollback) do passo
   * Chamado quando um passo posterior falha
   * @param input Dados de entrada originais
   * @param output Dados de saída do invoke (se disponível)
   */
  compensate(input: TInput, output?: TOutput): Promise<void>;
}
