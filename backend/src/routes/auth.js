import { Router } from "express";
import { signup, signin, getMe, forgotPassword } from "../controllers/auth.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.post("/signup", signup);
router.post("/signin", signin);
router.post("/forgot-password", forgotPassword);
router.get("/me", authenticate, getMe);

export default router;
