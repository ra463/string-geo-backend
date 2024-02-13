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
router.get("/get-pages", auth, getPages);
router.delete("/delete-page/:id", auth, isAdmin, deletePage);
router.get("/get-page/:id", auth, isAdmin, getPage);
router.patch("/update-page/:id", auth, isAdmin, updatePage);
module.exports = router;
