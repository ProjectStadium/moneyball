const { spawn } = require('child_process');
const path = require('path');

// Number of scraper instances to run
const NUM_INSTANCES = 3;

// Create PM2 ecosystem config
const ecosystemConfig = {
  apps: Array.from({ length: NUM_INSTANCES }, (_, i) => ({
    name: `vlr-scraper-${i + 1}`,
    script: path.join(__dirname, '../services/vlrScraper.service.js'),
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      SCRAPER_INSTANCE: i + 1
    }
  }))
};

// Write ecosystem config to file
const fs = require('fs');
fs.writeFileSync(
  path.join(__dirname, 'ecosystem.config.js'),
  `module.exports = ${JSON.stringify(ecosystemConfig, null, 2)}`
);

// Start PM2 with the ecosystem config
const pm2 = spawn('pm2', ['start', 'ecosystem.config.js'], {
  stdio: 'inherit',
  shell: true
});

pm2.on('close', (code) => {
  console.log(`PM2 process exited with code ${code}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Stopping all scraper instances...');
  spawn('pm2', ['delete', 'all'], {
    stdio: 'inherit',
    shell: true
  }).on('close', () => {
    process.exit(0);
  });
}); 