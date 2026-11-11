// EasyFood — front-end
// A página é servida pelo próprio Express, então a API fica na mesma origem.
const API_URL = "";

const estado = {
  restaurantes: [],
  selecionado: null,
  token: localStorage.getItem("easyfood_token"),
  usuario: JSON.parse(localStorage.getItem("easyfood_user") || "null"),
  modoCadastro: false,
  pratoFotoId: null
};

const $ = (sel) => document.querySelector(sel);

const listaEl = $("#restaurantes");
const folhaEl = $("#folha");
const contaEl = $("#conta");
const recadoEl = $("#recado");

const dlgConta = $("#dlg-conta");
const dlgRestaurante = $("#dlg-restaurante");
const dlgPrato = $("#dlg-prato");
const dlgFoto = $("#dlg-foto");

const formatoPreco = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const formatoNota = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

// ---------- utilidades ----------

function escapeHtml(valor) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

let recadoTimer;
function recado(texto) {
  recadoEl.textContent = texto;
  recadoEl.classList.add("visivel");
  clearTimeout(recadoTimer);
  recadoTimer = setTimeout(() => recadoEl.classList.remove("visivel"), 3500);
}

async function api(caminho, { method = "GET", body, auth = false } = {}) {
  const headers = {};
  let payload = body;

  if (body && !(body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  if (auth && estado.token) {
    headers.Authorization = `Bearer ${estado.token}`;
  }

  const resposta = await fetch(`${API_URL}${caminho}`, { method, headers, body: payload });
  const dados = await resposta.json().catch(() => ({}));

  if (resposta.status === 401 && auth) {
    sair(false);
    throw new Error("Sua sessão expirou. Entre novamente.");
  }

  if (!resposta.ok) {
    throw new Error(dados.error || `Erro ${resposta.status}`);
  }

  return dados;
}

function erroDoForm(form, texto) {
  form.querySelector(".erro").textContent = texto || "";
}

function travarForm(form, travado) {
  form.querySelectorAll("button").forEach((b) => (b.disabled = travado));
}

// ---------- conta ----------

function renderConta() {
  const logado = Boolean(estado.token);
  document.body.classList.toggle("logado", logado);

  if (logado) {
    const nome = estado.usuario?.name || estado.usuario?.email || "você";
    contaEl.innerHTML = `
      <button type="button" class="avatar-botao" id="btn-perfil" title="Alterar foto de perfil">
        ${avatarHtml(estado.usuario)}
        <span class="conta-nome">Olá, <strong>${escapeHtml(nome)}</strong></span>
      </button>
      <button type="button" class="btn btn-claro btn-pequeno" id="btn-sair">Sair</button>
    `;
    $("#btn-sair").addEventListener("click", () => sair());
    $("#btn-perfil").addEventListener("click", abrirPerfil);
  } else {
    contaEl.innerHTML = `<button type="button" class="btn btn-claro" id="btn-entrar">Entrar</button>`;
    $("#btn-entrar").addEventListener("click", abrirConta);
  }
}

function iniciais(nome) {
  return (nome || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0].toUpperCase())
    .join("");
}

function avatarHtml(usuario, classe = "") {
  const conteudo = usuario?.imageUrl
    ? `<img src="${escapeHtml(usuario.imageUrl)}" alt="" />`
    : escapeHtml(iniciais(usuario?.name));
  return `<span class="avatar ${classe}" aria-hidden="true">${conteudo}</span>`;
}

function salvarUsuario(user) {
  estado.usuario = user;
  localStorage.setItem("easyfood_user", JSON.stringify(user));
}

// Atualiza os dados do usuário (inclusive a foto) a partir da API
async function carregarPerfil() {
  if (!estado.token) return;
  try {
    const { user } = await api("/auth/me", { auth: true });
    salvarUsuario(user);
    renderConta();
    renderCardapio();
  } catch {
    // token inválido: api() já fez logout
  }
}

function abrirPerfil() {
  const form = $("#form-perfil");
  form.reset();
  erroDoForm(form);
  $("#perfil-avatar").outerHTML = avatarHtml(estado.usuario, "avatar-grande").replace('class="avatar', 'id="perfil-avatar" class="avatar');
  $("#perfil-nome").textContent = estado.usuario?.name || "";
  $("#perfil-email").textContent = estado.usuario?.email || "";
  $("#dlg-perfil").showModal();
}

$("#form-perfil").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const arquivo = form.image.files[0];

  if (!arquivo) return erroDoForm(form, "Escolha uma foto.");
  if (arquivo.size > 5 * 1024 * 1024) return erroDoForm(form, "A foto passa de 5 MB. Escolha uma menor.");

  travarForm(form, true);
  try {
    const dados = new FormData();
    dados.append("image", arquivo);
    const user = await api("/auth/me/image", { method: "POST", body: dados, auth: true });
    salvarUsuario(user);
    $("#dlg-perfil").close();
    renderConta();
    recado("Foto de perfil salva.");
  } catch (erro) {
    erroDoForm(form, erro.message);
  } finally {
    travarForm(form, false);
  }
});

// O dono do restaurante é quem pode editar o cardápio (restaurantes antigos sem dono: qualquer um logado)
function podeEditar(restaurante) {
  if (!estado.token || !restaurante) return false;
  return !restaurante.ownerId || restaurante.ownerId === estado.usuario?.id;
}

function sair(avisar = true) {
  estado.token = null;
  estado.usuario = null;
  localStorage.removeItem("easyfood_token");
  localStorage.removeItem("easyfood_user");
  renderConta();
  renderCardapio();
  if (avisar) recado("Você saiu da sua conta.");
}

function definirModoConta(cadastro) {
  estado.modoCadastro = cadastro;
  $("#conta-titulo").textContent = cadastro ? "Criar conta" : "Entrar";
  $("#conta-sub").textContent = cadastro
    ? "Crie sua conta para cadastrar restaurantes e pratos."
    : "Entre para cadastrar restaurantes e pratos.";
  $("#conta-enviar").textContent = cadastro ? "Criar conta" : "Entrar";
  $("#conta-alternar").textContent = cadastro ? "Já tenho conta" : "Ainda não tenho conta";
  $("#campo-nome").hidden = !cadastro;
  $("#form-conta").password.autocomplete = cadastro ? "new-password" : "current-password";
}

function abrirConta() {
  const form = $("#form-conta");
  form.reset();
  erroDoForm(form);
  definirModoConta(false);
  dlgConta.showModal();
}

$("#conta-alternar").addEventListener("click", () => {
  erroDoForm($("#form-conta"));
  definirModoConta(!estado.modoCadastro);
});

$("#form-conta").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const name = form.name.value.trim();
  const email = form.email.value.trim();
  const password = form.password.value;

  if (estado.modoCadastro && !name) return erroDoForm(form, "Informe seu nome.");
  if (!email || !password) return erroDoForm(form, "Informe e-mail e senha.");
  if (estado.modoCadastro && password.length < 6) {
    return erroDoForm(form, "A senha precisa ter pelo menos 6 caracteres.");
  }

  erroDoForm(form);
  travarForm(form, true);

  try {
    if (estado.modoCadastro) {
      await api("/auth/register", { method: "POST", body: { name, email, password } });
    }

    const { token, user } = await api("/auth/login", { method: "POST", body: { email, password } });

    estado.token = token;
    localStorage.setItem("easyfood_token", token);
    salvarUsuario(user);

    dlgConta.close();
    renderConta();
    renderCardapio();
    recado(estado.modoCadastro ? `Conta criada. Bem-vindo, ${user.name}!` : `Bem-vindo de volta, ${user.name}!`);
  } catch (erro) {
    erroDoForm(form, erro.message);
  } finally {
    travarForm(form, false);
  }
});

// ---------- restaurantes ----------

function renderLista() {
  if (!estado.restaurantes.length) {
    listaEl.innerHTML = `<li class="aviso">Nenhum restaurante cadastrado ainda. Entre na sua conta para cadastrar o primeiro.</li>`;
    return;
  }

  listaEl.innerHTML = estado.restaurantes
    .map((r) => {
      const pratos = r._count?.dishes ?? 0;
      const atual = estado.selecionado?.id === r.id;
      return `
        <li>
          <button type="button" class="restaurante-item" data-id="${r.id}" aria-current="${atual}">
            <span class="restaurante-nome">${escapeHtml(r.name)}</span>
            <span class="restaurante-nota" title="Avaliação">${formatoNota.format(Number(r.rating || 0))} ★</span>
            <span class="restaurante-info">${escapeHtml(r.category || "Sem categoria")}, ${pratos} ${pratos === 1 ? "prato" : "pratos"}</span>
          </button>
        </li>`;
    })
    .join("");
}

listaEl.addEventListener("click", (evento) => {
  const botao = evento.target.closest(".restaurante-item");
  if (!botao) return;
  selecionarRestaurante(Number(botao.dataset.id));
});

async function carregarRestaurantes() {
  try {
    estado.restaurantes = await api("/restaurants");
    if (estado.selecionado) {
      estado.selecionado = estado.restaurantes.find((r) => r.id === estado.selecionado.id) || null;
    }
    renderLista();
  } catch (erro) {
    listaEl.innerHTML = `<li class="aviso">Não foi possível carregar os restaurantes: ${escapeHtml(erro.message)}. Confira se o servidor está rodando.</li>`;
  }
}

$("#btn-novo-restaurante").addEventListener("click", () => {
  const form = $("#form-restaurante");
  form.reset();
  erroDoForm(form);
  dlgRestaurante.showModal();
});

$("#form-restaurante").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const name = form.name.value.trim();
  const category = form.category.value.trim();
  const rating = form.rating.value === "" ? undefined : Number(form.rating.value);

  if (!name || !category) return erroDoForm(form, "Nome e categoria são obrigatórios.");
  if (rating !== undefined && (rating < 0 || rating > 5)) {
    return erroDoForm(form, "A avaliação vai de 0 a 5.");
  }

  travarForm(form, true);
  try {
    const novo = await api("/restaurants", { method: "POST", body: { name, category, rating }, auth: true });
    dlgRestaurante.close();
    await carregarRestaurantes();
    await selecionarRestaurante(novo.id);
    recado(`${novo.name} cadastrado.`);
  } catch (erro) {
    erroDoForm(form, erro.message);
  } finally {
    travarForm(form, false);
  }
});

async function excluirRestaurante() {
  const r = estado.selecionado;
  if (!r) return;
  if (!confirm(`Excluir ${r.name} e todo o cardápio? Essa ação não pode ser desfeita.`)) return;

  try {
    await api(`/restaurants/${r.id}`, { method: "DELETE", auth: true });
    estado.selecionado = null;
    estado.pratos = [];
    await carregarRestaurantes();
    renderCardapio();
    recado(`${r.name} excluído.`);
  } catch (erro) {
    recado(erro.message);
  }
}

// ---------- cardápio ----------

async function selecionarRestaurante(id) {
  estado.selecionado = estado.restaurantes.find((r) => r.id === id) || null;
  renderLista();

  if (!estado.selecionado) return renderCardapio();

  folhaEl.innerHTML = `<div class="folha-vazia"><p>Carregando cardápio…</p></div>`;
  try {
    estado.pratos = await api(`/restaurants/${id}/dishes`);
  } catch (erro) {
    estado.pratos = [];
    recado(erro.message);
  }
  renderCardapio();

  if (window.matchMedia("(max-width: 760px)").matches) {
    folhaEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function renderCardapio() {
  const r = estado.selecionado;

  if (!r) {
    folhaEl.innerHTML = `
      <div class="folha-vazia">
        <h2>Escolha um restaurante</h2>
        <p>Clique em um restaurante da lista para ver o cardápio.</p>
      </div>`;
    return;
  }

  const pratos = estado.pratos || [];

  const itens = pratos.length
    ? `<ul class="pratos">${pratos.map(renderPrato).join("")}</ul>`
    : `<p class="cardapio-vazio">Este restaurante ainda não tem pratos no cardápio.</p>`;

  folhaEl.innerHTML = `
    <header class="cardapio-topo">
      <h2>${escapeHtml(r.name)}</h2>
      <p>${escapeHtml(r.category || "Sem categoria")}, avaliação ${formatoNota.format(Number(r.rating || 0))} de 5</p>
      ${podeEditar(r) ? `
      <div class="cardapio-acoes">
        <button type="button" class="btn btn-carimbo btn-pequeno" data-acao="novo-prato">Adicionar prato</button>
        <button type="button" class="btn btn-claro btn-pequeno btn-excluir" data-acao="excluir">Excluir restaurante</button>
      </div>` : ""}
    </header>
    ${itens}
  `;
}

function renderPrato(p) {
  const foto = p.imageUrl
    ? `<img class="prato-foto" src="${escapeHtml(p.imageUrl)}" alt="Foto de ${escapeHtml(p.name)}" loading="lazy" width="112" height="112" />`
    : `<div class="prato-foto prato-sem-foto" aria-hidden="true">sem foto</div>`;

  return `
    <li class="prato">
      ${foto}
      <div>
        <div class="prato-linha">
          <span class="prato-nome">${escapeHtml(p.name)}</span>
          <span class="prato-preco">${formatoPreco.format(Number(p.price))}</span>
        </div>
        <p class="prato-descricao">${escapeHtml(p.description)}</p>
        ${podeEditar(estado.selecionado) ? `
        <div class="prato-acoes">
          <button type="button" class="link" data-acao="foto" data-id="${p.id}">
            ${p.imageUrl ? "Trocar foto" : "Enviar foto"}
          </button>
        </div>` : ""}
      </div>
    </li>`;
}

folhaEl.addEventListener("click", (evento) => {
  const botao = evento.target.closest("[data-acao]");
  if (!botao) return;

  const acao = botao.dataset.acao;
  if (acao === "novo-prato") abrirNovoPrato();
  if (acao === "excluir") excluirRestaurante();
  if (acao === "foto") abrirFoto(Number(botao.dataset.id));
});

function abrirNovoPrato() {
  const form = $("#form-prato");
  form.reset();
  erroDoForm(form);
  $("#prato-sub").textContent = `Cardápio de ${estado.selecionado.name}.`;
  dlgPrato.showModal();
}

$("#form-prato").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const name = form.name.value.trim();
  const description = form.description.value.trim();
  const price = Number(form.price.value);
  const arquivo = form.image.files[0];

  if (!name || !description) return erroDoForm(form, "Nome e descrição são obrigatórios.");
  if (!(price > 0)) return erroDoForm(form, "Informe um preço maior que zero.");
  if (arquivo && arquivo.size > 5 * 1024 * 1024) return erroDoForm(form, "A foto passa de 5 MB. Escolha uma menor.");

  travarForm(form, true);
  const restauranteId = estado.selecionado.id;

  try {
    const prato = await api(`/restaurants/${restauranteId}/dishes`, {
      method: "POST",
      body: { name, description, price },
      auth: true
    });

    let aviso = `${prato.name} adicionado ao cardápio.`;

    if (arquivo) {
      try {
        await enviarFoto(prato.id, arquivo);
      } catch (erro) {
        // O prato continua salvo mesmo se a foto falhar
        aviso = `${prato.name} adicionado, mas a foto não foi enviada: ${erro.message}`;
      }
    }

    dlgPrato.close();
    await carregarRestaurantes();
    await selecionarRestaurante(restauranteId);
    recado(aviso);
  } catch (erro) {
    erroDoForm(form, erro.message);
  } finally {
    travarForm(form, false);
  }
});

function enviarFoto(pratoId, arquivo) {
  const dados = new FormData();
  dados.append("image", arquivo);
  return api(`/dishes/${pratoId}/image`, { method: "POST", body: dados, auth: true });
}

function abrirFoto(pratoId) {
  const prato = (estado.pratos || []).find((p) => p.id === pratoId);
  if (!prato) return;
  estado.pratoFotoId = pratoId;
  const form = $("#form-foto");
  form.reset();
  erroDoForm(form);
  $("#foto-sub").textContent = prato.name;
  dlgFoto.showModal();
}

$("#form-foto").addEventListener("submit", async (evento) => {
  evento.preventDefault();
  const form = evento.target;
  const arquivo = form.image.files[0];

  if (!arquivo) return erroDoForm(form, "Escolha uma foto.");
  if (arquivo.size > 5 * 1024 * 1024) return erroDoForm(form, "A foto passa de 5 MB. Escolha uma menor.");

  travarForm(form, true);
  try {
    await enviarFoto(estado.pratoFotoId, arquivo);
    dlgFoto.close();
    await selecionarRestaurante(estado.selecionado.id);
    recado("Foto enviada.");
  } catch (erro) {
    erroDoForm(form, erro.message);
  } finally {
    travarForm(form, false);
  }
});

// ---------- janelas ----------

document.querySelectorAll("[data-fechar]").forEach((botao) => {
  botao.addEventListener("click", () => botao.closest("dialog").close());
});

// fecha clicando fora da janela
document.querySelectorAll("dialog").forEach((dlg) => {
  dlg.addEventListener("click", (evento) => {
    if (evento.target === dlg) dlg.close();
  });
});

// ---------- início ----------

renderConta();
carregarRestaurantes();
carregarPerfil();
