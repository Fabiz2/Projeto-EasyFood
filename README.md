# EasyFood

API e front-end para restaurantes publicarem seus cardápios. Projeto da disciplina Software Architecture & Design Patterns (UniFECAF).

A aplicação é um monólito modular em camadas (routes → controller → service → database) com:

- cadastro e consulta de restaurantes;
- cardápio por restaurante (relação 1:N entre `Restaurant` e `Dish`);
- autenticação com JWT e senhas com hash bcrypt;
- e-mail automático no cadastro de restaurantes (SendPulse, com suporte ao Resend);
- upload de fotos dos pratos e do perfil do usuário, otimizadas com Sharp por um serviço compartilhado;
- autorização por dono: só quem cadastrou o restaurante gerencia o cardápio;
- front-end em HTML, CSS e JavaScript puro, servido pelo próprio Express.

## Tecnologias

Node.js, Express 5, Prisma 6, MySQL, JWT, bcryptjs, dotenv, SendPulse/Resend, Multer e Sharp.

## Como rodar

**Pré-requisitos:** Node.js 20 ou superior e MySQL rodando.

1. Instale as dependências:

   ```bash
   npm install
   ```

2. Crie o arquivo `.env` a partir do exemplo e preencha os valores:

   ```bash
   cp .env.example .env
   ```

   | Variável | Para que serve |
   |---|---|
   | `DATABASE_URL` | Conexão com o MySQL, ex.: `mysql://root:senha@localhost:3306/easyfood` |
   | `JWT_SECRET` | Chave usada para assinar os tokens |
   | `EMAIL_API_KEY` | Chave do SendPulse (`sp_...`, em Configurações → API) ou do Resend (`re_...`) |
   | `EMAIL_FROM` | Remetente cadastrado na conta do provedor |
   | `EMAIL_FROM_NAME` | Nome que aparece como remetente |
   | `EMAIL_TEST_TO` | Destinatário dos e-mails de teste |

   Sem `EMAIL_API_KEY`, a API funciona normalmente e apenas registra no terminal que o e-mail não foi enviado.

3. Crie as tabelas e gere o Prisma Client:

   ```bash
   npx prisma migrate dev
   ```

4. (Opcional) Popule o banco com restaurantes e pratos de exemplo:

   ```bash
   npm run seed
   ```

5. Inicie o servidor:

   ```bash
   npm start
   ```

   Acesse **http://localhost:3000**. Para ver o banco: `npm run studio`.

## Endpoints

🔒 = exige o header `Authorization: Bearer SEU_TOKEN`

### Autenticação

| Método | Rota | Descrição |
|---|---|---|
| POST | `/auth/register` | Cria usuário `{ name, email, password }` → 201 |
| POST | `/auth/login` | Retorna `{ token, user }` |
| GET | `/auth/me` 🔒 | Dados do usuário autenticado (com `imageUrl`) |
| POST | `/auth/me/image` 🔒 | Foto de perfil (form-data, campo `image`) → 200 |

### Restaurantes

| Método | Rota | Descrição |
|---|---|---|
| GET | `/restaurants` | Lista restaurantes (com a quantidade de pratos) |
| POST | `/restaurants` 🔒 | Cria `{ name, category, rating }` → 201 e dispara 2 e-mails |
| DELETE | `/restaurants/:id` 🔒 | Remove o restaurante e o cardápio dele (só o dono) |

### Cardápio

| Método | Rota | Descrição |
|---|---|---|
| GET | `/restaurants/:restaurantId/dishes` | Lista os pratos do restaurante |
| POST | `/restaurants/:restaurantId/dishes` 🔒 | Cria `{ name, description, price }` → 201 (só o dono) |
| POST | `/dishes/:dishId/image` 🔒 | Envia foto (form-data, campo `image`) → 200 (só o dono) |

Respostas de erro: 401 (sem token), 403 (não é o dono do restaurante), 400 (sem arquivo, formato inválido ou imagem corrompida), 413 (acima de 5 MB) e 404 (prato inexistente).

As imagens otimizadas ficam em `uploads/dishes/` e `uploads/users/` e são servidas em `/uploads/<pasta>/<arquivo>.webp`.

## Estrutura

```text
.
├── docs/adr/                  Registros de decisões arquiteturais
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.js
├── public/                    Front-end (index.html, style.css, script.js, fonts/)
├── src/
│   ├── app.js                 Middlewares, arquivos estáticos e rotas
│   ├── database/prisma.js     Conexão única com o banco
│   └── modules/
│       ├── auth/              register, login, me e middleware JWT
│       ├── restaurants/       routes, controller, service
│       ├── dishes/            routes, controller, service
│       └── shared/            email.service, image.service,
│                              upload.middleware, error.middleware
├── uploads/                   Imagens otimizadas de pratos e perfis (não versionadas)
├── .env.example
└── server.js                  Carrega o .env e liga o servidor
```

## Decisões arquiteturais

| ADR | Decisão |
|---|---|
| [001](docs/adr/ADR-001-armazenar-restaurantes-em-memoria.md) | Armazenar restaurantes em memória (MVP) |
| [002](docs/adr/ADR-002-persistencia-com-mysql.md) | Persistência com MySQL + Prisma |
| [003](docs/adr/ADR-003-arquitetura-em-camadas.md) | Arquitetura em camadas |
| [004](docs/adr/ADR-004-autenticacao-jwt.md) | Autenticação com JWT |
| [005](docs/adr/ADR-005-servico-de-envio-de-email.md) | Serviço compartilhado de e-mail |
| [006](docs/adr/ADR-006-processamento-de-imagens.md) | Processamento de imagens dentro da API |
| [007](docs/adr/ADR-007-dono-do-restaurante.md) | Restaurante com dono e autorização por propriedade |

A análise da correção do cadastro de pratos, os testes e as respostas da Atividade 8 estão em [docs/atividade-8.md](docs/atividade-8.md).
