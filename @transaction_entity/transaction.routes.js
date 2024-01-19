const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const {
  getUserTransactions,
  getUserTransactionDetails,
  getAllTransaction,
  getTransactionById,
  test,
} = require("./transaction.controller");

const router = express.Router();

router.route("/get-all-transaction").get(getAllTransaction);
router.route("/get-transaction/:transactionId").get(getTransactionById);
router.route("/get-transaction-history").get(auth, getUserTransactions);
router
  .route("/get-transaction-details/:transactionId")
  .get(auth, getUserTransactionDetails);

router.route("/test").patch(test);

module.exports = router;
