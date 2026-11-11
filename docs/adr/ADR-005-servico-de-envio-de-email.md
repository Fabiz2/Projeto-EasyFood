# ADR-005 — Serviço compartilhado de envio de e-mail

| Campo       | Valor                          |
|-------------|--------------------------------|
| **Status**  | Aceito                         |
| **Data**    | 2026-11-11                     |
| **Autores** | Equipe de Engenharia EasyFood  |

---

## Contexto

Quando um restaurante se cadastra, a EasyFood precisa avisar o próprio restaurante (boas-vindas) e o time comercial (novo cadastro). Outros módulos, como o de autenticação, também devem precisar enviar e-mails no futuro (confirmação de conta, recuperação de senha).

Se cada módulo falasse diretamente com o provedor de e-mail, a integração ficaria espalhada e qualquer troca de provedor exigiria mudanças em vários lugares.

## Alternativas consideradas

| # | Opção | Observação |
|---|-------|------------|
| 1 | SendPulse | Plano gratuito de SMTP, API REST com chave estática, painel em português |
| 2 | Resend | SDK simples, plano gratuito, permite testar sem configurar domínio |
| 3 | MailerSend | Exemplo da aula; exige verificação de domínio |
| 4 | Brevo / SendGrid | Mais recursos de marketing, configuração mais longa |
| 5 | SMTP com Nodemailer | Funciona com qualquer servidor, mas exige credenciais SMTP e é mais lento |

## Decisão

Criar `src/modules/shared/email.service.js` com uma função genérica:

```js
sendEmail({ to, toName, subject, header, body, footer })
```

O provedor escolhido é o **SendPulse** (API `POST /smtp/emails`, com o HTML enviado em Base64). A chave e o remetente ficam no `.env` (`EMAIL_API_KEY`, `EMAIL_FROM`, `EMAIL_FROM_NAME`).

O serviço também suporta o Resend: o provedor é detectado pelo prefixo da chave (`sp_` para SendPulse, `re_` para Resend) ou definido em `EMAIL_PROVIDER`. Trocar de provedor não exige mudar nenhum outro arquivo da aplicação.

O envio é tratado como **ação secundária**: no `restaurant.service.js`, o restaurante é salvo primeiro e cada envio fica dentro de um `try/catch`.

## Justificativa

- **Reutilização:** o mesmo `sendEmail()` envia o e-mail de boas-vindas e a notificação para o comercial, com conteúdos diferentes.
- **Isolamento:** só o `email.service.js` conhece o provedor. Na prática, trocamos do Resend para o SendPulse alterando apenas esse arquivo.
- **Resiliência:** uma falha no provedor externo não faz o cadastro falhar.
- **Custo zero:** o plano gratuito do SendPulse atende o volume de testes do projeto, e o e-mail da própria conta já serve como remetente.

## Consequências

### Positivas
- Integração centralizada em um único serviço.
- Cadastro de restaurante independente da disponibilidade do provedor.
- Sem chave configurada, o serviço apenas registra o aviso no terminal, e a API continua funcionando em desenvolvimento.

### Negativas / trade-offs
- O envio é síncrono dentro da requisição: se o provedor demorar, o `POST /restaurants` demora junto.
- E-mails que falham não são reenviados (não há fila nem retry).
- Dependência de um serviço externo e de sua chave de API.

## Teste de falha realizado

Com uma chave inválida, o `POST /restaurants` retornou **201 Created**, o terminal registrou `Erro ao enviar e-mail: API key is invalid` e o restaurante continuou salvo no banco.

Com a chave correta do SendPulse, o terminal registrou `[EMAIL] Enviado via sendpulse` para os dois e-mails (boas-vindas e comercial).

## Critérios de revisão

- O volume de e-mails crescer a ponto de impactar o tempo de resposta da API: avaliar fila (ex.: BullMQ, SQS).
- Surgir necessidade de reenvio garantido.
- Mudança de custo ou limites do plano do provedor.
