const prisma = require("../../database/prisma");
const imageService = require("../shared/image.service");

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseId(value, label) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, `${label} inválido`);
  }
  return id;
}

function validateDish(data) {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const description = typeof data.description === "string" ? data.description.trim() : "";
  const price = Number(data.price);

  if (!name) throw httpError(400, "Nome do prato é obrigatório");
  if (!description) throw httpError(400, "Descrição do prato é obrigatória");
  if (!Number.isFinite(price) || price <= 0) {
    throw httpError(400, "Preço deve ser um número maior que zero");
  }

  return { name, description, price };
}

async function createDish(restaurantId, data) {
  const id = parseId(restaurantId, "ID do restaurante");
  const dishData = validateDish(data);

  const restaurant = await prisma.restaurant.findUnique({ where: { id } });

  if (!restaurant) {
    throw httpError(404, "Restaurante não encontrado");
  }

  return prisma.dish.create({
    data: {
      ...dishData,
      restaurantId: id
    }
  });
}

async function listDishes(restaurantId) {
  const id = parseId(restaurantId, "ID do restaurante");

  return prisma.dish.findMany({
    where: { restaurantId: id },
    orderBy: { id: "asc" }
  });
}

async function uploadDishImage(dishId, buffer) {
  const id = parseId(dishId, "ID do prato");

  const dish = await prisma.dish.findUnique({ where: { id } });

  if (!dish) {
    throw httpError(404, "Prato não encontrado");
  }

  // Se a otimização falhar, o prato continua cadastrado sem imagem
  const imageUrl = await imageService.optimizeImage(buffer);

  return prisma.dish.update({
    where: { id },
    data: { imageUrl }
  });
}

module.exports = {
  createDish,
  listDishes,
  uploadDishImage
};
