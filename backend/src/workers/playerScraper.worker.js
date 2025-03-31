const { parentPort, workerData } = require('worker_threads');
const VLRScraper = require('../services/vlrScraper.service');
const db = require('../models');

async function scrapePlayerDetails(playerUrl) {
  const scraper = new VLRScraper(db);
  try {
    const details = await scraper.scrapePlayerDetails(playerUrl);
    parentPort.postMessage({ success: true, data: details });
  } catch (error) {
    parentPort.postMessage({ success: false, error: error.message });
  }
}

if (workerData && workerData.playerUrl) {
  scrapePlayerDetails(workerData.playerUrl);
} 