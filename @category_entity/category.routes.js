const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createCategory,
  getCategories,
  deleteCategory,
  updateCategory,
  getCategory,
  addVideoToCategory,
  getCategoryWithVideo,
} = require("./category.controller");

const router = express.Router();

router.post("/create-category", auth, isAdmin, createCategory);
router.get("/get-categories", auth, getCategories);
router.get("/get-category/:id", auth, getCategory);
router.delete("/delete-category/:id", auth, isAdmin, deleteCategory);
router.patch("/update-category/:id", auth, isAdmin, updateCategory);
router.post("/add-category-video/:id", auth, isAdmin, addVideoToCategory);
router.post("/get-category-videos/:id", auth, getCategoryWithVideo);

module.exports = router;
