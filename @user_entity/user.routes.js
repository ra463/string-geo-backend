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
  updateProfilePicture,
  sendInvoice,
  resendOtp,
  addVideoToWatchlist,
} = require("./user.controller");
const { upload } = require("../utils/s3");

const router = express.Router();

router.route("/register").post(registerUser);
router.route("/verify-account").post(verifyAccount);
router.route("/get-new-access-token").get(getNewAccesstoken);
router.route("/login").post(loginUser);
router.route("/send-code").post(sendForgotPasswordCode);
router.route("/validate-code").post(validateCode);
router.post("/resend-otp", resendOtp);
router.route("/reset-password").post(resetPassword);
router.route("/update-password").patch(auth, updatePassword);
router.route("/get-profile").get(auth, getProfile);
router.route("/update-profile").patch(auth, updateProfile);
router
  .route("/update-photo")
  .patch(auth, upload.single("image"), updateProfilePicture);
router.route("/get-my-plan").get(auth, getMyPlan);
router.route("/add-video-to-watchlist").post(auth, addVideoToWatchlist);
router.route("/logout").post(auth, logout);
router.route("/logout-from-first-device").post(auth, logoutFromFirstDevice);
router.route("/delete-account").delete(auth, deleteAccount);
router.get("/send-invoice", sendInvoice);

module.exports = router;
