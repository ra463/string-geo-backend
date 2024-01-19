const express = require("express");
const { getNewAccesstoken, auth } = require("../middlewares/auth");
const {
  registerUser,
  verifyAccount,
  loginUser,
  sendForgotPasswordCode,
  validateCode,
  resetPassword,
  getProfile,
  updateProfile,
  updatePassword,
  logout,
  getMyPlan,
  logoutFromFirstDevice,
  deleteAccount,
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
router.route("/get-profile").get(auth, getProfile);
router.route("/update-profile").patch(auth, updateProfile);
router.route("/get-my-plan").get(auth, getMyPlan);
router.route("/logout").post(auth, logout);
router.route("/logout-from-first-device").post(auth, logoutFromFirstDevice);
router.route("/delete-account/:userId").delete(auth, deleteAccount);

module.exports = router;
