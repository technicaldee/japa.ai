import prisma from "../utils/prisma.js";

export async function listSources(req, res, next) {
  try {
    const sources = await prisma.scraperSource.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(sources);
  } catch (err) {
    next(err);
  }
}

export async function createSource(req, res, next) {
  try {
    const { name, url, type, schedule } = req.body;
    if (!name || !url) {
      return res.status(400).json({ error: "Name and URL are required" });
    }
    const source = await prisma.scraperSource.create({
      data: { name, url, type: type || "rss", schedule: schedule || "daily" },
    });
    res.status(201).json(source);
  } catch (err) {
    next(err);
  }
}

export async function updateSource(req, res, next) {
  try {
    const { id } = req.params;
    const { name, url, type, status, schedule } = req.body;
    const source = await prisma.scraperSource.update({
      where: { id },
      data: { name, url, type, status, schedule },
    });
    res.json(source);
  } catch (err) {
    next(err);
  }
}

export async function deleteSource(req, res, next) {
  try {
    const { id } = req.params;
    await prisma.scraperSource.delete({ where: { id } });
    res.json({ message: "Source deleted" });
  } catch (err) {
    next(err);
  }
}

export async function getScraperStats(req, res, next) {
  try {
    const [totalSources, activeSources, totalScraped, pendingOpportunities] =
      await Promise.all([
        prisma.scraperSource.count(),
        prisma.scraperSource.count({ where: { status: "active" } }),
        prisma.scrapedOpportunity.count(),
        prisma.scrapedOpportunity.count({ where: { status: "pending" } }),
      ]);
    res.json({ totalSources, activeSources, totalScraped, pendingOpportunities });
  } catch (err) {
    next(err);
  }
}

export async function getPendingOpportunities(req, res, next) {
  try {
    const opportunities = await prisma.scrapedOpportunity.findMany({
      where: { status: "pending" },
      include: { source: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json(opportunities);
  } catch (err) {
    next(err);
  }
}

export async function approveOpportunity(req, res, next) {
  try {
    const { id } = req.params;
    const opp = await prisma.scrapedOpportunity.update({
      where: { id },
      data: { status: "approved" },
    });
    res.json(opp);
  } catch (err) {
    next(err);
  }
}

export async function rejectOpportunity(req, res, next) {
  try {
    const { id } = req.params;
    const opp = await prisma.scrapedOpportunity.update({
      where: { id },
      data: { status: "rejected" },
    });
    res.json(opp);
  } catch (err) {
    next(err);
  }
}

export async function getScraperInsights(req, res, next) {
  try {
    const opportunities = await prisma.scrapedOpportunity.findMany();
    const sources = await prisma.scraperSource.findMany();

    const totalScraped = opportunities.length;
    const totalSources = sources.length;
    const activeSources = sources.filter((s) => s.status === "active").length;

    const sourceBreakdown = {};
    for (const opp of opportunities) {
      const source = sources.find((s) => s.id === opp.sourceId);
      const name = source ? source.name : "Unknown";
      sourceBreakdown[name] = (sourceBreakdown[name] || 0) + 1;
    }

    res.json({ totalScraped, totalSources, activeSources, sourceBreakdown });
  } catch (err) {
    next(err);
  }
}
