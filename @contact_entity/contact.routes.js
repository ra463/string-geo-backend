const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const { upload } = require("../utils/s3");
const {
  createContact,
  updateContact,
  // getContact,
  getContacts,
} = require("./contact.controller");

const router = express.Router();

router.post(
  "/create-contact",
  // auth,
  // isAdmin,
  upload.single("image"),
  createContact
);
router.get("/get-contacts", getContacts);
// router.delete("/delete-actor/:id", auth, isAdmin, deleteActor);
// router.get("/get-actor/:id", auth, isAdmin, getActor);
router.patch(
  "/update-contact/:id",
  auth,
  isAdmin,
  upload.single("image"),
  updateContact
);
module.exports = router;
