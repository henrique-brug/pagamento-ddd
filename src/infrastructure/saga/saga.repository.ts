import { Injectable } from '@nestjs/common';
import { PrismaService } from '../persistence/prisma/prisma.service';
import {
  CreateSagaDto,
  SagaInstance,
  SagaStatus,
  SagaStepStatus,
} from './saga.types';
import { randomUUID } from 'crypto';

@Injectable()
export class SagaRepository {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Cria uma nova instância de saga
   */
  async create(dto: CreateSagaDto): Promise<SagaInstance> {
    const sagaInstance = await this.prisma.sagaInstance.create({
      data: {
        id: randomUUID(),
        sagaType: dto.sagaType,
        status: SagaStatus.STARTED,
        currentStep: 0,
        payload: JSON.stringify(dto.payload),
      },
      include: {
        steps: true,
      },
    });

    return this.toDomain(sagaInstance);
  }

  /**
   * Busca uma instância de saga por ID
   */
  async findById(sagaId: string): Promise<SagaInstance | null> {
    const sagaInstance = await this.prisma.sagaInstance.findUnique({
      where: { id: sagaId },
      include: {
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
      },
    });

    if (!sagaInstance) {
      return null;
    }

    return this.toDomain(sagaInstance);
  }

  /**
   * Adiciona um passo à saga
   */
  async addStep(
    sagaId: string,
    stepName: string,
    stepOrder: number,
    input?: any,
  ): Promise<void> {
    await this.prisma.sagaStep.create({
      data: {
        id: randomUUID(),
        sagaId,
        stepName,
        stepOrder,
        status: SagaStepStatus.PENDING,
        input: input ? JSON.stringify(input) : null,
      },
    });
  }

  /**
   * Atualiza o status de um passo
   */
  async updateStepStatus(
    stepId: string,
    status: SagaStepStatus,
    output?: any,
    error?: string,
  ): Promise<void> {
    await this.prisma.sagaStep.update({
      where: { id: stepId },
      data: {
        status,
        output: output ? JSON.stringify(output) : undefined,
        error,
      },
    });
  }

  /**
   * Atualiza o status da saga e o passo atual
   */
  async updateSagaStatus(
    sagaId: string,
    status: SagaStatus,
    currentStep: number,
    error?: string,
  ): Promise<void> {
    const updateData: any = {
      status,
      currentStep,
      error,
    };

    if (status === SagaStatus.COMPLETED || status === SagaStatus.COMPENSATED) {
      updateData.completedAt = new Date();
    }

    await this.prisma.sagaInstance.update({
      where: { id: sagaId },
      data: updateData,
    });
  }

  /**
   * Busca sagas em progresso
   */
  async findInProgress(): Promise<SagaInstance[]> {
    const sagas = await this.prisma.sagaInstance.findMany({
      where: {
        status: {
          in: [SagaStatus.STARTED, SagaStatus.COMPENSATING],
        },
      },
      include: {
        steps: {
          orderBy: {
            stepOrder: 'asc',
          },
        },
      },
    });

    return sagas.map((saga) => this.toDomain(saga));
  }

  private toDomain(data: any): SagaInstance {
    return {
      id: data.id,
      sagaType: data.sagaType,
      status: data.status as SagaStatus,
      currentStep: data.currentStep,
      payload: data.payload,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      completedAt: data.completedAt,
      error: data.error,
      steps: data.steps?.map((step: any) => ({
        id: step.id,
        sagaId: step.sagaId,
        stepName: step.stepName,
        stepOrder: step.stepOrder,
        status: step.status as SagaStepStatus,
        input: step.input,
        output: step.output,
        error: step.error,
        createdAt: step.createdAt,
        updatedAt: step.updatedAt,
      })) || [],
    };
  }
}
