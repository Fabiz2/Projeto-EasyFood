const express = require("express");
const dishController = require("./dish.controller");
const authMiddleware = require("../auth/auth.middleware");
const upload = require("../shared/upload.middleware");

const router = express.Router();

// Consulta do cardápio é pública
router.get("/restaurants/:restaurantId/dishes", dishController.list);

// Cadastro de prato exige JWT
router.post("/restaurants/:restaurantId/dishes", authMiddleware, dishController.create);

// Upload: autenticação antes do Multer
router.post(
  "/dishes/:dishId/image",
  authMiddleware,
  upload.single("image"),
  dishController.uploadImage
);

module.exports = router;
