const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const { upload } = require("../utils/s3");
const { getAbouts, createAbout, updateAbout } = require("./about.controller");

const router = express.Router();

router.post(
  "/create-about",
  // auth,
  // isAdmin,
  upload.single("image"),
  createAbout
);
router.get("/get-abouts", getAbouts);
// router.delete("/delete-actor/:id", auth, isAdmin, deleteActor);
// router.get("/get-actor/:id", auth, isAdmin, getActor);
router.patch(
  "/update-about/:id",
  auth,
  isAdmin,
  upload.single("image"),
  updateAbout
);
module.exports = router;
