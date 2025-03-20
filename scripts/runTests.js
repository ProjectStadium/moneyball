// scripts/runTests.js
const { execSync } = require('child_process');
const fs = require('fs');

// Create test report directory
if (!fs.existsSync('./test-reports')) {
  fs.mkdirSync('./test-reports');
}

try {
  // Run unit tests
  console.log('Running unit tests...');
  execSync('npx jest --testPathIgnorePatterns=load', { stdio: 'inherit' });
  
  // Run API tests
  console.log('Running API tests...');
  execSync('npx jest --testPathPattern=routes', { stdio: 'inherit' });
  
  // Run load tests
  console.log('Running load tests...');
  execSync('npx jest --testPathPattern=load', { stdio: 'inherit' });
  
  console.log('All tests completed successfully!');
} catch (error) {
  console.error('Test execution failed:', error);
  process.exit(1);
}