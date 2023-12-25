const express = require("express");
const { createSubscription } = require("./subscription.controller");
const {auth} = require("../middlewares/auth");
const router = express.Router();

router.post("/create-subscription", auth, createSubscription);
module.exports = router;
