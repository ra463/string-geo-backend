const express = require("express");
const { getNewAccesstoken, auth } = require("../middlewares/auth");
const {
  registerUser,
  verifyAccount,
  loginUser,
  sendForgotPasswordCode,
  validateCode,
  resetPassword,
  logout,
  getProfile,
  updateProfile,
  updatePassword,
} = require("./user.controller");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/verify-account").post(verifyAccount);
router.route("/get-new-access-token").get(getNewAccesstoken);
router.route("/login").post(loginUser);
router.route("/send-code").post(sendForgotPasswordCode);
router.route("/validate-code").post(validateCode);
router.route("/reset-password").post(resetPassword);
router.route("/update-password").patch(auth, updatePassword);
router.post("/logout", auth, logout);
router.get("/get-profile", auth, getProfile);
router.patch("/update-profile", auth, updateProfile);

module.exports = router;
