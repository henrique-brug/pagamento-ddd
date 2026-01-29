export interface CriarAssinaturaInput {
  usuarioId: string;
  planoId: string;
  tipoVigencia: 'MENSAL' | 'ANUAL';
}

export interface CriarAssinaturaOutput {
  assinaturaId: string;
  usuarioId: string;
  planoId: string;
  status: string;
  inicioVigencia: Date;
  proximaCobranca: Date;
}
