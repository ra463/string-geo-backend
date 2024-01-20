const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const { createGenre, getGenres, deleteGenre, getGenre, updateGenre } = require("./genre.controller");

const router = express.Router();

router.post("/create-genre", auth, isAdmin, createGenre);
router.get("/get-genres", auth, isAdmin, getGenres);
router.delete("/delete-genre/:id", auth, isAdmin, deleteGenre);
router.get("/get-genre/:id", auth, isAdmin, getGenre);
router.patch("/update-genre/:id", auth, isAdmin, updateGenre);

module.exports = router;
