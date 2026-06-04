import UserProfile from "../models/UserProfile.js";
import { isMongoConnected } from "../config/mongodb.js";
import { matchScholarships } from "../services/matching.js";
import { runForUser, runForAllUsers } from "../services/agentScheduler.js";

export async function triggerAgentRun(req, res, next) {
  try {
    const userId = req.user.id;
    const email = req.user.email;
    const fullName = req.user.fullName;

    const result = await runForUser(userId, email, fullName);

    res.json({
      message: "Agent run completed",
      matches: result.matches.length,
      applications: result.applications.length,
      matchesList: result.matches.map((m) => ({
        title: m.title,
        provider: m.provider,
        funding: m.funding,
        deadline: m.deadline,
        score: m.matchScore,
      })),
      applicationsList: result.applications,
    });
  } catch (err) {
    next(err);
  }
}

export async function triggerAgentRunAll(req, res, next) {
  try {
    const results = await runForAllUsers();
    res.json({ message: "Agent run completed for all users", results });
  } catch (err) {
    next(err);
  }
}

export async function getAgentStatus(req, res, next) {
  try {
    if (!isMongoConnected()) {
      return res.status(503).json({ error: "MongoDB not connected" });
    }

    const userId = req.user.id;
    const userProfile = await UserProfile.findOne({ userId });
    const matchedCount = userProfile?.matchedScholarships?.length || 0;

    res.json({
      hasProfile: !!userProfile,
      matchedCount,
      lastRun: userProfile?.updatedAt || null,
    });
  } catch (err) {
    next(err);
  }
}

export async function saveUserProfile(req, res, next) {
  try {
    const { userId, ...data } = req.body;
    if (!userId) return res.status(400).json({ error: "userId required" });

    if (!isMongoConnected()) {
      return res.status(503).json({ error: "MongoDB not connected" });
    }

    const profile = await UserProfile.findOneAndUpdate(
      { userId },
      { $set: data },
      { upsert: true, new: true }
    );

    res.json({ profile, message: "Profile saved" });
  } catch (err) {
    next(err);
  }
}

export async function getUserProfile(req, res, next) {
  try {
    const { userId } = req.params;
    if (!isMongoConnected()) {
      return res.status(503).json({ error: "MongoDB not connected" });
    }
    const profile = await UserProfile.findOne({ userId });
    res.json(profile || {});
  } catch (err) {
    next(err);
  }
}

export async function searchScholarships(req, res, next) {
  try {
    const { query, location, degreeLevel, funding } = req.body;

    if (!isMongoConnected()) {
      return res.status(503).json({ error: "MongoDB not connected" });
    }

    const { default: Scholarship } = await import("../models/Scholarship.js");
    const filter = { status: "approved" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (degreeLevel) filter.degreeLevel = { $regex: degreeLevel, $options: "i" };
    if (funding) filter.funding = { $regex: funding, $options: "i" };
    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
        { provider: { $regex: query, $options: "i" } },
      ];
    }

    const results = await Scholarship.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({ results, count: results.length });
  } catch (err) {
    next(err);
  }
}
