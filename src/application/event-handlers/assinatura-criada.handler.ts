import { Injectable, Logger } from '@nestjs/common';
import { DomainEvent } from '../../domain/shared/event/domain-event.interface';
import { DomainEventHandler } from '../../domain/shared/event/domain-event-handler.interface';

/**
 * Handler para o evento AssinaturaCriada
 *
 * Este handler é chamado automaticamente quando uma assinatura é criada
 * através do Outbox Pattern
 *
 * Exemplos de ações que podem ser realizadas:
 * - Enviar email de boas-vindas
 * - Criar registro em sistema de analytics
 * - Notificar outros serviços (webhook)
 * - Atualizar cache
 */
@Injectable()
export class AssinaturaCriadaHandler implements DomainEventHandler {
  eventType = 'AssinaturaCriada';
  private readonly logger = new Logger(AssinaturaCriadaHandler.name);

  async handle(event: DomainEvent): Promise<void> {
    this.logger.log(`Processando evento AssinaturaCriada: ${event.eventId}`);

    const { assinaturaId, usuarioId, planoId, status } = event.payload;

    this.logger.log(`Nova assinatura criada:`);
    this.logger.log(`  - Assinatura ID: ${assinaturaId}`);
    this.logger.log(`  - Usuário ID: ${usuarioId}`);
    this.logger.log(`  - Plano ID: ${planoId}`);
    this.logger.log(`  - Status: ${status}`);

    // Simula processamento (em produção, aqui você faria ações reais)
    await this.sleep(100);

    // Exemplos de ações que poderiam ser realizadas:
    // await this.emailService.sendWelcomeEmail(usuarioId);
    // await this.analyticsService.track('subscription_created', { assinaturaId });
    // await this.webhookService.notify('subscription.created', event.payload);

    this.logger.log(`Evento AssinaturaCriada processado com sucesso`);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
