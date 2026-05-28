import prisma from "../utils/prisma.js";

export async function getProfile(req, res, next) {
  try {
    let profile = await prisma.profile.findUnique({
      where: { userId: req.user.id },
    });
    if (!profile) {
      profile = await prisma.profile.create({
        data: { userId: req.user.id },
      });
    }
    if (profile.targetCountries && typeof profile.targetCountries === "string") {
      profile.targetCountries = JSON.parse(profile.targetCountries);
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = { ...req.body };
    if (data.targetCountries && Array.isArray(data.targetCountries)) {
      data.targetCountries = JSON.stringify(data.targetCountries);
    }
    const profile = await prisma.profile.upsert({
      where: { userId: req.user.id },
      create: { userId: req.user.id, ...data },
      update: data,
    });
    if (profile.targetCountries && typeof profile.targetCountries === "string") {
      profile.targetCountries = JSON.parse(profile.targetCountries);
    }
    res.json(profile);
  } catch (err) {
    next(err);
  }
}
