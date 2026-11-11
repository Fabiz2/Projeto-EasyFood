# ADR-002 — Adotar MySQL como banco de dados

| Campo       | Valor                          |
|-------------|--------------------------------|
| **Status**  | Aceito                         |
| **Data**    | 2026-08-20                     |
| **Autores** | Equipe de Engenharia EasyFood  |

---

## Contexto

Conforme previsto na ADR-001, o armazenamento em memória foi adotado para a fase de MVP. Com a validação do fluxo de negócio concluída, o serviço EasyFood precisa agora de persistência real para suportar:

- Dados que sobrevivam a reinicializações do processo
- Múltiplas instâncias do servidor (escalabilidade horizontal)
- Consultas mais complexas conforme o domínio evolui (filtros, ordenação, relacionamentos)
- Integridade e consistência dos dados em ambiente de produção

É necessário escolher um banco de dados definitivo para substituir o array em memória.

---

## Alternativas consideradas

| # | Opção | Descrição |
|---|-------|-----------|
| 1 | MySQL | Banco relacional open-source, ACID, SQL padrão, amplamente utilizado |
| 2 | PostgreSQL | Banco relacional popular, robusto para workloads complexas e extensíveis |
| 3 | MongoDB | Banco orientado a documentos, schema flexível |
| 4 | SQLite | Banco relacional embarcado, sem servidor separado |

---

## Decisão

Adotar **MySQL** como banco de dados relacional do EasyFood.

---

## Justificativa

- **Conformidade ACID** — garante integridade transacional, essencial para operações de cadastro e atualização de restaurantes.
- **SQL padrão** — linguagem de consulta madura e amplamente conhecida pelo time, com boa compatibilidade com ferramentas do ecossistema Node.js.
- **Performance para leitura e escrita simples** — entrega boa resposta para o perfil inicial do EasyFood, com foco em listagem, cadastro e exclusão de restaurantes.
- **Ecossistema Node.js maduro** — bibliotecas como `mysql2`, `knex` e `prisma` oferecem integração robusta com o projeto.
- **Open-source e sem custo de licença** — reduz custo operacional e facilita adoção no ambiente de desenvolvimento.
- **Ampla adoção no mercado** — facilita contratação, onboarding e manutenção de conhecimento dentro da equipe.
- **Suporte a relacionamentos** — o domínio do EasyFood tende a crescer (pedidos, avaliações, endereços), e um banco relacional modela isso de forma natural.
- **Boa experiência com migrações e versionamento** — facilita o trabalho com schema em evolução e com a adoção de Prisma.

---

## Consequências

### Positivas

- ✅ Dados persistidos de forma durável entre reinicializações e deploys
- ✅ Suporte a múltiplas instâncias do servidor acessando o mesmo banco
- ✅ Consultas complexas com JOINs, índices e agregações
- ✅ Integridade referencial via foreign keys
- ✅ Caminho natural para evoluir o schema com migrations
- ✅ Ferramentas de backup e recuperação maduras

### Negativas

- ❌ Introduz dependência de infraestrutura externa (servidor de banco)
- ❌ Necessidade de gerenciar migrations de schema
- ❌ Configuração adicional no ambiente de desenvolvimento (Docker ou instalação local)
- ❌ Pequeno aumento de complexidade no onboarding de novos devs

---

## Critérios de revisão

Esta decisão deve ser reavaliada quando:

1. O volume de dados atingir escala que demande sharding ou réplicas de leitura
2. Surgir necessidade de modelagem predominantemente não-relacional
3. Requisitos de latência exigirem cache dedicado (Redis) como camada complementar

---

## Notas

- O ambiente de desenvolvimento utilizará MySQL via Docker para manter paridade com produção.
- Será adotada uma biblioteca de migrations (ex: `knex` ou `prisma migrate`) para versionamento do schema.
- A migração dos dados do array em memória para o banco será feita de forma incremental, endpoint por endpoint.
