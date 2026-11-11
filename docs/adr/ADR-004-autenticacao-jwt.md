# ADR-004 — Implementações realizadas na EasyFood

| Campo       | Valor                          |
|-------------|--------------------------------|
| **Status**  | Aceito                         |
| **Data**    | 2026-09-17                     |
| **Autores** | Equipe de Engenharia EasyFood  |

---

## Contexto

A EasyFood passou por uma sequência de implementações para consolidar a API, organizar a estrutura em camadas e preparar o projeto para evolução. As mudanças incluíram a adoção da arquitetura por módulos, a configuração do Prisma com MySQL, a criação do fluxo de restaurantes e a implementação da autenticação JWT.

---

## Alternativas consideradas

| # | Opção | Descrição |
|---|-------|-----------|
| 1 | Manter a API em um único arquivo | Simples no início, mas pouco escalável e difícil de manter |
| 2 | Estruturar por camadas | Separa responsabilidades e facilita evolução |
| 3 | Adicionar autenticação imediatamente | Útil para fluxo protegido, mas exige mais planejamento e infraestrutura |

---

## Decisão

Adotar uma estrutura em camadas com módulos por domínio, incluindo a camada de acesso a dados do Prisma, a camada de serviço para regras de negócio, a camada de controller para HTTP e a camada de rotas para exposição dos endpoints.

Além disso, decidiu-se implementar autenticação com JWT para proteger o fluxo de cadastro e operação de restaurantes.

---

## Justificativa

- **Organização do código** — cada responsabilidade ficou localizada em seu módulo específico.
- **Persistência com Prisma** — o acesso ao banco foi centralizado em uma conexão única.
- **Fluxo de restaurantes funcional** — listagem, cadastro e remoção foram consolidados em endpoints claros.
- **Sistema de autenticação** — o JWT foi adicionado para validar acesso a rotas protegidas e autenticar usuários.
- **Preparação para evolução** — a API está em melhor condição para receber novos módulos e recursos.

---

## Implementações realizadas

### Arquitetura em camadas
- Criação da camada de banco em `src/database/prisma.js`
- Criação da camada de restaurantes em `src/modules/restaurants/`
- Separação entre service, controller e routes
- Configuração do app em `src/app.js`
- Simplificação do bootstrap em `server.js`

### Prisma e MySQL
- Configuração do datasource com MySQL
- Model `Restaurant` mantido no schema
- Model `User` adicionado para autenticação
- Migration para a tabela `users` criada

### Endpoints de restaurantes
- `GET /restaurants`
- `POST /restaurants`
- `DELETE /restaurants/:id`

### Autenticação
- Criação da estrutura `src/modules/auth/`
- Implementação de `register`, `login`, `me`
- Middleware `authenticate` para verificar token JWT
- Proteção de rotas sensíveis

---

## Consequências

### Positivas

- ✅ Código mais organizado e reutilizável
- ✅ Facilidade de manutenção e expansão
- ✅ Persistência e autenticação funcional
- ✅ Base para novos módulos e regras de negócio

### Negativas

- ❌ Mais arquivos e estrutura inicial mais complexa
- ❌ Necessidade de cuidado com imports e rotas
- ❌ Requer gestão de tokens e segredo de autenticação

---

## Critérios de revisão

Esta decisão deve ser revisada quando:

1. O número de módulos e regras de negócio aumentar significativamente
2. A autenticação precisar de refresh token, autorização por papel ou integração externa
3. A API precisar de novos domínios com regras independentes
4. O projeto entrar em produção e exigir refinamento operacional e segurança

---

## Notas

- O projeto foi estruturado para evoluir em módulos e evitar concentrar toda a lógica em um único arquivo.
- A autenticação com JWT foi aplicada somente no fluxo necessário, sem quebrar o funcionamento da camada de restaurantes.
- A estrutura atual serve como base para o próximo passo do produto, mantendo clareza e separação de responsabilidades.
