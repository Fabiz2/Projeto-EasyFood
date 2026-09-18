const prisma = require("../../database/prisma");

async function listRestaurants() {
  return prisma.restaurant.findMany();
}

async function createRestaurant(data) {
  return prisma.restaurant.create({
    data: {
      name: data.name,
      category: data.category,
      rating: data.rating || 0
    }
  });
}

async function deleteRestaurant(id) {
  return prisma.restaurant.delete({
    where: { id: parseInt(id) }
  });
}

module.exports = {
  listRestaurants,
  createRestaurant,
  deleteRestaurant
};
