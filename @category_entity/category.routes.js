const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createCategory,
  getAllCategories,
  deleteCategory,
  updateCategory,
  getCategory,
  addVideoToCategory,
  getCategoryWithVideo,
  removeVideoFromCategory,
  shuffleCategorySequence,
  getWhatEveywhereCategory,
  getpopularRecentCategories,
} = require("./category.controller");

const router = express.Router();

router.post("/create-category", auth, isAdmin, createCategory);
router.get("/get-categories", auth, getAllCategories);
router.get("/get-what-everywhere-category", getWhatEveywhereCategory);
router.get("/get-popular-recent-categories", getpopularRecentCategories);
router.get("/get-category/:id", auth, getCategory);
router.delete("/delete-category/:id", auth, isAdmin, deleteCategory);
router.patch("/update-category/:id", auth, isAdmin, updateCategory);
router.post("/add-category-video/:id", auth, isAdmin, addVideoToCategory);
router.get("/get-category-videos/:id", auth, getCategoryWithVideo);
router.post(
  "/remove-category-video/:id",
  auth,
  isAdmin,
  removeVideoFromCategory
);
router.patch(
  "/shuffle-category-sequence/:id",
  auth,
  isAdmin,
  shuffleCategorySequence
);

module.exports = router;
