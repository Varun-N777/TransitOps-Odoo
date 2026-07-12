const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all vehicles
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, home_depot } = req.query;
    let queryText = 'SELECT * FROM vehicles WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    if (home_depot) {
      params.push(home_depot);
      queryText += ` AND home_depot = $${params.length}`;
    }

    queryText += ' ORDER BY id DESC';

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching vehicles:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new vehicle
router.post('/', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  const { make, model, year, license_plate, max_cargo_weight, odometer, status, home_depot, acquisition_cost } = req.body;
  
  if (!make || !model || !year || !license_plate || !max_cargo_weight || !home_depot) {
    return res.status(400).json({ error: 'Missing required vehicle fields' });
  }

  try {
    const checkPlate = await db.query('SELECT * FROM vehicles WHERE license_plate = $1', [license_plate]);
    if (checkPlate.rows.length > 0) {
      return res.status(400).json({ error: 'Vehicle license plate already exists' });
    }

    const result = await db.query(
      `INSERT INTO vehicles (make, model, year, license_plate, max_cargo_weight, odometer, status, home_depot, acquisition_cost)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [
        make,
        model,
        year,
        license_plate,
        max_cargo_weight,
        odometer || 0,
        status || 'Available',
        home_depot,
        acquisition_cost || 0.00
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating vehicle:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update vehicle
router.put('/:id', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  const { id } = req.params;
  const { make, model, year, license_plate, max_cargo_weight, odometer, status, home_depot, acquisition_cost } = req.body;

  try {
    const checkVehicle = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (checkVehicle.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const result = await db.query(
      `UPDATE vehicles
       SET make = COALESCE($1, make),
           model = COALESCE($2, model),
           year = COALESCE($3, year),
           license_plate = COALESCE($4, license_plate),
           max_cargo_weight = COALESCE($5, max_cargo_weight),
           odometer = COALESCE($6, odometer),
           status = COALESCE($7, status),
           home_depot = COALESCE($8, home_depot),
           acquisition_cost = COALESCE($9, acquisition_cost)
       WHERE id = $10 RETURNING *`,
      [make, model, year, license_plate, max_cargo_weight, odometer, status, home_depot, acquisition_cost, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating vehicle:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE vehicle
router.delete('/:id', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  const { id } = req.params;
  try {
    const checkVehicle = await db.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (checkVehicle.rows.length === 0) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    await db.query('DELETE FROM vehicles WHERE id = $1', [id]);
    res.json({ message: 'Vehicle deleted successfully' });
  } catch (err) {
    console.error('Error deleting vehicle:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
