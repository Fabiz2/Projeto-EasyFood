# ADR-007 — Restaurante com dono e autorização por propriedade

| Campo       | Valor                          |
|-------------|--------------------------------|
| **Status**  | Aceito                         |
| **Data**    | 2026-11-11                     |
| **Autores** | Equipe de Engenharia EasyFood  |

---

## Contexto

Até a Atividade 7, o JWT só provava que o usuário estava **autenticado**. Qualquer usuário logado podia cadastrar pratos, enviar fotos e até excluir restaurantes de outras pessoas. A própria Atividade 7 já apontava isso: verificar se o usuário tem **autorização** para alterar o cardápio de um restaurante seria uma evolução.

Na Atividade 8, o repositório do professor (commit `70e459e`) trouxe essa correção: o restaurante passa a ter um dono, e só o dono gerencia o cardápio.

## Alternativas consideradas

| # | Opção | Observação |
|---|-------|------------|
| 1 | Manter apenas autenticação | Simples, mas permite alterar dados de outros usuários |
| 2 | `ownerId` no restaurante + verificação no service | Resolve o caso atual com uma coluna e uma função |
| 3 | Papéis (admin, dono, cliente) com tabela de permissões | Mais flexível, mas é complexidade que o projeto ainda não precisa |

## Decisão

- Adicionar `Restaurant.ownerId`, preenchido com o id do usuário do token (`req.user.id`) no cadastro.
- Criar `ensureOwnership(restaurant, userId)` em `restaurant.service.js`, que responde **403** quando o usuário não é o dono.
- Usar essa verificação no cadastro de pratos, no upload de foto do prato e na exclusão do restaurante.
- A consulta (restaurantes e cardápios) continua pública.

**Diferença em relação ao repositório do professor:** no nosso schema, `ownerId` é **opcional** e a migration atribui os restaurantes existentes ao primeiro usuário. Um `NOT NULL` direto falharia em bancos que já têm restaurantes. Restaurantes sem dono continuam editáveis por qualquer usuário logado, então nada que já funcionava quebra.

## Justificativa

- **Segurança:** fecha a brecha de um usuário alterar dados de outro.
- **Origem confiável:** o dono vem do token assinado, nunca do corpo da requisição.
- **Regra no lugar certo:** quem é dono é uma regra do domínio de restaurantes, por isso fica no `restaurant.service.js` e é reutilizada pelo módulo de pratos.
- **Mudança pequena:** uma coluna, uma função e três pontos de uso.

## Consequências

### Positivas
- Separação clara entre autenticação (401, quem é você) e autorização (403, você pode fazer isso).
- O front-end mostra os botões de edição apenas para o dono.

### Negativas / trade-offs
- Um restaurante tem só um dono: não há como uma equipe gerenciar o mesmo restaurante.
- O módulo de pratos passa a depender do service de restaurantes.
- Não existe um administrador capaz de moderar qualquer restaurante.

## Critérios de revisão

- Surgir a necessidade de vários usuários gerenciarem o mesmo restaurante: avaliar uma tabela de membros com papéis.
- Surgir a necessidade de um administrador da plataforma.
