const express = require("express");
const {
  registerUser,
  verifyAccount,
} = require("../controllers/userController");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/verify-account").post(verifyAccount);

module.exports = router;
