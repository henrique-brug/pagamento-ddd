import Assinatura from "../entity/assinatura";
import PeriodoVigencia from "../value-object/periodo-vigencia";
import { StatusAssinatura } from "../value-object/status-assinatura";

export default class AssinaturaFactory {
    public static create(assinaturaId: string, usuarioId: string, planoId: string, status: StatusAssinatura, periodoVigencia: PeriodoVigencia): Assinatura {
        return new Assinatura(assinaturaId, usuarioId, planoId, status, periodoVigencia);
    }
}