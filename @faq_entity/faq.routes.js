const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const { createFaq, getFaqs, deleteFaq, getFaq, updateFaq } = require("./faq.controller");

const router = express.Router();

router.post("/create-faq", auth, isAdmin, createFaq);
router.get("/get-faqs", auth, getFaqs);
router.delete("/delete-faq/:id", auth, isAdmin, deleteFaq);
router.get("/get-faq/:id", auth, isAdmin, getFaq);
router.patch("/update-faq/:id", auth, isAdmin, updateFaq);
module.exports = router;
