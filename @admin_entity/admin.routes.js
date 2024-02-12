const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const {
  adminLogin,
  getAllUsers,
  getUserSubscriptionHistory,
  downloadAsCsv,
  deleteUser,
  getUser,
  updateUserProfile,
  getURL,
} = require("./admin.controller");
const { upload } = require("../utils/s3");

const router = express.Router();

router.route("/admin-login").post(adminLogin);
router.route("/get-all-users").get(auth, isAdmin, getAllUsers);
router
  .route("/get-user-subscription-history/:userId")
  .get(auth, isAdmin, getUserSubscriptionHistory);
router.get("/download-as-csv", auth, isAdmin, downloadAsCsv);
router.delete("/delete-user/:userId", auth, isAdmin, deleteUser);
router.get("/get-user/:userId", auth, isAdmin, getUser);
router.patch(
  "/update-user/:id",
  auth,
  isAdmin,
  upload.single("image"),
  updateUserProfile
);
router.post("/get-url", auth, isAdmin, getURL);

module.exports = router;
