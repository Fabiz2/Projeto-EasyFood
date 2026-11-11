# Atividade 8 — Correção do cadastro de pratos e upload de imagens

## Parte 1 — Análise da correção do professor

Repositório de referência: [FelipeDiasR/easy-food](https://github.com/FelipeDiasR/easy-food), commit `70e459e` ("fix at creat menu").

### Arquivos alterados na correção

| Arquivo | O que mudou |
|---|---|
| `prisma/schema.prisma` | `Restaurant` ganhou `ownerId` e a relação `owner`; `User` ganhou `restaurants` |
| `prisma/migrations/..._add_restaurant_owner` | Cria a coluna `ownerId` e a chave estrangeira para `User` |
| `src/modules/dishes/dish.service.js` | Nova validação (`validateDish`), `parseId`, `ensureOwnership` e `createDish` sem exigir `imageUrl` |
| `src/modules/dishes/dish.controller.js` | Passa `req.user.id` (usuário do token) para o service |
| `src/modules/restaurant/restaurant.service.js` | Grava `ownerId: user.id` ao criar o restaurante |
| `src/modules/restaurant/restaurant.controller.js` | Apenas formatação |

### O que causava o erro

A versão anterior do `createDish` exigia todos estes campos no corpo da requisição:

```js
if (!name || !category || price === undefined || !imageUrl || !description) {
  throw httpError(400, "Campos obrigatórios: name, category, price, imageUrl, description");
}
```

O problema é o `imageUrl`. Pelo fluxo da aplicação, o prato é cadastrado **primeiro** e a imagem é enviada **depois**, por `POST /dishes/:dishId/image`, quando o prato já tem um id. Exigir a imagem no cadastro criava uma dependência circular: não dava para cadastrar o prato sem imagem, e não dava para enviar a imagem sem o prato existir. Na prática, todo cadastro feito pelo fluxo correto voltava **400 Bad Request**.

Havia ainda uma segunda falha, de segurança: qualquer usuário autenticado podia cadastrar, alterar ou excluir pratos de **qualquer** restaurante, porque nada ligava o restaurante a um dono.

### Como a correção foi implementada

1. **`imageUrl` saiu da validação.** O prato é criado sem imagem (no repositório do professor, com `""`, porque o campo é obrigatório no schema dele).
2. **Validação mais rigorosa:** `parseId` rejeita ids inválidos e `validateDish` confere tipos e preço (número finito, não negativo).
3. **Dono do restaurante:** `Restaurant.ownerId` guarda quem criou o restaurante, sempre a partir do token (`req.user.id`), nunca do corpo da requisição.
4. **`ensureOwnership`:** antes de criar, alterar ou excluir um prato, o service confere se o usuário logado é o dono. Se não for, responde **403 Forbidden**.

### Como aplicamos no nosso projeto

O nosso projeto usa MySQL e já tinha um módulo de pratos próprio (Atividade 7), então incorporamos a correção adaptando-a, sem copiar arquivos:

- **Cadastro sem imagem:** no nosso `schema.prisma`, `Dish.imageUrl` já era opcional (`String?`), então o prato é criado com `imageUrl: null`. Isso é mais claro que gravar uma string vazia: `null` significa "ainda sem foto".
- **Dono do restaurante:** adicionamos `ownerId` ao `Restaurant` (migration `20261111230000_add_restaurant_owner`). Diferente do professor, a coluna é **opcional** e a migration atribui os restaurantes que já existiam ao primeiro usuário cadastrado. Com `NOT NULL` direto, a migration falharia num banco que já tem restaurantes (o próprio Prisma avisa isso na migration do professor).
- **`ensureOwnership`:** fica em `restaurant.service.js`, porque a regra de quem é dono pertence ao domínio de restaurantes, e é reutilizada pelo `dish.service.js`. Ela protege o cadastro de prato, o upload de foto do prato e a exclusão do restaurante.
- **Front-end:** os botões "Adicionar prato", "Excluir restaurante" e "Enviar foto" só aparecem para o dono do restaurante.

Decisão registrada na [ADR-007](adr/ADR-007-dono-do-restaurante.md).

## Partes 2, 3 e 4 — Upload de imagens com serviço compartilhado

| Endpoint | Módulo | O que faz |
|---|---|---|
| `POST /auth/me/image` 🔒 | auth | Foto de perfil do **usuário do token** |
| `POST /dishes/:dishId/image` 🔒 | dishes | Foto do prato (apenas para o dono do restaurante) |
| `GET /auth/me` 🔒 | auth | Retorna o usuário com `imageUrl` |
| `GET /restaurants/:restaurantId/dishes` | dishes | Retorna o cardápio com `imageUrl` de cada prato |

Os dois uploads passam pelos **mesmos** componentes de `src/modules/shared/`:

- `upload.middleware.js` (Multer): recebe o arquivo em memória, limita a 5 MB e aceita JPEG, PNG e WebP.
- `image.service.js` (Sharp): `optimizeImage(buffer, tipo)` otimiza e salva; `removeImage(url)` apaga a imagem antiga quando ela é substituída.

O módulo só informa o **tipo** de imagem, e o serviço aplica a predefinição correspondente:

| Tipo | Pasta | Transformação |
|---|---|---|
| `dishes` | `uploads/dishes/` | Até 800 px de largura, sem cortar, WebP qualidade 80 |
| `users` | `uploads/users/` | Quadrada 400 × 400, recortada no centro, WebP qualidade 80 |

Para adicionar logotipos de restaurante no futuro, basta incluir um novo tipo em `PRESETS`. Nenhum outro módulo precisa mudar.

A foto de perfil é sempre associada ao usuário identificado pelo JWT (`req.user.id`, preenchido pelo `auth.middleware.js`). A rota não recebe nenhum id de usuário, então ninguém consegue trocar a foto de outra pessoa.

## Parte 5 — Testes realizados

| Teste | Resultado esperado | Resultado obtido |
|---|---|---|
| Cadastrar um prato (sem imagem) | `201 Created` | ✅ 201, `imageUrl: null` |
| Cadastrar prato em restaurante de outro usuário | `403 Forbidden` | ✅ 403 |
| Enviar foto para o perfil autenticado | Imagem vinculada ao usuário | ✅ 200, `imageUrl: /uploads/users/....webp` |
| Enviar foto para um prato | Imagem vinculada ao prato | ✅ 200, `imageUrl: /uploads/dishes/....webp` |
| Consultar os dados atualizados | Caminho da imagem retornado | ✅ `GET /auth/me` e `GET /restaurants/1/dishes` trazem o `imageUrl` |
| Acessar a URL da imagem | Imagem exibida | ✅ 200, `image/webp` |
| Enviar imagem sem JWT (perfil e prato) | `401 Unauthorized` | ✅ 401 "Token não fornecido" |
| Enviar arquivo inválido (`.txt`) | Erro HTTP adequado | ✅ 400 "Formato de imagem não permitido" |
| Enviar imagem corrompida | Erro HTTP adequado | ✅ 400 "Arquivo de imagem inválido ou corrompido" |
| Enviar imagem acima de 5 MB | Erro HTTP adequado | ✅ 413 "Imagem maior que o limite de 5 MB" |
| Enviar requisição sem arquivo | Erro HTTP adequado | ✅ 400 "Nenhuma imagem enviada" |
| Enviar imagem para prato inexistente | `404 Not Found` | ✅ 404 |
| Trocar a foto de perfil | Foto antiga removida | ✅ arquivo anterior apagado de `uploads/users/` |
| Funcionalidades anteriores | Continuam funcionando | ✅ restaurantes, login, e-mail e cardápio |

Exemplo de otimização registrado no terminal (mesma imagem original nos dois módulos):

```
[IMAGEM:users]  original: jpeg 2400x1600 441.9 KB -> otimizada: webp 400x400 10.3 KB
[IMAGEM:dishes] original: jpeg 2400x1600 441.9 KB -> otimizada: webp 800x533 20.8 KB
```

## Parte 6 — Pense como arquiteto

**Por que faz sentido reutilizar o mesmo serviço de imagens?**
Porque a regra é a mesma: receber um arquivo, validar, otimizar com Sharp e salvar. Se cada módulo tivesse sua própria cópia, uma correção (por exemplo, tratar imagens corrompidas) teria de ser feita em vários lugares, e as cópias acabariam diferentes entre si. Com um serviço só, perfil e pratos ganham juntos qualquer melhoria, e trocar o armazenamento local por S3 no futuro significa mudar um único arquivo.

**Qual é a responsabilidade do Controller e qual é a do Service?**
O Controller fala HTTP: lê `req.params`, `req.file` e `req.user`, chama o Service e converte o resultado (ou o erro) em status e JSON. O Service contém a regra de negócio: verifica se o prato existe, se o usuário é o dono, otimiza a imagem e atualiza o banco. O Service não conhece `req` nem `res`, por isso pode ser reutilizado e testado sem um servidor HTTP.

**Por que não devemos implementar o processamento diretamente nas rotas?**
As rotas só devem dizer qual caminho leva a qual função, e com quais middlewares. Colocar Sharp, Prisma e validações ali misturaria responsabilidades, duplicaria código entre rotas parecidas e deixaria o arquivo difícil de ler e manter. Além disso, a lógica ficaria presa ao Express.

**Como o middleware de autenticação protege a alteração da imagem de perfil?**
O `auth.middleware.js` roda antes do Multer. Sem um JWT válido, a requisição para ali com 401, e o arquivo nem chega a ser recebido. Com um token válido, o middleware coloca em `req.user` o id que está assinado dentro do token. A rota `POST /auth/me/image` não aceita nenhum id na URL ou no corpo: ela usa somente `req.user.id`. Como o token é assinado com o `JWT_SECRET`, o usuário não consegue forjar o id de outra pessoa.

**O que deve acontecer se o processamento de uma imagem falhar?**
A API deve responder com um erro claro (400 para arquivo inválido, 413 para arquivo grande demais) sem derrubar o servidor, e nada no banco deve mudar: o prato ou o usuário continua com a imagem anterior, ou sem imagem. O prato já cadastrado **não** deve ser excluído, porque o upload é uma operação secundária e o usuário pode tentar de novo. No nosso código, o banco só é atualizado depois que o Sharp termina com sucesso, e a imagem antiga só é apagada depois que a nova já foi salva.

**Nossa arquitetura atual permite adicionar novas funcionalidades sem modificar toda a aplicação?**
Sim. A foto de perfil foi adicionada mexendo apenas no módulo `auth` (rota, controller e service), no schema e em uma linha de configuração do `image.service.js`. Restaurantes, pratos e e-mail não foram alterados. O mesmo vale para a correção do professor: a regra de dono ficou em `restaurant.service.js` e foi reutilizada pelos pratos. Continuamos um monólito, mas um monólito modular, em que cada funcionalidade nova é um módulo ou uma extensão de um serviço compartilhado.
