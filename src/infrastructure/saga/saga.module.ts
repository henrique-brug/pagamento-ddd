import { Module } from '@nestjs/common';
import { PrismaModule } from '../persistence/prisma/prisma.module';
import { SagaRepository } from './saga.repository';
import { SagaOrchestratorService } from './saga-orchestrator.service';

/**
 * Módulo Saga
 *
 * Fornece infraestrutura para o padrão Saga:
 * - SagaRepository: Gerencia instâncias de sagas no banco
 * - SagaOrchestratorService: Orquestra execução de sagas
 *
 * Exporta serviços para uso em outros módulos
 */
@Module({
  imports: [PrismaModule],
  providers: [SagaRepository, SagaOrchestratorService],
  exports: [SagaRepository, SagaOrchestratorService],
})
export class SagaModule {}
