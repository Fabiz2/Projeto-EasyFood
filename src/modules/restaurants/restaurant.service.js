const prisma = require("../../database/prisma");
const emailService = require("../shared/email.service");

function httpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseId(value) {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, "Identificador inválido");
  }
  return id;
}

function ensureOwnership(restaurant, userId) {
  if (restaurant.ownerId && restaurant.ownerId !== userId) {
    throw httpError(403, "Você não tem permissão para gerenciar este restaurante");
  }
}

async function listRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { dishes: true } } }
  });
}

async function createRestaurant(data, userId) {
  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name,
      category: data.category,
      rating: data.rating || 0,
      ownerId: userId
    }
  });

  const testTo = process.env.EMAIL_TEST_TO;

  try {
    await emailService.sendEmail({
      to: testTo,
      toName: restaurant.name,
      subject: `Bem-vindo à EasyFood, ${restaurant.name}!`,
      header: `Olá, ${restaurant.name}!`,
      body: `
        Seu restaurante foi cadastrado com sucesso na EasyFood.<br/>
        Categoria: ${restaurant.category}.
      `,
      footer: "Equipe EasyFood"
    });
  } catch (error) {
    console.error("Erro ao enviar e-mail:", error.message);
  }

  try {
    await emailService.sendEmail({
      to: testTo,
      toName: "Comercial EasyFood",
      subject: `Novo restaurante cadastrado: ${restaurant.name}`,
      header: "Novo restaurante na plataforma",
      body: `
        Nome: ${restaurant.name}<br/>
        Categoria: ${restaurant.category}<br/>
        Avaliação: ${restaurant.rating}
      `,
      footer: "Notificação automática - EasyFood"
    });
  } catch (error) {
    console.error("Erro ao notificar o comercial:", error.message);
  }

  return restaurant;
}

async function deleteRestaurant(restaurantId, userId) {
  const id = parseId(restaurantId);
  const restaurant = await prisma.restaurant.findUnique({ where: { id } });

  if (!restaurant) {
    throw httpError(404, "Restaurante não encontrado");
  }

  ensureOwnership(restaurant, userId);

  return prisma.restaurant.delete({ where: { id } });
}

module.exports = {
  ensureOwnership,
  listRestaurants,
  createRestaurant,
  deleteRestaurant
};
