const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");

const { upload } = require("../utils/s3");
const { createDirector, getDirectors, deleteDirector, getDirector, updateDirector } = require("./director.controller");

const router = express.Router();

router.post(
  "/create-director",
  auth,
  isAdmin,
  upload.single("image"),
  createDirector
);
router.get("/get-directors", auth, getDirectors);
router.delete("/delete-director/:id", auth, isAdmin, deleteDirector);
router.get("/get-director/:id", auth, isAdmin, getDirector);
router.patch(
  "/update-director/:id",
  auth,
  isAdmin,
  upload.single("image"),
  updateDirector
);
module.exports = router;
