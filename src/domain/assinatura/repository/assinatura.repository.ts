import Assinatura from "../entity/assinatura";

export interface AssinaturaRepository {
    salvar(assinatura: Assinatura): Promise<void>;
    buscarPorId(id: string): Promise<Assinatura | null>;
    buscarPorUsuarioId(usuarioId: string): Promise<Assinatura[]>;
}
