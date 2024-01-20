const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createLanguage,
  getLanguages,
  deleteLanguage,
  getLanguage,
  updateLanguage,
} = require("./language.controller");
const router = express.Router();

router.post("/create-language", auth, isAdmin, createLanguage);
router.get("/get-languages", auth, isAdmin, getLanguages);
router.delete("/delete-language/:id", auth, isAdmin, deleteLanguage);
router.get("/get-language/:id", auth, isAdmin, getLanguage);
router.patch("/update-language/:id", auth, isAdmin, updateLanguage);
module.exports = router;
