import { Injectable } from '@nestjs/common';
import Assinatura from '../../../../domain/assinatura/entity/assinatura';
import { AssinaturaRepository } from '../../../../domain/assinatura/repository/assinatura.repository';
import PeriodoVigencia from '../../../../domain/assinatura/value-object/periodo-vigencia';
import { StatusAssinatura } from '../../../../domain/assinatura/value-object/status-assinatura';
import { PrismaService } from '../prisma.service';

@Injectable()
export class PrismaAssinaturaRepository implements AssinaturaRepository {
  constructor(private readonly prisma: PrismaService) {}

  async salvar(assinatura: Assinatura): Promise<void> {
    await this.prisma.assinatura.upsert({
      where: { id: assinatura.assinaturaId },
      create: {
        id: assinatura.assinaturaId,
        usuarioId: assinatura.usuarioId,
        planoId: assinatura.planoId,
        status: assinatura.status,
        tipoVigencia: assinatura.periodoVigencia.tipo,
        inicioVigencia: assinatura.periodoVigencia.inicio,
        proximaCobranca: assinatura.periodoVigencia.proximaCobranca,
      },
      update: {
        usuarioId: assinatura.usuarioId,
        planoId: assinatura.planoId,
        status: assinatura.status,
        tipoVigencia: assinatura.periodoVigencia.tipo,
        inicioVigencia: assinatura.periodoVigencia.inicio,
        proximaCobranca: assinatura.periodoVigencia.proximaCobranca,
      },
    });
  }

  async buscarPorId(id: string): Promise<Assinatura | null> {
    const assinaturaData = await this.prisma.assinatura.findUnique({
      where: { id },
    });

    if (!assinaturaData) {
      return null;
    }

    return this.toDomain(assinaturaData);
  }

  async buscarPorUsuarioId(usuarioId: string): Promise<Assinatura[]> {
    const assinaturasData = await this.prisma.assinatura.findMany({
      where: { usuarioId },
    });

    return assinaturasData.map((data) => this.toDomain(data));
  }

  private toDomain(data: any): Assinatura {
    const periodoVigencia = new PeriodoVigencia(
      data.tipoVigencia as 'MENSAL' | 'ANUAL',
      new Date(data.inicioVigencia),
      new Date(data.proximaCobranca),
    );

    return new Assinatura(
      data.id,
      data.usuarioId,
      data.planoId,
      data.status as StatusAssinatura,
      periodoVigencia,
    );
  }
}
