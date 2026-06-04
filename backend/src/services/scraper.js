import prisma from "../utils/prisma.js";
import Scholarship from "../models/Scholarship.js";
import { isMongoConnected } from "../config/mongodb.js";

async function fetchRSS(url) {
  const res = await fetch(url);
  const xml = await res.text();
  const items = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const get = (tag) => {
      const m = match[1].match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? m[1].trim() : "";
    };
    items.push({
      title: get("title"),
      link: get("link").replace(/<!\[CDATA\[|\]\]>/g, ""),
      description: get("description"),
      pubDate: get("pubDate"),
      expiryDate: get("expiryDate"),
    });
  }
  return items;
}

function cleanHTML(str) {
  return str.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

export async function runScraper() {
  if (!isMongoConnected()) {
    console.log("MongoDB not connected, skipping scraper");
    return { sources: 0, items: 0 };
  }

  const sources = await prisma.scraperSource.findMany({
    where: { status: "active" },
  });

  let totalItems = 0;

  for (const source of sources) {
    try {
      const items = await fetchRSS(source.url);
      let parsed = 0;

      for (const item of items) {
        const exists = await Scholarship.findOne({ url: item.link });
        if (exists) continue;

        const data = await parseWithGemini(item, source);
        await Scholarship.create({ ...data, source: source.name, sourceUrl: source.url, url: item.link });
        parsed++;
      }

      await prisma.scraperSource.update({
        where: { id: source.id },
        data: { lastRun: new Date() },
      });

      await prisma.activityLog.create({
        data: {
          action: "scraper_run",
          resource: "scraper",
          details: `${source.name} scraped ${parsed} new opportunities`,
        },
      });

      totalItems += parsed;
      console.log(`Scraped ${parsed} from ${source.name}`);
    } catch (err) {
      console.error(`Error scraping ${source.name}:`, err.message);
    }
  }

  return { sources: sources.length, items: totalItems };
}

async function parseWithGemini(item, source) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return fallbackParse(item, source);
  }

  try {
    const prompt = `Extract structured scholarship data from this RSS item. Return ONLY valid JSON with no markdown or extra text.

Item title: ${item.title}
Item description: ${cleanHTML(item.description).slice(0, 2000)}
Source: ${source.name}

JSON format:
{
  "title": "string",
  "provider": "string",
  "description": "string",
  "funding": "Fully Funded | Partial | Tuition Only | Not specified",
  "deadline": "YYYY-MM-DD or empty string if not found",
  "location": "string (country or remote)",
  "degreeLevel": "Master's | PhD | Bachelor's | Multiple | Not specified",
  "eligibility": ["requirement1", "requirement2"],
  "tags": ["tag1", "tag2"]
}`;

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
        }),
      }
    );

    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const cleaned = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(cleaned);

    return {
      title: data.title || item.title,
      provider: data.provider || source.name,
      description: data.description || cleanHTML(item.description).slice(0, 500),
      funding: data.funding || "Not specified",
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      location: data.location || "Not specified",
      degreeLevel: data.degreeLevel || "Not specified",
      eligibility: data.eligibility || [],
      tags: data.tags || [],
    };
  } catch {
    return fallbackParse(item, source);
  }
}

function fallbackParse(item, source) {
  const desc = cleanHTML(item.description);
  return {
    title: item.title,
    provider: source.name,
    description: desc.slice(0, 500),
    funding: "Not specified",
    location: "Not specified",
    degreeLevel: "Not specified",
    eligibility: [],
    tags: [],
  };
}

export async function getScraperStatus() {
  const total = await Scholarship.countDocuments();
  const byLocation = await Scholarship.aggregate([
    { $group: { _id: "$location", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);
  return { total, byLocation };
}
