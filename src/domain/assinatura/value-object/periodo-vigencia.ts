export default class PeriodoVigencia {
    _tipo: 'MENSAL' | 'ANUAL';
    _inicio: Date;
    _proximaCobranca: Date;

    constructor(tipo: 'MENSAL' | 'ANUAL', inicio: Date, proximaCobranca: Date) {
        this._tipo = tipo;
        this._inicio = inicio;
        this._proximaCobranca = proximaCobranca;

        this.validar();
    }

    get tipo(): 'MENSAL' | 'ANUAL' {
        return this._tipo;
    }

    get inicio(): Date {
        return this._inicio;
    }

    get proximaCobranca(): Date {
        return this._proximaCobranca;
    }

    validar(): void {
        if (this._inicio > this._proximaCobranca) {
            throw new Error(
                'O início da vigência não pode ser maior que a próxima cobrança.'
            );
        }
    }
}