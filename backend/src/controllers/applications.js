import prisma from "../utils/prisma.js";

export async function listApplications(req, res, next) {
  try {
    const applications = await prisma.application.findMany({
      where: { userId: req.user.id },
      include: { scholarship: true },
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
      include: { scholarship: true },
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
    const { scholarshipId, deadline } = req.body;
    if (!scholarshipId) {
      return res.status(400).json({ error: "scholarshipId is required" });
    }
    const app = await prisma.application.create({
      data: {
        userId: req.user.id,
        scholarshipId,
        deadline: deadline ? new Date(deadline) : null,
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
    const app = await prisma.application.update({
      where: { id: req.params.id },
      data,
      include: { scholarship: true },
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
