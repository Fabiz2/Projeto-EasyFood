# ADR-001 — Armazenar restaurantes em memória

## Status
Aceita (substituída pela [ADR-002](ADR-002-persistencia-com-mysql.md))

## Data
20/08/2026

## Responsável
Felipe Padrinho — Arquiteto de Software, FECAF

## Contexto

Primeira versão da API da EasyFood. Ela precisa devolver uma lista de restaurantes para consulta e permitir o cadastro de novos restaurantes.

O produto está em fase de prototipação, teste e validação. A prioridade é validar o fluxo e apresentar a ideia para investidores de forma rápida e simples.

## Alternativas consideradas

1. Array em memória
2. PostgreSQL
3. MongoDB
4. SQLite
5. Firebase
6. Arquivo JSON

## Decisão

Adotar um array em memória como mecanismo de armazenamento na versão inicial do serviço.

## Justificativa

- Praticidade e velocidade no desenvolvimento e nos testes da API.
- Menor complexidade.
- Nenhum custo de infraestrutura nesta fase.

## Consequências

### Positivas

- Desenvolvemos e testamos rapidamente.
- Conseguimos comprovar o conceito de negócio.

### Negativas

- Os dados são perdidos quando o servidor reinicia.
- Não suporta compartilhamento nem análise de dados.
- Não funciona com mais de uma instância da aplicação.
- Não há integridade de dados.

## Critérios de revisão

Esta decisão deve ser reavaliada quando:

1. O MVP for validado e houver decisão de ir para produção.
2. Houver necessidade de persistência entre reinicializações e deploys.
3. O volume de dados ultrapassar o que é razoável manter em memória.
4. For necessário suporte a consultas complexas ou relacionamentos entre entidades.

## Notas

- O acesso aos dados (`push`, `filter`, `find`) deve ficar concentrado, para que a migração futura para um banco exija poucas alterações nas rotas.
- A escolha do banco definitivo deve gerar a ADR-002 antes da entrada em produção.
- **Teste de reinicialização realizado:** um restaurante cadastrado via `POST /restaurants` desapareceu após `Ctrl + C` e `node server.js`, confirmando a limitação.
