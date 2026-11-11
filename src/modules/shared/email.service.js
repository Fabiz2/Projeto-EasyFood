const { Resend } = require("resend");

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

  if (provider === "sendpulse" && (!email || email.endsWith("@resend.dev"))) {
    email = process.env.EMAIL_TEST_TO;
  }
  if (provider === "resend" && !email) {
    email = "onboarding@resend.dev";
  }

  return { name, email };
}

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
        html: Buffer.from(html, "utf8").toString("base64"),
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
