import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  triggerAgentRun,
  triggerAgentRunAll,
  getAgentStatus,
  searchScholarships,
  saveUserProfile,
  getUserProfile,
} from "../controllers/agent.js";

const router = Router();

router.post("/run", authenticate, triggerAgentRun);
router.post("/run-all", authenticate, requireAdmin, triggerAgentRunAll);
router.get("/status", authenticate, getAgentStatus);
router.post("/search", authenticate, searchScholarships);
router.post("/profile", authenticate, saveUserProfile);
router.get("/profile/:userId", authenticate, getUserProfile);

export default router;
