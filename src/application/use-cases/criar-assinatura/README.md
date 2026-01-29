# Caso de Uso: Criar Assinatura

Este caso de uso implementa a criação de assinaturas seguindo os princípios de Domain-Driven Design (DDD).

## Arquitetura

### Camadas

1. **Domain**: Contém as entidades, value objects, factories e interfaces de repositório
2. **Application**: Contém os casos de uso (orquestração da lógica de negócio)
3. **Infrastructure**: Contém as implementações concretas (Prisma, HTTP, etc.)

## Estrutura de Arquivos

```
src/
├── domain/
│   └── assinatura/
│       ├── entity/
│       │   └── assinatura.ts
│       ├── value-object/
│       │   ├── status-assinatura.ts
│       │   └── periodo-vigencia.ts
│       ├── factory/
│       │   └── assinatura.factory.ts
│       └── repository/
│           └── assinatura.repository.ts (interface)
├── application/
│   └── use-cases/
│       └── criar-assinatura/
│           ├── criar-assinatura.dto.ts
│           ├── criar-assinatura.use-case.ts
│           ├── criar-assinatura.module.ts
│           └── index.ts
└── infrastructure/
    ├── persistence/
    │   └── prisma/
    │       ├── prisma.service.ts
    │       ├── prisma.module.ts
    │       └── repositories/
    │           └── prisma-assinatura.repository.ts
    └── http/
        ├── controllers/
        │   └── assinatura.controller.ts
        └── assinatura-http.module.ts
```

## Como Usar

### 1. Configurar o Banco de Dados

Certifique-se de ter a variável de ambiente `DATABASE_URL` configurada no arquivo `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pagamento_ddd?schema=public"
```

### 2. Executar as Migrations do Prisma

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Importar os Módulos no App Module

Edite o arquivo `src/app.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from './infrastructure/persistence/prisma/prisma.module';
import { AssinaturaHttpModule } from './infrastructure/http/assinatura-http.module';

@Module({
  imports: [PrismaModule, AssinaturaHttpModule],
})
export class AppModule {}
```

### 4. Fazer uma Requisição

**POST** `http://localhost:3000/api/assinaturas`

```json
{
  "usuarioId": "123e4567-e89b-12d3-a456-426614174000",
  "planoId": "223e4567-e89b-12d3-a456-426614174001",
  "tipoVigencia": "MENSAL"
}
```

**Resposta:**

```json
{
  "assinaturaId": "323e4567-e89b-12d3-a456-426614174002",
  "usuarioId": "123e4567-e89b-12d3-a456-426614174000",
  "planoId": "223e4567-e89b-12d3-a456-426614174001",
  "status": "PENDENTE",
  "inicioVigencia": "2026-01-28T22:00:00.000Z",
  "proximaCobranca": "2026-02-28T22:00:00.000Z"
}
```

## Princípios DDD Aplicados

1. **Entidades**: `Assinatura` possui identidade única e ciclo de vida
2. **Value Objects**: `PeriodoVigencia` e `StatusAssinatura` representam conceitos sem identidade
3. **Factory**: `AssinaturaFactory` encapsula a lógica de criação
4. **Repository**: Interface no domínio, implementação na infraestrutura (Inversão de Dependência)
5. **Use Case**: Orquestra a lógica de negócio sem conhecer detalhes de infraestrutura
6. **Separação de Camadas**: Domain não depende de Application ou Infrastructure

## Validações

- O período de vigência é calculado automaticamente baseado no tipo (MENSAL ou ANUAL)
- A assinatura é criada com status PENDENTE
- Todas as validações de domínio são executadas antes da persistência
