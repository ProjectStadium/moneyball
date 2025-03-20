import dotenv from 'dotenv';

// Explicitly load the .env.test file
dotenv.config({ path: '.env.test' });

// Log the POSTGRES_HOST variable to verify it's loaded
console.log('POSTGRES_HOST:', process.env.POSTGRES_HOST);