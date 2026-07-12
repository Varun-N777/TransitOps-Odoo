const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all maintenance logs
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.*, v.make as vehicle_make, v.model as vehicle_model, v.license_plate as vehicle_plate
      FROM maintenance_logs m
      JOIN vehicles v ON m.vehicle_id = v.id
      ORDER BY m.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching maintenance logs:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST create maintenance log
router.post('/', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  const { vehicle_id, description, odometer_at_service, cost, start_date } = req.body;

  if (!vehicle_id || !description || !odometer_at_service) {
    return res.status(400).json({ error: 'Missing required fields: vehicle_id, description, odometer_at_service' });
  }

  try {
    const checkVehicle = await db.query('SELECT status FROM vehicles WHERE id = $1', [vehicle_id]);
    if (checkVehicle.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const result = await db.query(
      `INSERT INTO maintenance_logs (vehicle_id, description, status, odometer_at_service, cost, start_date)
       VALUES ($1, $2, 'Open', $3, $4, $5) RETURNING *`,
      [vehicle_id, description, odometer_at_service, cost || 0.00, start_date || new Date()]
    );

    // Set vehicle status to 'In Shop'
    await db.query("UPDATE vehicles SET status = 'In Shop' WHERE id = $1", [vehicle_id]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating maintenance log:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST close maintenance log
router.post('/:id/close', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  const { id } = req.params;
  const { cost, end_date } = req.body;

  try {
    const logRes = await db.query('SELECT * FROM maintenance_logs WHERE id = $1', [id]);
    if (logRes.rows.length === 0) {
      return res.status(404).json({ error: 'Maintenance log not found' });
    }

    const log = logRes.rows[0];
    if (log.status === 'Closed') {
      return res.status(400).json({ error: 'Maintenance is already closed' });
    }

    const finalCost = cost !== undefined ? cost : log.cost;
    const finalEndDate = end_date || new Date();

    // Close log
    const updatedLogRes = await db.query(
      `UPDATE maintenance_logs
       SET status = 'Closed', cost = $1, end_date = $2
       WHERE id = $3 RETURNING *`,
      [finalCost, finalEndDate, id]
    );

    // Retrieve vehicle details to check if status is Retired
    const vehRes = await db.query('SELECT status, odometer FROM vehicles WHERE id = $1', [log.vehicle_id]);
    if (vehRes.rows.length > 0) {
      const currentStatus = vehRes.rows[0].status;
      // Closing maintenance sets the vehicle status back to Available unless the vehicle's status is Retired
      if (currentStatus !== 'Retired') {
        await db.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [log.vehicle_id]);
      }
    }

    res.json(updatedLogRes.rows[0]);
  } catch (err) {
    console.error('Error closing maintenance log:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
