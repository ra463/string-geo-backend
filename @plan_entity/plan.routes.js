const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const { createPlan } = require("./plan.controller");
const router = express.Router();

router.post("/create-plan", auth, isAdmin, createPlan);

module.exports = router;
