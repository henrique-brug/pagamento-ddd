# 💳 Sistema de Pagamentos DDD

> Sistema de gerenciamento de assinaturas implementado com **Domain-Driven Design (DDD)**, **Clean Architecture**, e padrões avançados de arquitetura distribuída.

[![NestJS](https://img.shields.io/badge/NestJS-11.0.1-E0234E?logo=nestjs)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-7.3.0-2D3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql)](https://www.postgresql.org/)

---

## 📋 Índice

- [Sobre o Projeto](#-sobre-o-projeto)
- [Arquitetura](#-arquitetura)
- [Padrões Implementados](#-padrões-implementados)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Uso](#-uso)
- [Testes](#-testes)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Documentação](#-documentação)

---

## 🎯 Sobre o Projeto

Sistema robusto para gerenciamento de assinaturas com foco em:

- **Consistência de Dados**: Garantia de integridade através do Outbox Pattern
- **Transações Distribuídas**: Coordenação de processos complexos com Saga Pattern
- **Arquitetura Limpa**: Separação clara de responsabilidades (Domain, Application, Infrastructure)
- **DDD Tático**: Agregados, Value Objects, Domain Events e Repositories
- **Event-Driven**: Comunicação assíncrona e desacoplada entre componentes

### Casos de Uso Principais

- ✅ Criação de assinaturas com validação de plano
- ✅ Processamento de pagamentos com rollback automático
- ✅ Notificações assíncronas via eventos
- ✅ Rastreamento completo de transações distribuídas

---

## 🏗️ Arquitetura

### Clean Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Infrastructure                    │
│  (HTTP Controllers, Prisma, Outbox, Saga)           │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                    Application                       │
│  (Use Cases, Sagas, Event Handlers)                 │
└─────────────────┬───────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│                      Domain                          │
│  (Entities, Value Objects, Events, Repositories)    │
└─────────────────────────────────────────────────────┘
```

### Camadas

#### 🔵 **Domain** (Núcleo do Negócio)
- **Entities**: `Assinatura` com lógica de domínio encapsulada
- **Value Objects**: `PeriodoVigencia`, `StatusAssinatura`
- **Events**: `AssinaturaCriada`, `AssinaturaAtivada`, `AssinaturaCancelada`
- **Repositories**: Interfaces abstratas (não conhecem infraestrutura)

#### 🟢 **Application** (Casos de Uso)
- **Use Cases**: `CriarAssinaturaUseCase`, `CriarAssinaturaSagaUseCase`
- **Sagas**: Orquestração de processos de longa duração
- **Event Handlers**: Reações a eventos de domínio

#### 🟡 **Infrastructure** (Implementação Técnica)
- **HTTP**: Controllers REST com NestJS
- **Persistence**: Repositórios Prisma + PostgreSQL
- **Outbox**: Publicação confiável de eventos
- **Saga**: Orquestração de transações distribuídas

---

## 🎨 Padrões Implementados

### 1️⃣ Outbox Pattern

Garante que eventos sejam publicados atomicamente com mudanças de dados.

**Fluxo**:
```
Transaction {
  1. Salvar Assinatura
  2. Salvar Evento no Outbox  ← Mesma transação
}
↓
OutboxProcessor (a cada 10s)
↓
Event Handlers (email, notificações...)
```

**Benefícios**:
- ✅ Zero perda de eventos
- ✅ Consistência garantida
- ✅ Retry automático em falhas

[📖 Documentação Completa](docs/PATTERNS.md#-outbox-pattern)

---

### 2️⃣ Saga Pattern (Orquestrada)

Coordena transações distribuídas com compensações automáticas.

**Exemplo: Criação de Assinatura**

```typescript
Passos:
1. Validar Plano       ✅
2. Criar Assinatura    ✅
3. Processar Pagamento ❌ FALHOU!

Compensações (ordem reversa):
2. ⬅️ Remover Assinatura
1. ⬅️ (sem compensação - read-only)

Resultado: Rollback completo, sistema consistente!
```

**Benefícios**:
- ✅ Transações distribuídas
- ✅ Rollback automático
- ✅ Rastreabilidade total
- ✅ Recuperação de falhas

[📖 Documentação Completa](docs/PATTERNS.md#-saga-pattern)

---

## 🛠️ Tecnologias

### Core
- **[NestJS](https://nestjs.com/)** - Framework Node.js escalável
- **[TypeScript](https://www.typescriptlang.org/)** - Tipagem estática
- **[Prisma](https://www.prisma.io/)** - ORM type-safe
- **[PostgreSQL](https://www.postgresql.org/)** - Banco de dados relacional

### Patterns & Architecture
- **DDD** (Domain-Driven Design)
- **Clean Architecture**
- **SOLID Principles**
- **Outbox Pattern**
- **Saga Pattern**
- **Event-Driven Architecture**

### Testing & Quality
- **Jest** - Testes unitários e integração
- **Supertest** - Testes E2E
- **ESLint + Prettier** - Padronização de código

---

## 📦 Instalação

### Pré-requisitos

- Node.js >= 18.x
- PostgreSQL >= 14.x
- npm ou yarn

### Passo a Passo

1. **Clone o repositório**
```bash
git clone <repository-url>
cd pagamento-ddd
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/pagamento_ddd"
PORT=3000
```

4. **Execute as migrations**
```bash
npx prisma migrate dev
npx prisma generate
```

5. **Inicie o Docker (opcional)**
```bash
docker-compose up -d
```

---

## 🚀 Uso

### Desenvolvimento

```bash
# Modo watch (recarrega automaticamente)
npm run dev

# Modo debug
npm run start:debug
```

### Produção

```bash
# Build
npm run build

# Executar
npm run start:prod
```

### Endpoints Disponíveis

#### 📌 Criar Assinatura (Simples)
```bash
POST /assinatura
Content-Type: application/json

{
  "usuarioId": "user-123",
  "planoId": "plano-basico",
  "tipoVigencia": "MENSAL"
}
```

#### 📌 Criar Assinatura (via Saga)
```bash
POST /saga/criar-assinatura
Content-Type: application/json

{
  "usuarioId": "user-123",
  "planoId": "plano-premium",
  "tipoVigencia": "MENSAL",
  "metodoPagamento": "cartao"
}
```

#### 📌 Consultar Status da Saga
```bash
GET /saga/{sagaId}/status
```

**Resposta**:
```json
{
  "sagaId": "saga-uuid",
  "sagaType": "CriarAssinaturaSaga",
  "status": "COMPLETED",
  "currentStep": "EnviarNotificacao",
  "steps": [
    { "name": "ValidarPlano", "status": "COMPLETED" },
    { "name": "CriarAssinatura", "status": "COMPLETED" },
    { "name": "ProcessarPagamento", "status": "COMPLETED" },
    { "name": "EnviarNotificacao", "status": "COMPLETED" }
  ]
}
```

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm run test

# Testes em modo watch
npm run test:watch

# Testes E2E
npm run test:e2e

# Cobertura
npm run test:cov
```

### Exemplo de Teste

```typescript
describe('CriarAssinaturaUseCase', () => {
  it('deve criar assinatura com sucesso', async () => {
    const dto = {
      usuarioId: 'user-123',
      planoId: 'plano-basico',
      tipoVigencia: 'MENSAL'
    };

    const resultado = await useCase.execute(dto);

    expect(resultado.assinaturaId).toBeDefined();
    expect(resultado.status).toBe('ATIVA');
  });
});
```

---

## 📂 Estrutura do Projeto

```
pagamento-ddd/
├── src/
│   ├── domain/                    # 🔵 Camada de Domínio
│   │   ├── assinatura/
│   │   │   ├── entity/            # Agregados
│   │   │   ├── value-object/      # Value Objects
│   │   │   ├── event/             # Domain Events
│   │   │   ├── factory/           # Factories
│   │   │   └── repository/        # Interfaces de repositório
│   │   └── shared/
│   │       └── event/             # Base de eventos
│   │
│   ├── application/               # 🟢 Camada de Aplicação
│   │   ├── use-cases/             # Casos de uso
│   │   ├── sagas/                 # Sagas orquestradas
│   │   │   └── criar-assinatura/
│   │   │       ├── steps/         # Passos da saga
│   │   │       └── *.saga.ts      # Definição da saga
│   │   └── event-handlers/        # Handlers de eventos
│   │
│   └── infrastructure/            # 🟡 Camada de Infraestrutura
│       ├── http/                  # Controllers REST
│       ├── persistence/           # Prisma + Repositories
│       ├── outbox/                # Outbox Pattern
│       └── saga/                  # Saga Orchestrator
│
├── prisma/
│   ├── schema.prisma              # Schema do banco
│   └── migrations/                # Migrations
│
├── docs/
│   ├── PATTERNS.md                # Documentação de padrões
│   └── GETTING_STARTED_PATTERNS.md
│
└── test/                          # Testes E2E
```

### Principais Arquivos

| Arquivo | Descrição |
|---------|-----------|
| `src/domain/assinatura/entity/assinatura.ts` | Agregado Assinatura |
| `src/application/use-cases/criar-assinatura/` | Use Case principal |
| `src/infrastructure/saga/saga-orchestrator.service.ts` | Orquestrador de sagas |
| `src/infrastructure/outbox/outbox-processor.service.ts` | Processador de eventos |

---

## 📚 Documentação

### Guias Disponíveis

- [📖 Padrões de Arquitetura (Outbox & Saga)](docs/PATTERNS.md)
- [🚀 Getting Started com Padrões](docs/GETTING_STARTED_PATTERNS.md)
- [📐 Modelagem de Domínio](docs/Modelagem%20de%20domínio.md)

### Conceitos DDD Implementados

- ✅ **Aggregates**: Assinatura como agregado raiz
- ✅ **Value Objects**: PeriodoVigencia, StatusAssinatura
- ✅ **Domain Events**: AssinaturaCriada, etc.
- ✅ **Repositories**: Interfaces no domínio, implementação na infra
- ✅ **Factories**: Criação de agregados complexos
- ✅ **Use Cases**: Orquestração de lógica de aplicação

### Recursos Externos

- [NestJS Documentation](https://docs.nestjs.com)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Saga Pattern - Chris Richardson](https://microservices.io/patterns/data/saga.html)
- [Outbox Pattern - Microsoft](https://docs.microsoft.com/en-us/azure/architecture/patterns/outbox)

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

### Padrões de Commit

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: adiciona nova funcionalidade
fix: corrige bug
docs: atualiza documentação
refactor: refatora código sem mudar comportamento
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

---

## 📄 Licença

Este projeto está sob a licença **UNLICENSED** (uso privado).

---

## 👥 Autores

Desenvolvido com ❤️ seguindo princípios de **Clean Architecture** e **Domain-Driven Design**.

---

## 🎓 Aprendizados

Este projeto demonstra:

- ✅ Implementação prática de DDD
- ✅ Arquitetura Limpa em TypeScript
- ✅ Padrões avançados (Outbox, Saga)
- ✅ Event-Driven Architecture
- ✅ Transações distribuídas
- ✅ SOLID e boas práticas

---

## 📞 Suporte

Para dúvidas ou sugestões:

- 📧 Email: [seu-email@exemplo.com]
- 💬 Discord: [link-do-discord]
- 🐛 Issues: [GitHub Issues](../../issues)

---

<p align="center">
  Feito com 💙 usando <a href="https://nestjs.com/">NestJS</a>
</p>
