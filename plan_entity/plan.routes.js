const express = require("express");
const { isAdmin } = require("../middlewares/auth");
const { createPlan } = require("./plan.controller");
const router = express.Router();

router.post("/create-plan",isAdmin,createPlan);

module.exports = router;
