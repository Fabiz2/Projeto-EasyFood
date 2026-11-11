const dishService = require("./dish.service");

async function create(req, res) {
  try {
    const { restaurantId } = req.params;
    const dish = await dishService.createDish(restaurantId, req.body || {}, req.user.id);
    return res.status(201).json(dish);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "Erro interno ao cadastrar prato"
    });
  }
}

async function list(req, res) {
  try {
    const { restaurantId } = req.params;
    const dishes = await dishService.listDishes(restaurantId);
    return res.json(dishes);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "Erro ao consultar pratos"
    });
  }
}

async function uploadImage(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Nenhuma imagem enviada (campo: image)" });
    }

    const dish = await dishService.uploadDishImage(req.params.dishId, req.file.buffer, req.user.id);
    return res.json(dish);
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      error: error.statusCode ? error.message : "Erro ao processar imagem"
    });
  }
}

module.exports = {
  create,
  list,
  uploadImage
};
