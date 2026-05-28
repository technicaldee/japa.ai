import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { getDigest } from "../controllers/digest.js";

const router = Router();

router.get("/", authenticate, getDigest);

export default router;
