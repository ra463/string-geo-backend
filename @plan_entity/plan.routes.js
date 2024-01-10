const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createPlan,
  getAllPlan,
  updatePlan,
  deletePlan,
} = require("./plan.controller");
const router = express.Router();

router.post("/create-plan", auth, isAdmin, createPlan);
router.get("/get-plans", auth, getAllPlan);
router.put("/update-plan/:planId", auth, isAdmin, updatePlan);
router.delete("/delete-plan/:planId", auth, isAdmin, deletePlan);

module.exports = router;
