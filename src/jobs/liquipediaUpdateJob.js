const cron = require('node-cron');
const path = require('path');
const { spawn } = require('child_process');

// Schedule the job to run every day at 2 AM
cron.schedule('0 2 * * *', () => {
  console.log('Starting Liquipedia update job...');
  
  const updateScript = spawn('node', [
    path.join(__dirname, '../scripts/updateLiquipediaData.js')
  ]);

  updateScript.stdout.on('data', (data) => {
    console.log(`Update job output: ${data}`);
  });

  updateScript.stderr.on('data', (data) => {
    console.error(`Update job error: ${data}`);
  });

  updateScript.on('close', (code) => {
    console.log(`Update job completed with code ${code}`);
  });
}); 