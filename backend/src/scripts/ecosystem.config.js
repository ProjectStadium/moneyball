module.exports = {
  "apps": [
    {
      "name": "vlr-scraper-1",
      "script": "/mnt/a/moneyball-1/backend/src/services/vlrScraper.service.js",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "development",
        "SCRAPER_INSTANCE": 1
      }
    },
    {
      "name": "vlr-scraper-2",
      "script": "/mnt/a/moneyball-1/backend/src/services/vlrScraper.service.js",
      "instances": 1,
      "autorestart": true,
      "watch": false,
      "max_memory_restart": "1G",
      "env": {
        "NODE_ENV": "development",
        "SCRAPER_INSTANCE": 2
      }
    }
  ]
}