const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const {
  adminLogin,
  getAllUsers,
  getUserSubscriptionHistory,
  downloadAsCsv,
} = require("./admin.controller");

const router = express.Router();

router.route("/admin-login").post(adminLogin);
router.route("/get-all-users").get(getAllUsers);
router
  .route("/get-user-subscription-history/:userId")
  .get(getUserSubscriptionHistory);
router.get("/download-as-csv",downloadAsCsv);

module.exports = router;
