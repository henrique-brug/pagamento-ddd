/**
 * Tipos para a Saga de Criação de Assinatura
 */

export interface CriarAssinaturaSagaPayload {
  usuarioId: string;
  planoId: string;
  tipoVigencia: 'MENSAL' | 'ANUAL';
  metodoPagamento: string;
}

export interface ValidarPlanoOutput {
  planoValido: boolean;
  planoNome: string;
  planoValor: number;
}

export interface CriarAssinaturaOutput {
  assinaturaId: string;
  status: string;
}

export interface ProcessarPagamentoOutput {
  pagamentoId: string;
  status: 'APROVADO' | 'RECUSADO' | 'PENDENTE';
  transacaoId: string;
}

export interface EnviarNotificacaoOutput {
  notificacaoId: string;
  enviado: boolean;
}
