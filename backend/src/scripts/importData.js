// src/scripts/importData.js
const { importAllData } = require('../utils/importData');

// Run the import function
(async () => {
  console.log('Starting data import process...');
  const result = await importAllData();
  
  if (result.success) {
    console.log('Import completed successfully!');
    process.exit(0);
  } else {
    console.error('Import failed:', result.error);
    process.exit(1);
  }
})();