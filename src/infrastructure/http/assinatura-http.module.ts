import { Module } from '@nestjs/common';
import { CriarAssinaturaModule } from '../../application/use-cases/criar-assinatura/criar-assinatura.module';
import { AssinaturaController } from './controllers/assinatura.controller';

@Module({
  imports: [CriarAssinaturaModule],
  controllers: [AssinaturaController],
})
export class AssinaturaHttpModule {}
