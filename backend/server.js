const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRouter = require('./routes/auth');
const vehiclesRouter = require('./routes/vehicles');
const driversRouter = require('./routes/drivers');
const tripsRouter = require('./routes/trips');
const maintenanceRouter = require('./routes/maintenance');
const expensesRouter = require('./routes/expenses');
const dashboardRouter = require('./routes/dashboard');
const reportsRouter = require('./routes/reports');

app.use('/api/auth', authRouter);
app.use('/api/vehicles', vehiclesRouter);
app.use('/api/drivers', driversRouter);
app.use('/api/trips', tripsRouter);
app.use('/api/maintenance', maintenanceRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'TransitOps API running smoothly' });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TransitOps server listening on port ${PORT}`);
});
