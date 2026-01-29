# Modelagem de Domínio - Sistema de Pagamentos

## Visão Geral dos Bounded Contexts

```
+------------------------+         +------------------------+
|  BC: IDENTIDADE        |         |   BC: PLANOS           |
|------------------------|         |------------------------|
| Aggregate: Usuario     |         | Aggregate: Plano       |
|  - usuarioId           |         |  - planoId             |
+-----------+------------+         |  - nome                |
            |                      |  - descricao           |
            |                      |  - preco               |
            |                      |  - periodicidade       |
            |                      |  - beneficios[]        |
            |                      +-----------+------------+
            |                                  |
            |                                  |
            v                                  v
+-----------------------------------------------------------+
|                 BC: ASSINATURAS (CORE)                    |
|-----------------------------------------------------------|
| Aggregate: Assinatura (Root)                              |
|  - assinaturaId                                           |
|  - usuarioId (ref)                                        |
|  - planoId   (ref)                                        |
|  - status: {PENDENTE, ATIVA, PAUSADA, CANCELADA}          |
|  - inicio                                                 |
|  - proximaCobranca                                        |
|  - cancelada?                                             |
|-----------------------------------------------------------|
| Entidades/VO dentro do aggregate:                         |
|  - PeriodoVigencia (VO)                                   |
|  - RegrasDeRenovacao (VO)                                 |
+---------------------------+-------------------------------+
                            |
                            | (gera cobranças / solicita pagamento)
                            v
+-----------------------------------------------------------+
|                   BC: PAGAMENTOS                          |
|-----------------------------------------------------------|
| Aggregate: Fatura (Root)                                  |
|  - faturaId                                               |
|  - assinaturaId (ref)                                     |
|  - competencia (AAAAMM)                                   |
|  - valor                                                  |
|  - status: {ABERTA, PAGA, VENCIDA, CANCELADA}             |
|-----------------------------------------------------------|
| Entidades dentro do aggregate:                            |
|  - TentativaCobranca                                      |
|     - tentativaId                                         |
|     - meioPagamento                                       |
|     - status: {CRIADA, AUTORIZADA, NEGADA}                |
|     - transacaoId?                                        |
+-----------------------------------------------------------+
```

## Regras de Negócio (Invariantes)

### Aggregate: Assinatura

- Usuário não pode ter duas assinaturas ATIVAS
- Assinatura só muda para ATIVA quando houver confirmação de pagamento (ou trial)

### Aggregate: Fatura

- Fatura só pode ser marcada como PAGA quando houver uma TentativaCobranca AUTORIZADA
- Não pode haver duas tentativas simultâneas para a mesma fatura

## Bounded Contexts

### 1. BC: Identidade

Responsável pelo gerenciamento de usuários e autenticação.

**Aggregate Root:** Usuario

- `usuarioId`

### 2. BC: Planos

Responsável pelo catálogo de planos de assinatura.

**Aggregate Root:** Plano

- `planoId`
- `nome`
- `descricao`
- `preco`
- `periodicidade`
- `beneficios[]`

### 3. BC: Assinaturas (CORE)

Bounded Context principal que gerencia o ciclo de vida das assinaturas.

**Aggregate Root:** Assinatura

- `assinaturaId`
- `usuarioId` (referência)
- `planoId` (referência)
- `status`: {PENDENTE, ATIVA, PAUSADA, CANCELADA}
- `inicio`
- `proximaCobranca`
- `cancelada?`

**Value Objects:**

- `PeriodoVigencia`
- `RegrasDeRenovacao`

### 4. BC: Pagamentos

Responsável por faturas e cobranças.

**Aggregate Root:** Fatura

- `faturaId`
- `assinaturaId` (referência)
- `competencia` (AAAAMM)
- `valor`
- `status`: {ABERTA, PAGA, VENCIDA, CANCELADA}

**Entidade:** TentativaCobranca

- `tentativaId`
- `meioPagamento`
- `status`: {CRIADA, AUTORIZADA, NEGADA}
- `transacaoId?`

## Fluxo de Comunicação

1. **Identidade** e **Planos** fornecem informações para **Assinaturas**
2. **Assinaturas** gera cobranças e solicita pagamento para **Pagamentos**
3. **Pagamentos** confirma pagamento de volta para **Assinaturas**