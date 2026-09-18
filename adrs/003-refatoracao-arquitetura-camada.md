# ADR-003 — Refatorar a arquitetura da EasyFood em camadas

| Campo       | Valor                          |
|-------------|--------------------------------|
| **Status**  | Aceito                         |
| **Data**    | 2026-09-17                     |
| **Autores** | Equipe de Engenharia EasyFood  |

---

## Contexto

A EasyFood já possui uma API funcional para cadastro e listagem de restaurantes e a estrutura inicial foi evoluindo sem separação clara entre regras de negócio, acesso a dados e transporte HTTP. Com isso, surge a necessidade de reorganizar a arquitetura para manter a aplicação mais fácil de manter, testar e evoluir.

A refatoração tem como objetivo centralizar a conexão com o Prisma em uma camada específica, separar service e controller das rotas e manter a exposição da API em um ponto único.

---

## Alternativas consideradas

| # | Opção | Descrição |
|---|-------|-----------|
| 1 | Estrutura monolítica simples | Mantém tudo em um único arquivo ou em poucos pontos, sem separação de responsabilidades |
| 2 | Estrutura em camadas | Separa database, service, controller e routes, deixando a aplicação mais organizada |
| 3 | Arquitetura por módulos com autenticação inicial | Organiza por domínio e prepara a aplicação para evoluir com autenticação futura |

---

## Decisão

Adotar a estrutura em camadas para a API da EasyFood, com organização por domínio e separação de responsabilidades.

---

## Justificativa

- **Isolamento da conexão com o banco** — a camada de database fica responsável apenas pela instância do Prisma.
- **Separação de responsabilidades** — service cuida da lógica de acesso aos dados e controller cuida da interação com HTTP.
- **Rotas mais limpas** — a configuração dos endpoints fica centralizada em arquivos dedicados por módulo.
- **Facilidade de manutenção** — mudanças no banco ou na regra de negócio ficam contidas em camadas específicas.
- **Preparação para crescimento** — a arquitetura facilita a inclusão de novos módulos e evoluções futuras, incluindo autenticação.

---

## Consequências

### Positivas

- ✅ Código mais organizado e legível
- ✅ Maior facilidade para evoluir o produto
- ✅ Melhor manutenção de regras e endpoints
- ✅ Base sólida para novas funcionalidades e módulos

### Negativas

- ❌ Exige uma etapa de refatoração inicial
- ❌ Aumenta o número de arquivos no projeto
- ❌ Exige atenção na organização das importações e rotas

---

## Critérios de revisão

Esta decisão deve ser revisada quando:

1. O módulo de restaurantes crescer em complexidade
2. Novos domínios forem adicionados ao projeto
3. A autenticação e autorização exigirem uma estrutura mais específica
4. A API precisar de separação mais profunda por contexto e permissões

---

## Notas

- A estrutura criada foi:
  - `src/database/prisma.js`
  - `src/modules/restaurants/restaurant.service.js`
  - `src/modules/restaurants/restaurant.controller.js`
  - `src/modules/restaurants/restaurant.routes.js`
  - `src/app.js`
  - `server.js`
- A rota de restaurantes continua exposta em `/restaurants` com os endpoints de listagem e cadastro.
- Foi criado o diretório `src/modules/auth/` como planejamento para a autenticação futura.
