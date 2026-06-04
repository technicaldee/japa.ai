import prisma from "../utils/prisma.js";

export async function getOverview(req, res, next) {
  try {
    const [users, applications, documents, recentActivity] = await Promise.all([
      prisma.user.count(),
      prisma.application.count(),
      prisma.document.count(),
      prisma.activityLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
    ]);
    res.json({ users, applications, documents, recentActivity });
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsGrowth(req, res, next) {
  try {
    const snapshots = await prisma.analyticsSnapshot.findMany({
      where: { label: "growth" },
      orderBy: { createdAt: "asc" },
    });
    res.json(snapshots.map((s) => ({ ...s, data: JSON.parse(s.data) })));
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsUsers(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, email: true, fullName: true, role: true, createdAt: true },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsHotspots(req, res, next) {
  try {
    const users = await prisma.user.findMany({
      select: { profile: { select: { targetCountries: true } } },
    });
    const countryCounts = {};
    for (const u of users) {
      if (u.profile?.targetCountries) {
        const countries = JSON.parse(u.profile.targetCountries);
        for (const c of countries) {
          countryCounts[c] = (countryCounts[c] || 0) + 1;
        }
      }
    }
    const hotspots = Object.entries(countryCounts)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
    res.json(hotspots);
  } catch (err) {
    next(err);
  }
}

export async function getAnalyticsSuccessRate(req, res, next) {
  try {
    const total = await prisma.application.count();
    const completed = await prisma.application.count({ where: { status: "completed" } });
    res.json({ total, completed, rate: total > 0 ? Math.round((completed / total) * 100) : 0 });
  } catch (err) {
    next(err);
  }
}

export async function getActivity(req, res, next) {
  try {
    const logs = await prisma.activityLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}
