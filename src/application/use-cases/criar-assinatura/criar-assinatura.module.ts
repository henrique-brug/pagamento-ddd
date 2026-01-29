import { Module } from '@nestjs/common';
import { PrismaAssinaturaRepository } from '../../../infrastructure/persistence/prisma/repositories/prisma-assinatura.repository';
import { CriarAssinaturaUseCase } from './criar-assinatura.use-case';

@Module({
  providers: [
    CriarAssinaturaUseCase,
    {
      provide: 'AssinaturaRepository',
      useClass: PrismaAssinaturaRepository,
    },
  ],
  exports: [CriarAssinaturaUseCase],
})
export class CriarAssinaturaModule {}
