import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  generateEssay,
} from "../controllers/applications.js";

const router = Router();

router.get("/", authenticate, listApplications);
router.get("/:id", authenticate, getApplication);
router.post("/", authenticate, createApplication);
router.put("/:id", authenticate, updateApplication);
router.delete("/:id", authenticate, deleteApplication);
router.post("/:id/generate-essay", authenticate, generateEssay);

export default router;
