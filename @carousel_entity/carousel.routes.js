const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  addCarousel,
  getAllCarousel,
  deleteCarousel,
  getAllInnerCarousel,
  getAllOuterCarousel,
} = require("./carousel.controller");
const { upload } = require("../utils/s3");

const router = express.Router();

router.post(
  "/add-carousel",
  auth,
  isAdmin,
  upload.single("image"),
  addCarousel
);
router.get("/get-all-carousel", auth, isAdmin, getAllCarousel);
router.get("/get-inner-carousel", auth, getAllInnerCarousel);
router.get("/get-outer-carousel", getAllOuterCarousel);
router.delete("/delete-carousel/:id", auth, isAdmin, deleteCarousel);

module.exports = router;
