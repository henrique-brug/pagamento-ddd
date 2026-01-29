import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CriarAssinaturaSagaUseCase } from '../../../application/use-cases/criar-assinatura-saga/criar-assinatura-saga.use-case';
import type { CriarAssinaturaSagaPayload } from '../../../application/sagas/criar-assinatura/criar-assinatura-saga.types';

/**
 * Controller para demonstrar o uso de Sagas
 *
 * Endpoints:
 * - POST /saga/criar-assinatura: Inicia saga de criação
 * - GET /saga/:id/status: Consulta status da saga
 */
@Controller('saga')
export class SagaController {
  constructor(
    private readonly criarAssinaturaSagaUseCase: CriarAssinaturaSagaUseCase,
  ) {}

  @Post('criar-assinatura')
  async criarAssinatura(@Body() payload: CriarAssinaturaSagaPayload) {
    return await this.criarAssinaturaSagaUseCase.execute(payload);
  }

  @Get(':id/status')
  async getStatus(@Param('id') sagaId: string) {
    return await this.criarAssinaturaSagaUseCase.getStatus(sagaId);
  }
}
