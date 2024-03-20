const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createTrailer,
  getTrailers,
  deleteTrailer,
  getTrailer,
  getAllVideos,
} = require("./trailer.controller");

const router = express.Router();

router.post("/create-trailer", auth, isAdmin, createTrailer);
router.get("/get-trailers", getTrailers);
router.delete("/delete-trailer/:id", auth, isAdmin, deleteTrailer);
router.get("/get-trailer/:id", auth, isAdmin, getTrailer);
router.get("/get-all-videos", auth, isAdmin, getAllVideos);

module.exports = router;
