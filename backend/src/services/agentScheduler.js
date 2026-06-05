import cron from "node-cron";
import prisma from "../utils/prisma.js";
import { matchScholarships } from "./matching.js";
import { attemptAutomatedApplication } from "./browserAgent.js";
import { sendMatchReport, sendDocumentRequest } from "./email.js";

export async function runForUser(userId, userEmail, userName) {
  console.log(`[SCHEDULER] Running for user ${userId} (${userEmail})`);

  const result = await matchScholarships(userId);
  const matches = result.matches || [];

  const applications = [];
  const missingDocsMap = {};

  for (const match of matches) {
    try {
      let prismaScholarship = await prisma.scholarship.findFirst({
        where: { title: match.title, provider: match.provider || "" },
      });

      if (!prismaScholarship) {
        prismaScholarship = await prisma.scholarship.create({
          data: {
            title: match.title,
            provider: match.provider || "",
            description: match.description || "",
            funding: match.funding || "",
            deadline: match.deadline ? new Date(match.deadline) : new Date(),
            location: match.location || "",
            degreeLevel: match.degreeLevel || "",
            eligibility: JSON.stringify(match.eligibility || []),
            matchScore: match.matchScore || 0,
          },
        });
      }

      let appStatus = "applied";
      let appProgress = 100;
      let appDetail = "Auto-submitted by JAPA agent";
      let browserResult = null;

      if (match.url) {
        browserResult = await attemptAutomatedApplication(
          match.url,
          userId
        );

        if (browserResult.success) {
          appDetail = `Agent visited and analyzed page. Pre-filled and submitted.`;
          console.log(`[SCHEDULER] Successfully applied to ${match.title} via browser agent`);
        } else if (browserResult.missingDocs && browserResult.missingDocs.length > 0) {
          appStatus = "pending";
          appProgress = 50;
          appDetail = `Docs needed: ${browserResult.missingDocs.join(", ")}`;
          missingDocsMap[match.title] = browserResult.missingDocs;

          await sendDocumentRequest(
            { id: userId, email: userEmail, fullName: userName },
            match.title,
            browserResult.missingDocs,
            browserResult.instructions || ""
          );

          console.log(`[SCHEDULER] Docs needed for ${match.title}: ${browserResult.missingDocs.join(", ")}`);
        } else {
          appStatus = "pending";
          appProgress = 75;
          appDetail = browserResult.error || "Manual review needed";
          console.log(`[SCHEDULER] Partial application for ${match.title}: ${appDetail}`);
        }
      }

      const existingApp = await prisma.application.findFirst({
        where: { userId, scholarshipId: prismaScholarship.id },
      });

      if (!existingApp) {
        await prisma.application.create({
          data: {
            userId,
            scholarshipId: prismaScholarship.id,
            status: appStatus,
            progress: appProgress,
            requiredDocs: browserResult.missingDocs?.length
              ? JSON.stringify(browserResult.missingDocs) : undefined,
          },
        });
      } else {
        const updateData = { status: appStatus, progress: appProgress };
        if (browserResult?.missingDocs?.length && !existingApp.requiredDocs) {
          updateData.requiredDocs = JSON.stringify(browserResult.missingDocs);
        }
        await prisma.application.update({
          where: { id: existingApp.id },
          data: updateData,
        });
      }

      applications.push({
        scholarshipTitle: match.title,
        status: appStatus === "applied" ? "Applied" : appStatus === "pending" ? "Docs Needed" : "Partial",
        detail: appDetail,
      });
    } catch (err) {
      console.error(`[SCHEDULER] Failed for ${match.title}:`, err.message);
      applications.push({
        scholarshipTitle: match.title,
        status: "Failed",
        detail: err.message,
      });
    }
  }

  await sendMatchReport(
    { id: userId, email: userEmail, fullName: userName },
    matches,
    applications,
    missingDocsMap
  );

  return { matches, applications };
}

export async function runForAllUsers() {
  console.log("[SCHEDULER] Running for all users...");

  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true },
  });

  const results = [];
  for (const user of users) {
    try {
      const result = await runForUser(user.id, user.email, user.fullName);
      results.push({ userId: user.id, status: "ok", matches: result.matches.length });
    } catch (err) {
      console.error(`[SCHEDULER] Failed for user ${user.id}:`, err.message);
      results.push({ userId: user.id, status: "error", error: err.message });
    }
  }

  console.log(`[SCHEDULER] Completed for ${users.length} users`);
  return results;
}

let cronTask = null;

export function startCron() {
  if (cronTask) return;

  cronTask = cron.schedule("0 8 * * *", async () => {
    console.log("[CRON] Daily 8 AM run started");
    try {
      await runForAllUsers();
    } catch (err) {
      console.error("[CRON] Error:", err);
    }
  });

  console.log("[CRON] Scheduler started — will run daily at 8 AM");
}

export function stopCron() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log("[CRON] Scheduler stopped");
  }
}
