const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createPlan,
  getAllPlan,
  updatePlan,
  deletePlan,
  addMorePlanTypeToPlan,
  updatePlanType,
  deletePlanType,
} = require("./plan.controller");
const router = express.Router();

router.post("/create-plan", auth, isAdmin, createPlan);
router.post("/add-plan-type/:planId", auth, isAdmin, addMorePlanTypeToPlan);
router.patch("/update-plan/:planId", auth, isAdmin, updatePlan);
router.patch(
  "/update-plan-type/:planId/:plan_typeId",
  auth,
  isAdmin,
  updatePlanType
);
router.get("/get-plans", getAllPlan);
router.delete("/delete-plan/:planId", auth, isAdmin, deletePlan);
router.delete(
  "/delete-plan-type/:planId/:plan_typeId",
  auth,
  isAdmin,
  deletePlanType
);

module.exports = router;
