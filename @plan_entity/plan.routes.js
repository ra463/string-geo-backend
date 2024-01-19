const express = require("express");
const { isAdmin, auth } = require("../middlewares/auth");
const {
  createPlan,
  getAllPlan,
  updatePlan,
  deletePlan,
  getPlanById,
} = require("./plan.controller");
const router = express.Router();

router.post("/create-plan", createPlan);
// router.post("/add-plan-type/:planId", auth, isAdmin, addMorePlanTypeToPlan);
router.patch("/update-plan/:planId", updatePlan);
// router.patch(
//   "/update-plan-type/:planId/:plan_typeId",
//   auth,
//   isAdmin,
//   updatePlanType
// );
router.get("/get-plans", getAllPlan);
router.get("/get-plan", getPlanById);
router.delete("/delete-plan/:planId", deletePlan);
// router.delete(
//   "/delete-plan-type/:planId/:plan_typeId",
//   auth,
//   isAdmin,
//   deletePlanType
// );

module.exports = router;
