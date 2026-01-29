import PeriodoVigencia from "../value-object/periodo-vigencia";
import { StatusAssinatura } from "../value-object/status-assinatura";

export default class Assinatura {
    _assinaturaId: string;
    _usuarioId: string;
    _planoId: string;
    _status: StatusAssinatura;
    _periodoVigencia: PeriodoVigencia;

    constructor(assinaturaId: string, usuarioId: string, planoId: string, status: StatusAssinatura, periodoVigencia: PeriodoVigencia) {
        this._assinaturaId = assinaturaId;
        this._usuarioId = usuarioId;
        this._planoId = planoId;
        this._status = status;
        this._periodoVigencia = periodoVigencia;
    }

    validate(): void {
        if (!this._assinaturaId) {
            throw new Error('Assinatura ID é obrigatório');
        }
        if (!this._usuarioId) {
            throw new Error('Usuário ID é obrigatório');
        }
        if (!this._planoId) {
            throw new Error('Plano ID é obrigatório');
        }
        if (!this._status) {
            throw new Error('Status é obrigatório');
        }
        if (!this._periodoVigencia) {
            throw new Error('Período de vigência é obrigatório');
        }
    }

    cancelar(): void {
        this._status = StatusAssinatura.CANCELADA;
    }
    pausar(): void {
        this._status = StatusAssinatura.PAUSADA;
    }
    ativar(): void {
        this._status = StatusAssinatura.ATIVA;
    }
    pendente(): void {
        this._status = StatusAssinatura.PENDENTE;
    }

    renovar(): void {
        this._periodoVigencia = new PeriodoVigencia(this._periodoVigencia.tipo, new Date(), new Date(this._periodoVigencia.proximaCobranca.getTime() + this._periodoVigencia.tipo === 'MENSAL' ? 30 : 365));
    }

    get assinaturaId(): string {
        return this._assinaturaId;
    }

    get usuarioId(): string {
        return this._usuarioId;
    }

    get planoId(): string {
        return this._planoId;
    }

    get status(): StatusAssinatura {
        return this._status;
    }

    get periodoVigencia(): PeriodoVigencia {
        return this._periodoVigencia;
    }

    set status(status: StatusAssinatura) {
        this._status = status;
    }

    set periodoVigencia(periodoVigencia: PeriodoVigencia) {
        this._periodoVigencia = periodoVigencia;
    }
}