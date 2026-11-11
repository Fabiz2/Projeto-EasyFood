const express = require("express");
const authController = require("./auth.controller");
const authenticate = require("./auth.middleware");
const upload = require("../shared/upload.middleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticate, authController.me);

router.post("/me/image", authenticate, upload.single("image"), authController.uploadImage);

module.exports = router;
