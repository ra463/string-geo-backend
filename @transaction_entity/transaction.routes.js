const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const {
  getUserTransactions,
  getUserTransactionDetails,
  getAllTransaction,
  getTransactionById,
} = require("./transaction.controller");

const router = express.Router();

router.route("/get-all-transaction").get(auth, isAdmin, getAllTransaction);
router
  .route("/get-transaction/:transactionId")
  .get(auth, isAdmin, getTransactionById);
router.route("/get-transaction-history").get(auth, getUserTransactions);
router
  .route("/get-transaction-details/:transactionId")
  .get(auth, getUserTransactionDetails);

module.exports = router;
