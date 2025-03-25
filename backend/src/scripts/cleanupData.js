const fs = require('fs');
const path = require('path');

function cleanupDataFiles() {
    const dataDir = path.join(__dirname, '../../data');
    const files = fs.readdirSync(dataDir);
    
    // Group files by timestamp
    const fileGroups = {};
    files.forEach(file => {
        if (file.startsWith('vlr_')) {
            const timestamp = file.split('_').slice(-1)[0].replace('.json', '');
            if (!fileGroups[timestamp]) {
                fileGroups[timestamp] = [];
            }
            fileGroups[timestamp].push(file);
        }
    });
    
    // Sort timestamps in descending order
    const timestamps = Object.keys(fileGroups).sort().reverse();
    
    // Keep the most recent 3 sets of files
    const keepCount = 3;
    timestamps.slice(keepCount).forEach(timestamp => {
        fileGroups[timestamp].forEach(file => {
            const filePath = path.join(dataDir, file);
            fs.unlinkSync(filePath);
            console.log(`Deleted: ${file}`);
        });
    });
    
    console.log(`Cleanup complete. Kept ${keepCount} most recent data sets.`);
}

// Run cleanup
cleanupDataFiles(); 