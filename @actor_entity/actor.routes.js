const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createActor,
  getActors,
  deleteActor,
  getActor,
  updateActor,
} = require("./actor.controller");
const { upload } = require("../utils/s3");

const router = express.Router();

router.post(
  "/create-actor",
  auth,
  isAdmin,
  upload.single("image"),
  createActor
);
router.get("/get-actors", auth, getActors);
router.delete("/delete-actor/:id", auth, isAdmin, deleteActor);
router.get("/get-actor/:id", auth, isAdmin, getActor);
router.patch(
  "/update-actor/:id",
  auth,
  isAdmin,
  upload.single("image"),
  updateActor
);
module.exports = router;
