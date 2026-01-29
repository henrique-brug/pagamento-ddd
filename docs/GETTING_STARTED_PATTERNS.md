# Guia Rápido - Testando Outbox e Saga Patterns

## 🚀 Passos para Executar

### 1. Instalar dependências adicionais

```bash
npm install @nestjs/schedule
```

### 2. Executar migrations do Prisma

```bash
npx prisma migrate dev --name add-outbox-saga-tables
npx prisma generate
```

### 3. Iniciar a aplicação

```bash
npm run start:dev
```

---

## 📦 Testando Outbox Pattern

### Cenário: Criar assinatura com evento

**Request:**
```bash
curl -X POST http://localhost:3000/assinatura \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "user-123",
    "planoId": "plano-premium",
    "tipoVigencia": "MENSAL"
  }'
```

**O que acontece:**

1. ✅ Assinatura é salva no banco
2. ✅ Evento `AssinaturaCriada` é salvo na tabela `outbox_events` (mesma transação)
3. ⏱️ OutboxProcessor detecta evento pendente (a cada 10 segundos)
4. ✅ Evento é publicado para o `AssinaturaCriadaHandler`
5. ✅ Handler processa o evento (ex: enviar email)
6. ✅ Evento marcado como `PROCESSED` na tabela outbox

**Verificar no banco:**
```sql
-- Ver eventos no outbox
SELECT * FROM outbox_events ORDER BY created_at DESC;

-- Ver assinaturas criadas
SELECT * FROM assinaturas ORDER BY created_at DESC;
```

**Logs esperados:**
```
[OutboxProcessor] Processando 1 evento(s) pendente(s)
[AssinaturaCriadaHandler] Processando evento AssinaturaCriada: xxx
[AssinaturaCriadaHandler] Nova assinatura criada:
[AssinaturaCriadaHandler]   - Assinatura ID: xxx
[AssinaturaCriadaHandler]   - Usuário ID: user-123
[OutboxProcessor] Evento xxx processado com sucesso
```

---

## 🔄 Testando Saga Pattern

### Cenário 1: Saga com Sucesso

**Request:**
```bash
curl -X POST http://localhost:3000/saga/criar-assinatura \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "user-456",
    "planoId": "plano-premium",
    "tipoVigencia": "MENSAL",
    "metodoPagamento": "cartao"
  }'
```

**Response:**
```json
{
  "sagaId": "saga-uuid-123"
}
```

**O que acontece:**

1. ✅ Passo 1: Validar Plano
2. ✅ Passo 2: Criar Assinatura
3. ✅ Passo 3: Processar Pagamento
4. ✅ Passo 4: Enviar Notificação
5. 🎉 Saga completada com sucesso!

**Consultar status:**
```bash
curl http://localhost:3000/saga/saga-uuid-123/status
```

**Logs esperados:**
```
[CriarAssinaturaSaga] Iniciando saga: CriarAssinaturaSaga
[ValidarPlanoStep] Validando plano plano-premium para usuário user-456
[ValidarPlanoStep] Plano Premium validado com sucesso
[CriarAssinaturaStep] Criando assinatura no banco de dados...
[CriarAssinaturaStep] Assinatura xxx criada com sucesso
[ProcessarPagamentoStep] Processando pagamento para assinatura xxx...
[ProcessarPagamentoStep] Pagamento xxx aprovado
[EnviarNotificacaoStep] Enviando notificação de boas-vindas...
[CriarAssinaturaSaga] 🎉 Saga de criação de assinatura completada com sucesso!
```

### Cenário 2: Saga com Falha e Compensação

**Request com plano inexistente:**
```bash
curl -X POST http://localhost:3000/saga/criar-assinatura \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "user-789",
    "planoId": "plano-inexistente",
    "tipoVigencia": "MENSAL",
    "metodoPagamento": "cartao"
  }'
```

**O que acontece:**

1. ❌ Passo 1: Validar Plano (FALHA - plano não existe)
2. 🔙 Saga inicia compensação
3. 🎯 Saga compensada

**Logs esperados:**
```
[CriarAssinaturaSaga] Iniciando saga: CriarAssinaturaSaga
[ValidarPlanoStep] Validando plano plano-inexistente para usuário user-789
[SagaOrchestrator] Erro no passo ValidarPlano: Plano não encontrado
[SagaOrchestrator] Saga xxx falhou, iniciando compensação...
[CriarAssinaturaSaga] ❌ Saga de criação de assinatura falhou e foi compensada
[CriarAssinaturaSaga] Todas as operações foram revertidas com sucesso
```

### Cenário 3: Falha no Meio da Saga (com compensações)

Para simular falha no pagamento, você pode modificar temporariamente o código em `processar-pagamento.step.ts` para sempre falhar:

```typescript
// Força falha para demonstração
const aprovado = false; // Altere Math.random() > 0.1 para false
```

**Request:**
```bash
curl -X POST http://localhost:3000/saga/criar-assinatura \
  -H "Content-Type: application/json" \
  -d '{
    "usuarioId": "user-999",
    "planoId": "plano-premium",
    "tipoVigencia": "MENSAL",
    "metodoPagamento": "cartao"
  }'
```

**O que acontece:**

1. ✅ Passo 1: Validar Plano
2. ✅ Passo 2: Criar Assinatura
3. ❌ Passo 3: Processar Pagamento (FALHA)
4. 🔙 Inicia compensação
5. ⬅️ Compensa Passo 2: Remove assinatura criada
6. ⬅️ Compensa Passo 1: Sem compensação (read-only)
7. 🎯 Saga compensada

**Logs esperados:**
```
[ValidarPlanoStep] Plano Premium validado com sucesso
[CriarAssinaturaStep] Assinatura xxx criada com sucesso
[ProcessarPagamentoStep] Processando pagamento para assinatura xxx...
[SagaOrchestrator] Erro no passo ProcessarPagamento: Pagamento recusado
[SagaOrchestrator] Saga xxx falhou, iniciando compensação...
[SagaOrchestrator] Compensando passo 2: CriarAssinatura
[CriarAssinaturaStep] Compensando: removendo assinatura xxx
[CriarAssinaturaStep] Assinatura xxx removida (compensado)
[SagaOrchestrator] Compensando passo 1: ValidarPlano
[ValidarPlanoStep] ValidarPlano não requer compensação (read-only)
[CriarAssinaturaSaga] ❌ Saga de criação de assinatura falhou e foi compensada
```

---

## 🔍 Verificando no Banco de Dados

### Ver eventos do Outbox

```sql
-- Eventos pendentes
SELECT * FROM outbox_events WHERE status = 'PENDING';

-- Eventos processados
SELECT * FROM outbox_events WHERE status = 'PROCESSED';

-- Eventos com falha
SELECT * FROM outbox_events WHERE status = 'FAILED';
```

### Ver Sagas

```sql
-- Sagas em execução
SELECT * FROM saga_instances WHERE status = 'STARTED';

-- Sagas completadas
SELECT * FROM saga_instances WHERE status = 'COMPLETED';

-- Sagas compensadas (com falha)
SELECT * FROM saga_instances WHERE status = 'COMPENSATED';

-- Ver passos de uma saga específica
SELECT * FROM saga_steps WHERE saga_id = 'sua-saga-id' ORDER BY step_order;
```

---

## 🎯 Pontos de Aprendizado

### Outbox Pattern

1. **Atomicidade**: Evento e dados salvos na mesma transação
2. **Confiabilidade**: Se o sistema cair, evento não é perdido
3. **Processamento Assíncrono**: Eventos processados em background
4. **Retry**: Eventos falhos são reprocessados automaticamente

### Saga Pattern

1. **Transações Distribuídas**: Coordena operações em múltiplos sistemas
2. **Compensações**: Cada passo pode ser revertido
3. **Ordem Reversa**: Compensações executadas do último para o primeiro
4. **Rastreabilidade**: Cada passo registrado no banco
5. **Resiliente**: Sistema pode recuperar de falhas

---

## 💡 Experimentos Sugeridos

### Outbox

1. **Parar o servidor** durante criação de assinatura
   - Reinicie e veja o evento sendo processado
   - Demonstra confiabilidade do pattern

2. **Criar múltiplos handlers** para o mesmo evento
   - Registre outro handler para `AssinaturaCriada`
   - Veja ambos sendo chamados

3. **Simular falha em handler**
   - Faça um handler lançar erro
   - Veja o retry acontecer

### Saga

1. **Adicionar novos passos** à saga
   - Exemplo: Validar cartão de crédito
   - Implemente com sua compensação

2. **Criar nova saga** do zero
   - Exemplo: Saga de cancelamento
   - Passos: parar cobrança, notificar, arquivar dados

3. **Testar recovery** de saga
   - Pare o servidor no meio da saga
   - Reinicie e veja continuar ou compensar

---

## 📚 Arquivos Criados

### Outbox Pattern
```
src/infrastructure/outbox/
├── outbox.types.ts                 # Tipos e enums
├── outbox.repository.ts             # Repository do outbox
├── event-publisher.service.ts       # Publica eventos
├── outbox-processor.service.ts      # Processa eventos (cron)
└── outbox.module.ts                 # Módulo NestJS

src/application/event-handlers/
├── assinatura-criada.handler.ts     # Handler exemplo
└── event-handlers.module.ts         # Módulo de handlers
```

### Saga Pattern
```
src/infrastructure/saga/
├── saga.types.ts                    # Tipos e enums
├── saga-step.interface.ts           # Interface de passo
├── saga-definition.interface.ts     # Interface de saga
├── saga.repository.ts               # Repository de sagas
├── saga-orchestrator.service.ts     # Orquestrador
└── saga.module.ts                   # Módulo NestJS

src/application/sagas/criar-assinatura/
├── criar-assinatura-saga.types.ts   # Tipos da saga
├── criar-assinatura.saga.ts         # Definição da saga
├── criar-assinatura-saga.module.ts  # Módulo da saga
└── steps/
    ├── validar-plano.step.ts
    ├── criar-assinatura.step.ts
    ├── processar-pagamento.step.ts
    └── enviar-notificacao.step.ts
```

---

## ❓ FAQ

**P: Os eventos do Outbox são processados imediatamente?**
R: Não, há uma latência de até 10 segundos (configurado no @Cron). Em produção, você pode ajustar isso.

**P: O que acontece se o OutboxProcessor falhar?**
R: O evento fica com status PENDING e será reprocessado na próxima execução do cron.

**P: Posso ter múltiplas instâncias do serviço rodando?**
R: Sim, mas você precisa implementar distributed locking para evitar processar o mesmo evento duas vezes.

**P: Sagas são transações ACID?**
R: Não, são transações BASE (eventual consistency). Cada passo é uma transação isolada.

**P: Compensações sempre funcionam?**
R: Nem sempre. Por isso é importante ter idempotência e logging robusto.

---

## 🎓 Próximos Passos

1. Leia o arquivo [PATTERNS.md](./PATTERNS.md) para entender os conceitos em detalhes
2. Teste os cenários descritos acima
3. Implemente suas próprias sagas
4. Adicione mais handlers de eventos
5. Explore o código implementado

Bom aprendizado! 🚀
