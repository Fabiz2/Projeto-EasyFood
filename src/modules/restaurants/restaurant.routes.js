const express = require("express");
const controller = require("./restaurant.controller");
const authenticate = require("../auth/auth.middleware");

const router = express.Router();

// Consulta continua pública
router.get("/", controller.list);

// Operações que alteram dados exigem JWT
router.post("/", authenticate, controller.create);
router.delete("/:id", authenticate, controller.remove);

module.exports = router;
