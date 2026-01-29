import { Body, Controller, Post } from '@nestjs/common';
import { CriarAssinaturaUseCase } from '../../../application/use-cases/criar-assinatura/criar-assinatura.use-case';
import type { CriarAssinaturaInput } from '../../../application/use-cases/criar-assinatura/criar-assinatura.dto';

@Controller('assinaturas')
export class AssinaturaController {
  constructor(
    private readonly criarAssinaturaUseCase: CriarAssinaturaUseCase,
  ) {}

  @Post()
  async criar(@Body() input: CriarAssinaturaInput) {
    return await this.criarAssinaturaUseCase.execute(input);
  }
}
