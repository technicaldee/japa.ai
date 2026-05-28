import prisma from "../utils/prisma.js";

export async function listScholarships(_req, res, next) {
  try {
    const scholarships = await prisma.scholarship.findMany({ orderBy: { createdAt: "desc" } });
    const parsed = scholarships.map((s) => ({
      ...s,
      eligibility: typeof s.eligibility === "string" ? JSON.parse(s.eligibility) : s.eligibility,
    }));
    res.json(parsed);
  } catch (err) {
    next(err);
  }
}

export async function getScholarship(req, res, next) {
  try {
    const scholarship = await prisma.scholarship.findUnique({
      where: { id: req.params.id },
      include: { applications: true },
    });
    if (!scholarship) {
      return res.status(404).json({ error: "Scholarship not found" });
    }
    scholarship.eligibility =
      typeof scholarship.eligibility === "string"
        ? JSON.parse(scholarship.eligibility)
        : scholarship.eligibility;
    res.json(scholarship);
  } catch (err) {
    next(err);
  }
}

export async function createScholarship(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.eligibility && Array.isArray(data.eligibility)) {
      data.eligibility = JSON.stringify(data.eligibility);
    }
    if (data.deadline) {
      data.deadline = new Date(data.deadline);
    }
    const scholarship = await prisma.scholarship.create({ data });
    scholarship.eligibility =
      typeof scholarship.eligibility === "string"
        ? JSON.parse(scholarship.eligibility)
        : scholarship.eligibility;
    res.status(201).json(scholarship);
  } catch (err) {
    next(err);
  }
}
