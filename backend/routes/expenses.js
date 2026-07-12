const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all fuel logs
router.get('/fuel', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT f.*, 
             v.make as vehicle_make, v.model as vehicle_model, v.license_plate as vehicle_plate,
             d.name as driver_name
      FROM fuel_logs f
      JOIN vehicles v ON f.vehicle_id = v.id
      JOIN drivers d ON f.driver_id = d.id
      ORDER BY f.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching fuel logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new fuel log with Fuel Anomaly checking
router.post('/fuel', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  const { vehicle_id, driver_id, fuel_amount, distance_traveled, cost, date } = req.body;

  const fuel = parseFloat(fuel_amount);
  const dist = parseFloat(distance_traveled);
  const price = parseFloat(cost);

  if (isNaN(fuel) || isNaN(dist) || isNaN(price) || !vehicle_id || !driver_id) {
    return res.status(400).json({ error: 'Missing required fuel fields or invalid numbers' });
  }

  try {
    // 1. Calculate current efficiency
    const currentEff = fuel > 0 ? dist / fuel : 0;

    // 2. Fetch rolling average of past logs for this vehicle
    const pastLogsRes = await db.query(
      'SELECT fuel_amount, distance_traveled FROM fuel_logs WHERE vehicle_id = $1',
      [vehicle_id]
    );

    let rollingAvgEff = 0;
    if (pastLogsRes.rows.length > 0) {
      let totalFuel = 0;
      let totalDist = 0;
      pastLogsRes.rows.forEach(log => {
        totalFuel += parseFloat(log.fuel_amount);
        totalDist += parseFloat(log.distance_traveled);
      });
      rollingAvgEff = totalFuel > 0 ? totalDist / totalFuel : 0;
    }

    // 3. Save the fuel log
    const result = await db.query(
      `INSERT INTO fuel_logs (vehicle_id, driver_id, date, fuel_amount, distance_traveled, cost)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [vehicle_id, driver_id, date || new Date(), fuel, dist, price]
    );

    const newLog = result.rows[0];

    // 4. Anomaly detection: if efficiency is >25% lower than rolling average (only trigger if rolling average exists and is non-zero)
    if (rollingAvgEff > 0 && currentEff > 0) {
      const dropPercent = (rollingAvgEff - currentEff) / rollingAvgEff;
      if (dropPercent > 0.25) {
        const dropPercentText = (dropPercent * 100).toFixed(1);
        const reason = `Fuel efficiency of ${currentEff.toFixed(2)} km/L is ${dropPercentText}% lower than the vehicle's rolling average of ${rollingAvgEff.toFixed(2)} km/L.`;

        // Create alert
        await db.query(
          `INSERT INTO alerts (type, vehicle_id, description, severity, resolved)
           VALUES ('Fuel Anomaly', $1, $2, 'Warning', FALSE)`,
          [vehicle_id, reason]
        );
      }
    }

    res.status(201).json(newLog);
  } catch (err) {
    console.error('Error creating fuel log:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET other expenses
router.get('/other', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT o.*, t.source, t.destination, v.license_plate
      FROM other_expenses o
      LEFT JOIN trips t ON o.trip_id = t.id
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      ORDER BY o.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new other expense
router.post('/other', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  const { trip_id, type, amount, description } = req.body;

  if (!trip_id || !type || !amount) {
    return res.status(400).json({ error: 'Missing required expense fields: trip_id, type, amount' });
  }

  try {
    const result = await db.query(
      `INSERT INTO other_expenses (trip_id, type, amount, description)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [trip_id, type, amount, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating other expense:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
