import { updatePlayerData } from '../services/dataImportService';

async function main() {
  try {
    console.log('Starting data import process...');
    await updatePlayerData();
    console.log('Data import completed successfully!');
  } catch (error) {
    console.error('Error during data import:', error);
    process.exit(1);
  }
}

main(); 