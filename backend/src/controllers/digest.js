import prisma from "../utils/prisma.js";

export async function getDigest(req, res, next) {
  try {
    const userId = req.user.id;

    const applications = await prisma.application.findMany({
      where: { userId },
      include: { scholarship: true },
      orderBy: { createdAt: "desc" },
    });

    const documents = await prisma.document.findMany({
      where: { userId },
    });

    const totalDocs = documents.length;
    const verifiedDocs = documents.filter((d) => d.status === "verified").length;
    const progress = totalDocs > 0 ? Math.round((verifiedDocs / totalDocs) * 100) : 0;

    const nextDeadline = applications
      .filter((a) => a.deadline && a.status !== "submitted")
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))[0] || null;

    res.json({
      applications,
      documents,
      progress,
      nextDeadline,
      tip: {
        title: "AI Tip: Mastering the IELTS Speaking Section",
        body: "Focus on expanding your vocabulary related to abstract topics. Practice speaking for 2 minutes on unfamiliar subjects to build fluency and confidence.",
      },
    });
  } catch (err) {
    next(err);
  }
}
