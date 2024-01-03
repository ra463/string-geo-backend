const express = require("express");
const { auth } = require("../middlewares/auth");
const { adminLogin } = require("./admin.controller");

const router = express.Router();

router.route("/admin-login").post(adminLogin);

module.exports = router;