import { Injectable } from '@nestjs/common';
import Assinatura from '../../../../domain/assinatura/entity/assinatura';
import { AssinaturaRepository } from '../../../../domain/assinatura/repository/assinatura.repository';
import PeriodoVigencia from '../../../../domain/assinatura/value-object/periodo-vigencia';
import { StatusAssinatura } from '../../../../domain/assinatura/value-object/status-assinatura';
import { PrismaService } from '../prisma.service';
import { OutboxRepository } from '../../../outbox/outbox.repository';

@Injectable()
export class PrismaAssinaturaRepository implements AssinaturaRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  /**
   * Salva a assinatura usando o padrão Outbox
   * Garante que o evento AssinaturaCriada seja salvo atomicamente
   * na mesma transação da assinatura
   */
  async salvar(assinatura: Assinatura): Promise<void> {
    const dados = {
      id: assinatura.assinaturaId,
      usuarioId: assinatura.usuarioId,
      planoId: assinatura.planoId,
      status: String(assinatura.status),
      tipoVigencia: assinatura.periodoVigencia.tipo,
      inicioVigencia: new Date(assinatura.periodoVigencia.inicio),
      proximaCobranca: new Date(assinatura.periodoVigencia.proximaCobranca),
    };

    console.log('Dados que serão salvos:', JSON.stringify(dados, null, 2));

    try {
      // Usa transação para garantir atomicidade entre assinatura e evento
      await this.prisma.$transaction(async (prismaClient) => {
        // 1. Salva a assinatura
        await prismaClient.assinatura.create({
          data: dados,
        });

        // 2. Salva o evento no outbox (mesma transação)
        await this.outboxRepository.addEvent(
          {
            aggregateId: assinatura.assinaturaId,
            aggregateType: 'Assinatura',
            eventType: 'AssinaturaCriada',
            payload: {
              assinaturaId: assinatura.assinaturaId,
              usuarioId: assinatura.usuarioId,
              planoId: assinatura.planoId,
              status: assinatura.status,
              tipoVigencia: assinatura.periodoVigencia.tipo,
              inicioVigencia: assinatura.periodoVigencia.inicio,
              proximaCobranca: assinatura.periodoVigencia.proximaCobranca,
            },
          },
          prismaClient,
        );
      });

      console.log('Assinatura e evento salvos com sucesso (Outbox Pattern)!');
    } catch (error) {
      console.error('Erro completo ao salvar assinatura:', error);
      throw error;
    }
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
