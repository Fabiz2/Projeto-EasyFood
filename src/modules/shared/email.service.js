const { Resend } = require("resend");

// Serviço compartilhado de e-mail.
// O resto da EasyFood conhece apenas sendEmail(); o provedor fica escondido aqui.
// Provedores suportados: SendPulse (chave "sp_...") e Resend (chave "re_...").
// A chave e o remetente ficam no .env, nunca no código.

const apiKey = process.env.EMAIL_API_KEY || "";
const provider = (process.env.EMAIL_PROVIDER || detectProvider(apiKey)).toLowerCase();

function detectProvider(key) {
  if (key.startsWith("sp_")) return "sendpulse";
  if (key.startsWith("re_")) return "resend";
  return "nenhum";
}

function buildHtml({ header, body, footer }) {
  return `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>${header}</h2>
      <div>${body}</div>
      <hr />
      <p style="color: #888; font-size: 12px;">
        ${footer}
      </p>
    </div>
  `;
}

function htmlToText(html) {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/[ \t]+/g, " ").trim();
}

function remetente() {
  const name = process.env.EMAIL_FROM_NAME || "EasyFood";
  let email = process.env.EMAIL_FROM || "";

  // O remetente de teste do Resend não existe no SendPulse:
  // nesse caso usa o e-mail da própria conta (EMAIL_TEST_TO), que já é um remetente válido.
  if (provider === "sendpulse" && (!email || email.endsWith("@resend.dev"))) {
    email = process.env.EMAIL_TEST_TO;
  }
  if (provider === "resend" && !email) {
    email = "onboarding@resend.dev";
  }

  return { name, email };
}

// ---------- SendPulse ----------
// Docs: https://sendpulse.com/integrations/api/smtp (POST /smtp/emails)
async function sendWithSendPulse({ to, toName, subject, html, text }) {
  const from = remetente();

  const response = await fetch("https://api.sendpulse.com/smtp/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      email: {
        subject,
        from,
        to: [{ email: to, name: toName || to }],
        html: Buffer.from(html, "utf8").toString("base64"), // o SendPulse exige HTML em Base64
        text
      }
    })
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.result === false) {
    const motivo = data.message || data.error_description || data.error || `HTTP ${response.status}`;
    throw new Error(`SendPulse recusou o envio: ${motivo}`);
  }
}

// ---------- Resend ----------
// Docs: https://resend.com/docs
async function sendWithResend({ to, subject, html, text }) {
  const resend = new Resend(apiKey);
  const from = remetente();

  const { error } = await resend.emails.send({
    from: `${from.name} <${from.email}>`,
    to: [to],
    subject,
    html,
    text
  });

  if (error) {
    throw new Error(`Resend recusou o envio: ${error.message}`);
  }
}

async function sendEmail({ to, toName, subject, header, body, footer }) {
  if (!to) {
    throw new Error("Destinatário não informado (configure EMAIL_TEST_TO no .env)");
  }

  if (provider === "nenhum") {
    // Sem chave configurada: registra no terminal em vez de enviar
    console.warn(`[EMAIL] EMAIL_API_KEY ausente: e-mail não enviado para ${to} - "${subject}"`);
    return;
  }

  const html = buildHtml({ header, body, footer });
  const text = `${header}\n\n${htmlToText(body)}\n\n${footer}`;

  if (provider === "sendpulse") {
    await sendWithSendPulse({ to, toName, subject, html, text });
  } else if (provider === "resend") {
    await sendWithResend({ to, subject, html, text });
  } else {
    throw new Error(`Provedor de e-mail desconhecido: ${provider}`);
  }

  console.log(`[EMAIL] Enviado via ${provider} para ${toName || to} <${to}> - "${subject}"`);
}

module.exports = {
  sendEmail
};
