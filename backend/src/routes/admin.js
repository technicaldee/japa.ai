import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/adminAuth.js";
import {
  getOverview,
  getAnalyticsGrowth,
  getAnalyticsUsers,
  getAnalyticsHotspots,
  getAnalyticsSuccessRate,
  getActivity,
} from "../controllers/admin.js";
import {
  listSources,
  createSource,
  updateSource,
  deleteSource,
  getScraperStats,
  getPendingOpportunities,
  approveOpportunity,
  rejectOpportunity,
  getScraperInsights,
} from "../controllers/scrapers.js";

const router = Router();

router.use(authenticate, requireAdmin);

router.get("/overview", getOverview);

router.get("/analytics/growth", getAnalyticsGrowth);
router.get("/analytics/users", getAnalyticsUsers);
router.get("/analytics/hotspots", getAnalyticsHotspots);
router.get("/analytics/success-rate", getAnalyticsSuccessRate);

router.get("/activity", getActivity);

router.get("/scrapers", listSources);
router.post("/scrapers", createSource);
router.put("/scrapers/:id", updateSource);
router.delete("/scrapers/:id", deleteSource);
router.get("/scrapers/stats", getScraperStats);
router.get("/scrapers/pending", getPendingOpportunities);
router.post("/scrapers/pending/:id/approve", approveOpportunity);
router.post("/scrapers/pending/:id/reject", rejectOpportunity);
router.get("/scrapers/insights", getScraperInsights);

export default router;
