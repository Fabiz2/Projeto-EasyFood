const express = require("express");
const dishController = require("./dish.controller");
const authMiddleware = require("../auth/auth.middleware");
const upload = require("../shared/upload.middleware");

const router = express.Router();

router.get("/restaurants/:restaurantId/dishes", dishController.list);

router.post("/restaurants/:restaurantId/dishes", authMiddleware, dishController.create);

router.post(
  "/dishes/:dishId/image",
  authMiddleware,
  upload.single("image"),
  dishController.uploadImage
);

module.exports = router;
