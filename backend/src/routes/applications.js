import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import {
  listApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
} from "../controllers/applications.js";

const router = Router();

router.get("/", authenticate, listApplications);
router.get("/:id", authenticate, getApplication);
router.post("/", authenticate, createApplication);
router.put("/:id", authenticate, updateApplication);
router.delete("/:id", authenticate, deleteApplication);

export default router;
