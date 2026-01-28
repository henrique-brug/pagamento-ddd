+------------------------+         +------------------------+
|  BC: IDENTIDADE        |         |   BC: CATÁLOGO/PLANOS   |
|------------------------|         |------------------------|
| Aggregate: Usuario     |         | Aggregate: Plano       |
|  - usuarioId           |         |  - planoId             |
|  - email               |         |  - nome                |
|  - status              |         |  - preco               |
+-----------+------------+         |  - periodicidade       |
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
|  - inicioEm, proximaCobrancaEm                            |
|  - canceladaEm?                                           |
|-----------------------------------------------------------|
| Entidades/VO dentro do aggregate:                         |
|  - PeriodoVigencia (VO)                                   |
|  - RegrasDeRenovacao (VO)                                 |
|  - HistoricoStatus* (opcional)                            |
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

Regras (invariantes) típicas por aggregate

- Assinatura (Aggregate Root)
* Usuário não pode ter duas assinaturas ATIVAS.
* Assinatura só muda para ATIVA quando houver confirmação de pagamento (ou trial).