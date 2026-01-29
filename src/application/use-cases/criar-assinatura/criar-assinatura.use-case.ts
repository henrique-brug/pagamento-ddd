import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import Assinatura from '../../../domain/assinatura/entity/assinatura';
import AssinaturaFactory from '../../../domain/assinatura/factory/assinatura.factory';
import PeriodoVigencia from '../../../domain/assinatura/value-object/periodo-vigencia';
import { StatusAssinatura } from '../../../domain/assinatura/value-object/status-assinatura';
import {
  CriarAssinaturaInput,
  CriarAssinaturaOutput,
} from './criar-assinatura.dto';
import type { AssinaturaRepository } from 'src/domain/assinatura/repository/assinatura.repository';

@Injectable()
export class CriarAssinaturaUseCase {
  constructor(
    @Inject('AssinaturaRepository')
    private readonly assinaturaRepository: AssinaturaRepository,
  ) {}

  async execute(input: CriarAssinaturaInput): Promise<CriarAssinaturaOutput> {
    // Gerar ID único para a assinatura
    const assinaturaId = randomUUID();

    // Calcular período de vigência
    const inicio = new Date();
    const proximaCobranca = this.calcularProximaCobranca(
      inicio,
      input.tipoVigencia,
    );

    // Criar value object de período
    const periodoVigencia = new PeriodoVigencia(
      input.tipoVigencia,
      inicio,
      proximaCobranca,
    );

    // Criar assinatura usando a factory
    const assinatura: Assinatura = AssinaturaFactory.create(
      assinaturaId,
      input.usuarioId,
      input.planoId,
      StatusAssinatura.PENDENTE,
      periodoVigencia,
    );

    // Validar a assinatura
    assinatura.validate();

    // Persistir no repositório
    await this.assinaturaRepository.salvar(assinatura);

    // Retornar output
    return {
      assinaturaId: assinatura.assinaturaId,
      usuarioId: assinatura.usuarioId,
      planoId: assinatura.planoId,
      status: assinatura.status,
      inicioVigencia: assinatura.periodoVigencia.inicio,
      proximaCobranca: assinatura.periodoVigencia.proximaCobranca,
    };
  }

  private calcularProximaCobranca(
    inicio: Date,
    tipo: 'MENSAL' | 'ANUAL',
  ): Date {
    const proximaCobranca = new Date(inicio);

    if (tipo === 'MENSAL') {
      proximaCobranca.setMonth(proximaCobranca.getMonth() + 1);
    } else {
      proximaCobranca.setFullYear(proximaCobranca.getFullYear() + 1);
    }

    return proximaCobranca;
  }
}
