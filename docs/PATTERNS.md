# Padrões de Arquitetura Implementados

Este documento explica os padrões **Outbox** e **Saga** implementados neste projeto.

## 📦 Outbox Pattern

### O que é?

O **Outbox Pattern** é um padrão de design que garante a entrega confiável de eventos em sistemas distribuídos. Ele resolve o problema de garantir que eventos sejam publicados atomicamente com as mudanças de dados.

### Como funciona?

1. **Escrita Atômica**: Quando salvamos dados no banco, também salvamos o evento na tabela `outbox_events` **na mesma transação**
2. **Processamento Assíncrono**: Um job separado lê eventos pendentes da tabela outbox e os publica
3. **Garantia de Entrega**: Se algo falhar, o evento fica na tabela para retry

### Fluxo do Outbox

```
┌─────────────────┐
│ Use Case        │
│ (CriarAssinatura)│
└────────┬────────┘
         │
         ▼
┌────────────────────────────────┐
│ Transação do Banco             │
│  1. Salvar Assinatura          │
│  2. Salvar Evento no Outbox    │◄─── Atomicidade garantida
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Tabela outbox_events           │
│  - evento pendente (PENDING)   │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ OutboxProcessor (a cada 10s)   │
│  - Busca eventos pendentes     │
│  - Publica para handlers       │
│  - Marca como PROCESSED        │
└────────┬───────────────────────┘
         │
         ▼
┌────────────────────────────────┐
│ Event Handlers                 │
│  - AssinaturaCriadaHandler     │
│  - Envia email, notificações...│
└────────────────────────────────┘
```

### Vantagens

- ✅ **Consistência**: Evento é salvo na mesma transação dos dados
- ✅ **Confiabilidade**: Se o sistema cair, eventos não são perdidos
- ✅ **Retry Automático**: Eventos falhos são reprocessados
- ✅ **Rastreabilidade**: Todo evento tem histórico no banco

### Exemplo de Código

```typescript
// No repository (prisma-assinatura.repository.ts)
await this.prisma.$transaction(async (prismaClient) => {
  // 1. Salva a assinatura
  await prismaClient.assinatura.create({ data: dados });

  // 2. Salva o evento no outbox (mesma transação)
  await this.outboxRepository.addEvent({
    aggregateId: assinatura.assinaturaId,
    aggregateType: 'Assinatura',
    eventType: 'AssinaturaCriada',
    payload: { ... }
  }, prismaClient);
});
```

### Arquivos Implementados

- **Schema**: `prisma/schema.prisma` - Tabela `outbox_events`
- **Repository**: `src/infrastructure/outbox/outbox.repository.ts`
- **Processor**: `src/infrastructure/outbox/outbox-processor.service.ts`
- **Publisher**: `src/infrastructure/outbox/event-publisher.service.ts`
- **Handler Exemplo**: `src/application/event-handlers/assinatura-criada.handler.ts`

---

## 🔄 Saga Pattern

### O que é?

O **Saga Pattern** é um padrão para gerenciar transações distribuídas de longa duração. Ele divide uma transação grande em pequenos passos que podem ser compensados (rollback) em caso de falha.

### Como funciona?

1. **Passos Sequenciais**: A saga executa uma série de passos em ordem
2. **Compensação**: Cada passo tem uma compensação (operação reversa)
3. **Rollback Distribuído**: Se um passo falha, executa compensações na ordem reversa

### Tipos de Saga

**Saga Orquestrada** (implementada aqui):
- Um orquestrador central controla todos os passos
- Mais fácil de rastrear e debugar
- Melhor para fluxos complexos

### Fluxo da Saga

```
┌──────────────────────────────────────────────────────────────┐
│ Saga: CriarAssinaturaSaga                                     │
└──────────────────────────────────────────────────────────────┘

┌─────────────────┐
│ 1. Validar Plano│ ✅ Sucesso
└────────┬────────┘
         │
         ▼
┌─────────────────────┐
│ 2. Criar Assinatura │ ✅ Sucesso
└────────┬────────────┘
         │
         ▼
┌──────────────────────────┐
│ 3. Processar Pagamento   │ ❌ Falhou!
└────────┬─────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ COMPENSAÇÃO (ordem reversa)                  │
│                                              │
│  2. ⬅️ Remover Assinatura (compensado)      │
│  1. ⬅️ Validar Plano (sem compensação)      │
└──────────────────────────────────────────────┘

Resultado: Saga compensada, tudo foi revertido!
```

### Exemplo de Saga: Criação de Assinatura

**Passos**:
1. **Validar Plano** - Verifica se plano existe
2. **Criar Assinatura** - Cria registro no banco
3. **Processar Pagamento** - Cobra no gateway
4. **Enviar Notificação** - Envia email de boas-vindas

**Compensações** (se algo falhar):
1. ~~Validar Plano~~ - Sem compensação (read-only)
2. **Remover Assinatura** - Deleta do banco
3. **Estornar Pagamento** - Reembolsa no gateway
4. **Enviar Email Cancelamento** - Notifica o usuário

### Vantagens

- ✅ **Transações Distribuídas**: Coordena operações em múltiplos sistemas
- ✅ **Rollback Automático**: Desfaz operações se algo falhar
- ✅ **Rastreabilidade**: Cada passo é registrado no banco
- ✅ **Resiliente**: Sistema pode recuperar de falhas

### Quando Usar Saga?

- Processos que envolvem múltiplos sistemas (pagamento, email, etc)
- Operações de longa duração
- Quando precisa de rollback distribuído
- Processos críticos de negócio

### Exemplo de Código

```typescript
// Definição de um passo
@Injectable()
export class ProcessarPagamentoStep implements ISagaStep {
  name = 'ProcessarPagamento';

  async invoke(input: any): Promise<any> {
    // Processa pagamento
    const resultado = await this.paymentGateway.charge(input);
    return resultado;
  }

  async compensate(input: any, output: any): Promise<void> {
    // Estorna pagamento em caso de falha posterior
    await this.paymentGateway.refund(output.transacaoId);
  }
}

// Executar a saga
const sagaId = await orchestrator.execute('CriarAssinaturaSaga', {
  usuarioId: 'user-123',
  planoId: 'plano-premium',
  tipoVigencia: 'MENSAL',
  metodoPagamento: 'cartao'
});
```

### Arquivos Implementados

**Infraestrutura**:
- **Schema**: `prisma/schema.prisma` - Tabelas `saga_instances` e `saga_steps`
- **Repository**: `src/infrastructure/saga/saga.repository.ts`
- **Orchestrator**: `src/infrastructure/saga/saga-orchestrator.service.ts`

**Saga Exemplo**:
- **Definição**: `src/application/sagas/criar-assinatura/criar-assinatura.saga.ts`
- **Passos**:
  - `steps/validar-plano.step.ts`
  - `steps/criar-assinatura.step.ts`
  - `steps/processar-pagamento.step.ts`
  - `steps/enviar-notificacao.step.ts`

---

## 🧪 Como Testar

### Testando Outbox Pattern

1. Rode as migrations do Prisma:
```bash
npx prisma migrate dev --name add-outbox-saga-tables
npx prisma generate
```

2. Inicie a aplicação:
```bash
npm run start:dev
```

3. Crie uma assinatura:
```bash
curl -X POST http://localhost:3000/assinatura \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "user-123",
    "planoId": "plano-basico",
    "tipoVigencia": "MENSAL"
  }'
```

4. Observe os logs do `OutboxProcessor` processando o evento

### Testando Saga Pattern

1. Inicie uma saga (sucesso):
```bash
curl -X POST http://localhost:3000/saga/criar-assinatura \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "user-123",
    "planoId": "plano-premium",
    "tipoVigencia": "MENSAL",
    "metodoPagamento": "cartao"
  }'
```

2. Consulte o status:
```bash
curl http://localhost:3000/saga/{saga-id}/status
```

3. Force uma falha (plano inexistente):
```bash
curl -X POST http://localhost:3000/saga/criar-assinatura \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "user-123",
    "planoId": "plano-inexistente",
    "tipoVigencia": "MENSAL",
    "metodoPagamento": "cartao"
  }'
```

4. Observe as compensações sendo executadas nos logs

---

## 📚 Recursos Adicionais

### Artigos Recomendados

- [Outbox Pattern - Microsoft](https://docs.microsoft.com/en-us/azure/architecture/patterns/outbox)
- [Saga Pattern - Chris Richardson](https://microservices.io/patterns/data/saga.html)
- [Implementing the Outbox Pattern](https://debezium.io/blog/2019/02/19/reliable-microservices-data-exchange-with-the-outbox-pattern/)

### Quando NÃO usar esses padrões

**Outbox**:
- ❌ Sistema simples com poucos eventos
- ❌ Eventos não críticos (podem ser perdidos)
- ❌ Sistema monolítico sem necessidade de mensageria

**Saga**:
- ❌ Operações simples em um único serviço
- ❌ Transações que cabem em uma transação de banco normal
- ❌ Quando não precisa de rollback

### Trade-offs

**Outbox**:
- ➕ Confiabilidade
- ➖ Complexidade adicional
- ➖ Latência (processamento assíncrono)

**Saga**:
- ➕ Transações distribuídas
- ➖ Complexidade alta
- ➖ Eventual consistency (não imediato)
- ➖ Difícil de debugar

---

## 🎯 Conclusão

Você implementou dois padrões essenciais para sistemas distribuídos:

1. **Outbox** garante que eventos sejam publicados de forma confiável
2. **Saga** coordena transações distribuídas com compensações

Esses padrões são fundamentais em arquiteturas de microserviços e sistemas DDD complexos!
