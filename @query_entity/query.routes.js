const express = require("express");
const { createQuery } = require("./query.controller");

const router = express.Router();

router.post("/submit-query", createQuery);

module.exports = router;
