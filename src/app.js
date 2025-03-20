// src/app.js
import dotenv from 'dotenv';

// Load environment variables from .env or .env.test
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { db } from './models/index.js'; // Ensure models/index.js is converted to ES Modules
import playerRoutes from './routes/player.routes.js';
import teamRoutes from './routes/team.routes.js';
import analysisRoutes from './routes/analysis.routes.js';
import adminRoutes from './routes/admin.routes.js';
import scheduler from './services/scheduler.service.js';

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev')); // Logging

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Moneyball API' });
});

// Import routes
app.use('/api/players', playerRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/admin', adminRoutes);

// Initialize the scheduler when the application starts
scheduler.init();

export default app;