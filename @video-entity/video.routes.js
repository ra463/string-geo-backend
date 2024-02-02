const express = require("express");
const {
  createVideo,
  getVideos,
  deleteVideo,
  updateVideo,
  getVideo,
} = require("./video.controller");
const { auth, isAdmin } = require("../middlewares/auth");
const { upload } = require("../utils/s3");
const router = express.Router();

router.post(
  "/create-video",
  auth,
  isAdmin,
  upload.single("image"),
  createVideo
);
router.get("/get-videos", auth, getVideos);
router.delete("/delete-video/:id", auth, isAdmin, deleteVideo);
router.get("/get-video/:id", auth, getVideo);
router.patch(
  "/update-video/:id",
  auth,
  isAdmin,
  upload.single("image"),
  updateVideo
);

module.exports = router;
