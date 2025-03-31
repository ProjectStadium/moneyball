import { importPlayerData, updatePlayerData } from '../services/dataImportService';

const importData = async () => {
  try {
    console.log('Starting data import...');
    
    // First, try to update existing data
    console.log('Updating existing player data...');
    await updatePlayerData();
    console.log('Player data update completed');

    // Then, import any new data
    console.log('Importing new player data...');
    await importPlayerData();
    console.log('Player data import completed');

    console.log('Data import process completed successfully');
  } catch (error) {
    console.error('Error during data import:', error);
    process.exit(1);
  }
};

// Run the import if this file is executed directly
if (require.main === module) {
  importData();
}

export default importData; 