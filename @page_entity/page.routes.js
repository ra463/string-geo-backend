const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createPage,
  getPages,
  deletePage,
  getPage,
  updatePage,
} = require("./page.controller");

const router = express.Router();

router.post("/create-page", auth, isAdmin, createPage);
router.get("/get-pages", getPages);
router.delete("/delete-page/:id", auth, isAdmin, deletePage);
router.get("/get-page/:id", getPage);
router.patch("/update-page/:id", auth, isAdmin, updatePage);
module.exports = router;
