import prisma from "../utils/prisma.js";
import Profile from "../models/UserProfile.js";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export async function listApplications(req, res, next) {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user.id },
      include: { scholarship: true, documents: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(applications);
  } catch (err) {
    next(err);
  }
}

export async function getApplication(req, res, next) {
  try {
    const app = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { scholarship: true, documents: true },
    });
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }
    res.json(app);
  } catch (err) {
    next(err);
  }
}

export async function createApplication(req, res, next) {
  try {
    const { scholarshipId, deadline, requiredDocs } = req.body;
    if (!scholarshipId) {
      return res.status(400).json({ error: "scholarshipId is required" });
    }
    const app = await prisma.application.create({
      data: {
        userId: req.user.id,
        scholarshipId,
        deadline: deadline ? new Date(deadline) : null,
        requiredDocs: requiredDocs ? JSON.stringify(requiredDocs) : undefined,
      },
      include: { scholarship: true },
    });
    res.status(201).json(app);
  } catch (err) {
    next(err);
  }
}

export async function updateApplication(req, res, next) {
  try {
    const existing = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }
    const data = { ...req.body };
    if (data.deadline) data.deadline = new Date(data.deadline);
    if (data.requiredDocs && typeof data.requiredDocs === "object") {
      data.requiredDocs = JSON.stringify(data.requiredDocs);
    }
    const app = await prisma.application.update({
      where: { id: req.params.id },
      data,
      include: { scholarship: true, documents: true },
    });
    res.json(app);
  } catch (err) {
    next(err);
  }
}

export async function deleteApplication(req, res, next) {
  try {
    const existing = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });
    if (!existing) {
      return res.status(404).json({ error: "Application not found" });
    }
    await prisma.application.delete({ where: { id: req.params.id } });
    res.json({ message: "Application deleted" });
  } catch (err) {
    next(err);
  }
}

export async function generateEssay(req, res, next) {
  try {
    const app = await prisma.application.findFirst({
      where: { id: req.params.id, userId: req.user.id },
      include: { scholarship: true },
    });
    if (!app) {
      return res.status(404).json({ error: "Application not found" });
    }

    const mongoProfile = await Profile.findOne({ userId: req.user.id }).lean();
    const profile = mongoProfile || {};

    const prompt = `You are JAPA, an AI writing assistant for scholarship applications.

SCHOLARSHIP: ${app.scholarship.title}
PROVIDER: ${app.scholarship.provider}
DESCRIPTION: ${app.scholarship.description || "N/A"}
FUNDING: ${app.scholarship.funding || "N/A"}
DEGREE LEVEL: ${app.scholarship.degreeLevel || "N/A"}
LOCATION: ${app.scholarship.location || "N/A"}

APPLICANT PROFILE:
- Full Name: ${profile.fullName || req.user.fullName || "Applicant"}
- Nationality: ${profile.nationality || "N/A"}
- Highest Degree: ${profile.highestDegree || "N/A"}
- Field of Study: ${profile.fieldOfStudy || "N/A"}
- GPA: ${profile.gpa || "N/A"}
- Target Countries: ${(profile.targetCountries || []).join(", ") || "N/A"}

Write a compelling personal statement/essay for this scholarship application. 
The essay should:
1. Introduce the applicant and their academic background
2. Explain why they are pursuing this field of study
3. Describe how this scholarship will help achieve their goals
4. Connect their background to the scholarship's mission

Keep it between 400-600 words. Write in first person.`;

    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API key not configured" });
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(502).json({ error: `Gemini API error: ${errText.slice(0, 200)}` });
    }

    const geminiData = await geminiRes.json();
    const essay =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "Failed to generate essay.";

    await prisma.application.update({
      where: { id: app.id },
      data: { essayContent: essay, progress: Math.max(app.progress, 70) },
    });

    res.json({ essay, applicationId: app.id });
  } catch (err) {
    next(err);
  }
}
