import "dotenv/config";
import express from "express";
import cors from "cors";
import { PORT } from "./config/env.js";
import { connectMongo } from "./config/mongodb.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startCron } from "./services/agentScheduler.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import scholarshipRoutes from "./routes/scholarships.js";
import applicationRoutes from "./routes/applications.js";
import documentRoutes from "./routes/documents.js";
import digestRoutes from "./routes/digest.js";
import adminRoutes from "./routes/admin.js";
import agentRoutes from "./routes/agent.js";
import { triggerScrape, scraperStatus } from "./controllers/scrape.js";
import { authenticate } from "./middleware/auth.js";
import { requireAdmin } from "./middleware/adminAuth.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/digest", digestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/agent", agentRoutes);

app.post("/api/scrape/run", authenticate, requireAdmin, triggerScrape);
app.get("/api/scrape/status", authenticate, requireAdmin, scraperStatus);

app.use(errorHandler);

connectMongo().then(() => {
  startCron();
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
});
