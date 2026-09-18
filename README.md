# EasyFood

API para cadastro e listagem de restaurantes com arquitetura em camadas e autenticação JWT.

## Visão geral

O projeto EasyFood foi estruturado para separar responsabilidades em camadas:

- `src/database` para a conexão com o Prisma
- `src/modules/restaurants` para a lógica de restaurantes
- `src/modules/auth` para autenticação e proteção de rotas
- `src/app.js` para a configuração do Express
- `server.js` para iniciar a aplicação

## Tecnologias

- Node.js
- Express
- Prisma
- MySQL
- JWT
- bcryptjs
- dotenv

## Pré-requisitos

- Node.js instalado
- MySQL em execução
- npm ou yarn

## Instalação

1. Clone o projeto
2. Instale as dependências:

```bash
npm install
```

3. Configure o arquivo `.env` com a URL do banco e o segredo JWT:

```env
DATABASE_URL="mysql://usuario:senha@localhost:3306/easyfood"
JWT_SECRET="troque-por-uma-chave-longa-e-aleatoria"
```

## Prisma

Gere o client e aplique as migrations:

```bash
npx prisma generate
npx prisma migrate dev
```

## Execução

Inicie o servidor:

```bash
node server.js
```

A aplicação estará disponível em:

```text
http://localhost:3000
```

## Endpoints

### Restaurantes

#### GET /restaurants
Retorna a lista de restaurantes.

#### POST /restaurants
Cria um restaurante.

Body exemplo:

```json
{
  "name": "Cantina Roma",
  "category": "Italiana",
  "rating": 4.5
}
```

#### DELETE /restaurants/:id
Remove um restaurante pelo ID.

### Autenticação

#### POST /auth/register
Cria um novo usuário.

Body exemplo:

```json
{
  "name": "Aluno",
  "email": "aluno@easyfood.com",
  "password": "123456"
}
```

#### POST /auth/login
Realiza login e retorna JWT.

Body exemplo:

```json
{
  "email": "aluno@easyfood.com",
  "password": "123456"
}
```

#### GET /auth/me
Retorna os dados do usuário autenticado.

Requer header:

```http
Authorization: Bearer SEU_TOKEN
```

## Estrutura do projeto

```text
.
├── adrs/
├── prisma/
├── public/
├── src/
│   ├── app.js
│   ├── database/
│   │   └── prisma.js
│   ├── modules/
│   │   ├── auth/
│   │   └── restaurants/
├── .env
├── package.json
├── server.js
└── README.md
```

## Observações

- A rota de restaurantes está pública na listagem.
- O cadastro e a exclusão de restaurantes podem ser protegidos por autenticação conforme a evolução do projeto.
- O segredo do JWT deve ser mantido em ambiente seguro.
