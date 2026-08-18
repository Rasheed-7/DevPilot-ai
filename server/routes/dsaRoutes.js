import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  getDSAProblems,
  getDSAProblem,
  createDSAProblem,
  updateDSAProblem,
  deleteDSAProblem,
} from "../controllers/dsaController.js";

const router = express.Router();

router
  .route("/")
  .get(protect, getDSAProblems)
  .post(protect, createDSAProblem);

router
  .route("/:id")
  .get(protect, getDSAProblem)
  .put(protect, updateDSAProblem)
  .delete(protect, deleteDSAProblem);

export default router;