# Autenticação

## Pesquisa

### JWT
- Vantagens: leve, simples, sem dependência de provider externo, fácil de integrar em APIs REST.
- Desvantagens: exige implementação própria de refresh token, logout e armazenamento seguro do segredo.

### AWS Cognito
- Vantagens: oferece fluxo completo de autenticação e autorização, gestão de usuários e integrações com AWS.
- Desvantagens: mais complexo, mais caro e mais pesado para o estágio atual da EasyFood.

### Login Google
- Vantagens: reduz atrito para o usuário e acelera onboarding.
- Desvantagens: depende de provider externo e não resolve sozinho o contexto de produto e permissões internas.

### Outra opção
- Autenticação por sessão/local + JWT é uma alternativa simples, mas, para este momento, o JWT continua sendo a melhor escolha para uma API pequena.

## Escolha

A solução escolhida é JWT.

### Por que JWT neste contexto
- A EasyFood está em uma fase inicial com API simples e foco em cadastro e listagem de restaurantes.
- O objetivo agora é manter a arquitetura enxuta e reduzir complexidade operacional.
- JWT permite autenticar usuários rapidamente sem a dependência de um provedor externo ou infraestrutura adicional.
- O time consegue evoluir a autenticação depois com refresh token e regras de autorização, sem reescrever a base do projeto.

### Trade-offs da alternativa
- AWS Cognito e Google exigiriam mais configuração, integração e manutenção, o que vai além do que a EasyFood precisa neste momento.
- JWT exige cuidado no armazenamento do segredo e na gestão de expiração, mas o custo de implementação e operação é menor para o contexto atual.
