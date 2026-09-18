const API_URL = "http://localhost:3000";

const restaurantList = document.getElementById("restaurant-list");
const restaurantForm = document.getElementById("restaurant-form");
const nameInput = document.getElementById("name");
const categoryInput = document.getElementById("category");
const ratingInput = document.getElementById("rating");
const authForm = document.getElementById("auth-form");
const authNameInput = document.getElementById("auth-name");
const authEmailInput = document.getElementById("auth-email");
const authPasswordInput = document.getElementById("auth-password");
const registerButton = document.getElementById("register-button");
const loginButton = document.getElementById("login-button");
const message = document.getElementById("message");
const loadingWrap = document.getElementById("loading-wrap");
const refreshButton = document.getElementById("refresh-button");
const restaurantCount = document.getElementById("restaurant-count");
const usersPanel = document.getElementById("users-panel");
const restaurantsPanel = document.getElementById("restaurants-panel");
const tabButtons = document.querySelectorAll(".tab-button");

function showMessage(type, text) {
  message.className = `message show ${type}`;
  message.textContent = text;
}

function clearMessage() {
  message.className = "message";
  message.textContent = "";
}

function showLoading(visible) {
  loadingWrap.classList.toggle("visible", visible);
}

function setActiveTab(tab) {
  tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });

  const shouldShowUsers = tab === "users";
  usersPanel.classList.toggle("hidden-panel", !shouldShowUsers);
  restaurantsPanel.classList.toggle("hidden-panel", shouldShowUsers);
}

function getAuthHeaders() {
  const headers = { "Content-Type": "application/json" };
  const token = localStorage.getItem("easyfood_token");

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

function renderRestaurants(restaurants) {
  restaurantList.innerHTML = "";

  if (!restaurants.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `<span class="empty-icon">🍽️</span><p>Sem restaurantes cadastrados.</p>`;
    restaurantList.appendChild(empty);
    restaurantCount.textContent = "0";
    return;
  }

  restaurants.forEach((restaurant) => {
    const card = document.createElement("article");
    card.className = "restaurant-card";

    const id = restaurant.id;
    const rating = Number(restaurant.rating || 0);
    const stars = rating >= 4 ? "★★★★☆" : rating >= 3 ? "★★★☆☆" : "★★☆☆☆";

    card.innerHTML = `
      <div class="restaurant-card-main">
        <div class="restaurant-avatar">🍽️</div>
        <div class="restaurant-data">
          <h3 class="restaurant-title">${escapeHtml(restaurant.name)}</h3>
          <p class="restaurant-category">${escapeHtml(restaurant.category)}</p>
          <div class="restaurant-rating">
            <span class="stars">${stars}</span>
            <span class="rating-value">${rating.toFixed(1)}</span>
          </div>
        </div>
      </div>
      <button class="delete-button" data-id="${id}" aria-label="Deletar ${escapeHtml(restaurant.name)}">×</button>
    `;

    restaurantList.appendChild(card);
  });

  restaurantCount.textContent = restaurants.length;
}

async function fetchRestaurants() {
  showLoading(true);
  clearMessage();

  try {
    const response = await fetch(`${API_URL}/restaurants`, {
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Não foi possível carregar os restaurantes");
    }

    const restaurants = await response.json();
    renderRestaurants(restaurants);
  } catch (error) {
    showMessage("error", error.message || "Erro ao carregar restaurantes");
  } finally {
    showLoading(false);
  }
}

async function handleAuth(action) {
  const name = authNameInput.value.trim();
  const email = authEmailInput.value.trim();
  const password = authPasswordInput.value.trim();

  if (!email || !password) {
    showMessage("error", "Email e senha são obrigatórios");
    return;
  }

  if (action === "register" && !name) {
    showMessage("error", "Nome é obrigatório para cadastro");
    return;
  }

  showLoading(true);
  clearMessage();

  try {
    const response = await fetch(`${API_URL}/auth/${action}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(action === "register" ? { name, email, password } : { email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || `Erro ao ${action === "register" ? "cadastrar" : "logar"}`);
    }

    if (data.token) {
      localStorage.setItem("easyfood_token", data.token);
      showMessage("success", "Login realizado com sucesso");
    } else {
      showMessage("success", action === "register" ? "Usuário cadastrado com sucesso" : "Operação concluída");
    }

    authForm.reset();
  } catch (error) {
    showMessage("error", error.message || "Erro na autenticação");
  } finally {
    showLoading(false);
  }
}

authForm.addEventListener("submit", (event) => {
  event.preventDefault();
  handleAuth("register");
});

registerButton.addEventListener("click", (event) => {
  event.preventDefault();
  handleAuth("register");
});

loginButton.addEventListener("click", (event) => {
  event.preventDefault();
  handleAuth("login");
});

restaurantForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const category = categoryInput.value.trim();
  const rating = Number(ratingInput.value);

  if (!name || !category) {
    showMessage("error", "Nome e categoria são obrigatórios");
    return;
  }

  if (rating < 0 || rating > 5) {
    showMessage("error", "A avaliação deve estar entre 0 e 5");
    return;
  }

  showLoading(true);
  clearMessage();

  try {
    const response = await fetch(`${API_URL}/restaurants`, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, category, rating })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Erro ao criar restaurante");
    }

    restaurantForm.reset();
    ratingInput.value = 4.5;
    showMessage("success", "Restaurante criado com sucesso");
    await fetchRestaurants();
  } catch (error) {
    showMessage("error", error.message || "Erro ao criar restaurante");
  } finally {
    showLoading(false);
  }
});

restaurantList.addEventListener("click", async (event) => {
  const deleteButton = event.target.closest(".delete-button");

  if (!deleteButton) {
    return;
  }

  const id = deleteButton.dataset.id;

  showLoading(true);
  clearMessage();

  try {
    const response = await fetch(`${API_URL}/restaurants/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error("Erro ao deletar restaurante");
    }

    showMessage("success", "Restaurante removido com sucesso");
    await fetchRestaurants();
  } catch (error) {
    showMessage("error", error.message || "Erro ao deletar restaurante");
  } finally {
    showLoading(false);
  }
});

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setActiveTab(button.dataset.tab);
  });
});

refreshButton.addEventListener("click", fetchRestaurants);

setActiveTab("users");
fetchRestaurants();

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
