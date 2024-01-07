const express = require("express");
const { auth } = require("../middlewares/auth");
const {
  getUserTransactions,
  getTransactionDetails,
} = require("./transaction.controller");

const router = express.Router();

router.route("/get-transaction-history").get(auth, getUserTransactions);
router
  .route("/get-transaction-details/:transactionId")
  .get(auth, getTransactionDetails);

module.exports = router;
