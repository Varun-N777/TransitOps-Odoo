const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all drivers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status } = req.query;
    let queryText = 'SELECT * FROM drivers WHERE 1=1';
    const params = [];

    if (status) {
      params.push(status);
      queryText += ` AND status = $${params.length}`;
    }

    queryText += ' ORDER BY id DESC';

    const result = await db.query(queryText, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching drivers:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new driver
router.post('/', authenticateToken, requireRole(['Fleet Manager', 'Safety Officer']), async (req, res) => {
  const { user_id, name, license_number, license_expiry, safety_score, status } = req.body;

  if (!name || !license_number || !license_expiry) {
    return res.status(400).json({ error: 'Missing required driver fields' });
  }

  try {
    const checkLicense = await db.query('SELECT * FROM drivers WHERE license_number = $1', [license_number]);
    if (checkLicense.rows.length > 0) {
      return res.status(400).json({ error: 'Driver license number already exists' });
    }

    const result = await db.query(
      `INSERT INTO drivers (user_id, name, license_number, license_expiry, safety_score, status)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        user_id || null,
        name,
        license_number,
        license_expiry,
        safety_score || 100.00,
        status || 'Available'
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating driver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT update driver
router.put('/:id', authenticateToken, requireRole(['Fleet Manager', 'Safety Officer']), async (req, res) => {
  const { id } = req.params;
  const { user_id, name, license_number, license_expiry, safety_score, status } = req.body;

  // Drivers themselves shouldn't update their safety_score or status, but Fleet Manager and Safety Officer can.
  try {
    const checkDriver = await db.query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (checkDriver.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    const result = await db.query(
      `UPDATE drivers
       SET user_id = COALESCE($1, user_id),
           name = COALESCE($2, name),
           license_number = COALESCE($3, license_number),
           license_expiry = COALESCE($4, license_expiry),
           safety_score = COALESCE($5, safety_score),
           status = COALESCE($6, status)
       WHERE id = $7 RETURNING *`,
      [user_id, name, license_number, license_expiry, safety_score, status, id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating driver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE driver
router.delete('/:id', authenticateToken, requireRole(['Fleet Manager']), async (req, res) => {
  const { id } = req.params;
  try {
    const checkDriver = await db.query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (checkDriver.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    await db.query('DELETE FROM drivers WHERE id = $1', [id]);
    res.json({ message: 'Driver deleted successfully' });
  } catch (err) {
    console.error('Error deleting driver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
