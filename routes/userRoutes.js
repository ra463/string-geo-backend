const express = require("express");
const {
  registerUser,
  verifyAccount,
} = require("../controllers/userController");
const { getNewAccesstoken } = require("../middlewares/auth");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/verify-account").post(verifyAccount);
router.get("/get-new-access-token",getNewAccesstoken);
module.exports = router;
