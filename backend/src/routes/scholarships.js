import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { listScholarships, getScholarship, createScholarship } from "../controllers/scholarships.js";

const router = Router();

router.get("/", authenticate, listScholarships);
router.get("/:id", authenticate, getScholarship);
router.post("/", authenticate, createScholarship);

export default router;
