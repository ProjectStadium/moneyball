const fs = require('fs').promises;
const path = require('path');

exports.getRawData = async (req, res) => {
  try {
    // Get the most recent data file using absolute path
    const dataDir = path.resolve(__dirname, '../../data');
    console.log('Looking for data files in:', dataDir);
    
    try {
      const files = await fs.readdir(dataDir);
      console.log('Found files:', files);
      
      const dataFiles = files.filter(file => file.startsWith('vlr_raw_data_'));
      console.log('Filtered data files:', dataFiles);
      
      if (dataFiles.length === 0) {
        console.log('No data files found');
        return res.status(404).json({ message: 'No data files found' });
      }

      // Sort by date and get the most recent
      const latestFile = dataFiles.sort().pop();
      console.log('Selected latest file:', latestFile);
      
      const filePath = path.join(dataDir, latestFile);
      console.log('Full file path:', filePath);
      
      // Read and parse the file
      const data = await fs.readFile(filePath, 'utf8');
      const players = JSON.parse(data);
      console.log(`Successfully read ${players.length} players from file`);

      res.json(players);
    } catch (dirError) {
      console.error('Error accessing directory:', dirError);
      res.status(500).json({ 
        message: 'Error accessing data directory',
        error: dirError.message,
        path: dataDir
      });
    }
  } catch (error) {
    console.error('Error reading raw data:', error);
    res.status(500).json({ 
      message: 'Error reading raw data',
      error: error.message,
      stack: error.stack
    });
  }
}; 