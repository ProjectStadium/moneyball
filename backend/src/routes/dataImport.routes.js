const express = require('express');
const router = express.Router();

// Simple test route
router.get('/test', (req, res) => {
  console.log('Test route hit');
  res.json({ message: 'Test route working' });
});

// Raw data route
router.get('/raw-data', (req, res) => {
  console.log('Raw data route hit');
  res.json({ message: 'Raw data route working' });
});

module.exports = router; 