const restaurantService = require("./restaurant.service");

async function list(req, res) {
  try {
    const restaurants = await restaurantService.listRestaurants();
    res.json(restaurants);
  } catch (error) {
    res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
}

async function create(req, res) {
  const { name, category, rating } = req.body;

  if (!name || !category) {
    return res.status(400).json({
      error: "Nome e categoria são obrigatórios"
    });
  }

  try {
    const restaurant = await restaurantService.createRestaurant({
      name,
      category,
      rating
    });
    res.status(201).json(restaurant);
  } catch (error) {
    res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
}

async function remove(req, res) {
  const { id } = req.params;

  if (!id) {
    return res.status(400).json({
      error: "ID do restaurante é obrigatório"
    });
  }

  try {
    const restaurant = await restaurantService.deleteRestaurant(id);
    res.json({
      message: "Restaurante deletado com sucesso",
      restaurant
    });
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({
        error: "Restaurante não encontrado"
      });
    }

    res.status(500).json({
      error: "Erro interno do servidor"
    });
  }
}

module.exports = { list, create, remove };
