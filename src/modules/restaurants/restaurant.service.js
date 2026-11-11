const prisma = require("../../database/prisma");
const emailService = require("../shared/email.service");

async function listRestaurants() {
  return prisma.restaurant.findMany({
    orderBy: { id: "asc" },
    include: { _count: { select: { dishes: true } } }
  });
}

async function createRestaurant(data) {
  // 1. Operação principal
  const restaurant = await prisma.restaurant.create({
    data: {
      name: data.name,
      category: data.category,
      rating: data.rating || 0
    }
  });

  // 2. Ações secundárias: uma falha no e-mail não desfaz o cadastro
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

  // 3. Retorno da operação principal
  return restaurant;
}

async function deleteRestaurant(id) {
  return prisma.restaurant.delete({
    where: { id: Number(id) }
  });
}

module.exports = {
  listRestaurants,
  createRestaurant,
  deleteRestaurant
};
