const express = require("express");
const { auth, isAdmin } = require("../middlewares/auth");
const {
  createQuery,
  getQueries,
  getQuery,
  deleteQuery,
} = require("./query.controller");

const router = express.Router();

router.post("/submit-query", createQuery);
router.get("/get-queries", auth, isAdmin, getQueries);
router.get("/get-query/:id", auth, isAdmin, getQuery);
router.delete("/delete-query/:id", auth, isAdmin, deleteQuery);

module.exports = router;
