const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");

const {
  createCoupon,
  getCoupons,
  deleteCoupon,
  getCoupon,
  updateCoupon,
} = require("./coupon.controller");

const router = express.Router();

router.post("/create-coupon", auth, isAdmin, createCoupon);
router.get("/get-coupons", auth, getCoupons);
router.delete("/delete-coupon/:id", auth, isAdmin, deleteCoupon);
router.get("/get-coupon/:id", auth, isAdmin, getCoupon);
router.patch("/update-coupon/:id", auth, isAdmin, updateCoupon);
module.exports = router;
