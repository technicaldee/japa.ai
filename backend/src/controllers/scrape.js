import { runScraper, getScraperStatus } from "../services/scraper.js";

export async function triggerScrape(req, res, next) {
  try {
    const result = await runScraper();
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function scraperStatus(req, res, next) {
  try {
    const status = await getScraperStatus();
    res.json(status);
  } catch (err) {
    next(err);
  }
}
