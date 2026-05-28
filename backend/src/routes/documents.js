import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { listDocuments, createDocument, updateDocument, deleteDocument } from "../controllers/documents.js";

const router = Router();

router.get("/", authenticate, listDocuments);
router.post("/", authenticate, createDocument);
router.put("/:id", authenticate, updateDocument);
router.delete("/:id", authenticate, deleteDocument);

export default router;
