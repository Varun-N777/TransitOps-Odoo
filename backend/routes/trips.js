const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// GET all trips
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT t.*, 
             v.make as vehicle_make, v.model as vehicle_model, v.license_plate as vehicle_plate,
             d.name as driver_name
      FROM trips t
      LEFT JOIN vehicles v ON t.vehicle_id = v.id
      LEFT JOIN drivers d ON t.driver_id = d.id
      ORDER BY t.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching trips:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST new trip
router.post('/', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  const { source, destination, cargo_weight, revenue, vehicle_id, driver_id, status } = req.body;

  if (!source || !destination || !cargo_weight) {
    return res.status(400).json({ error: 'Missing source, destination or cargo weight' });
  }

  try {
    // If dispatch is requested immediately
    if (status === 'Dispatched') {
      if (!vehicle_id || !driver_id) {
        return res.status(400).json({ error: 'Vehicle and Driver are required to dispatch a trip' });
      }

      // Check vehicle availability
      const vehRes = await db.query('SELECT status FROM vehicles WHERE id = $1', [vehicle_id]);
      if (vehRes.rows.length === 0 || vehRes.rows[0].status !== 'Available') {
        return res.status(400).json({ error: 'Vehicle is not available' });
      }

      // Check driver availability
      const drvRes = await db.query('SELECT status FROM drivers WHERE id = $1', [driver_id]);
      if (drvRes.rows.length === 0 || drvRes.rows[0].status !== 'Available') {
        return res.status(400).json({ error: 'Driver is not available' });
      }
    }

    const initialStatus = status || 'Draft';

    const result = await db.query(
      `INSERT INTO trips (source, destination, cargo_weight, status, vehicle_id, driver_id, revenue)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [source, destination, cargo_weight, initialStatus, vehicle_id || null, driver_id || null, revenue || 0.00]
    );

    const trip = result.rows[0];

    // If dispatched, update vehicle and driver status
    if (initialStatus === 'Dispatched') {
      await db.query("UPDATE vehicles SET status = 'On Trip' WHERE id = $1", [vehicle_id]);
      await db.query("UPDATE drivers SET status = 'On Trip' WHERE id = $1", [driver_id]);
    }

    res.status(201).json(trip);
  } catch (err) {
    console.error('Error creating trip:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST dispatch existing trip
router.post('/:id/dispatch', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  const { id } = req.params;
  const { vehicle_id, driver_id } = req.body;

  try {
    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripRes.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripRes.rows[0];
    if (trip.status !== 'Draft') {
      return res.status(400).json({ error: 'Only Draft trips can be dispatched' });
    }

    const vId = vehicle_id || trip.vehicle_id;
    const dId = driver_id || trip.driver_id;

    if (!vId || !dId) {
      return res.status(400).json({ error: 'Both Vehicle and Driver are required for dispatch' });
    }

    // Validate availability
    const veh = await db.query('SELECT status FROM vehicles WHERE id = $1', [vId]);
    if (veh.rows.length === 0 || veh.rows[0].status !== 'Available') {
      return res.status(400).json({ error: 'Vehicle is not available' });
    }

    const drv = await db.query('SELECT status, license_expiry FROM drivers WHERE id = $1', [dId]);
    if (drv.rows.length === 0 || drv.rows[0].status !== 'Available') {
      return res.status(400).json({ error: 'Driver is not available' });
    }

    if (new Date(drv.rows[0].license_expiry) < new Date()) {
      return res.status(400).json({ error: 'Driver license has expired' });
    }

    // Update statuses
    await db.query("UPDATE trips SET status = 'Dispatched', vehicle_id = $1, driver_id = $2 WHERE id = $3", [vId, dId, id]);
    await db.query("UPDATE vehicles SET status = 'On Trip' WHERE id = $1", [vId]);
    await db.query("UPDATE drivers SET status = 'On Trip' WHERE id = $1", [dId]);

    res.json({ message: 'Trip successfully dispatched' });
  } catch (err) {
    console.error('Error dispatching trip:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST cancel trip
router.post('/:id/cancel', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  const { id } = req.params;

  try {
    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripRes.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripRes.rows[0];
    if (trip.status === 'Cancelled' || trip.status === 'Completed') {
      return res.status(400).json({ error: `Cannot cancel a trip that is already ${trip.status}` });
    }

    const oldStatus = trip.status;

    // Update trip status to Cancelled
    await db.query("UPDATE trips SET status = 'Cancelled' WHERE id = $1", [id]);

    // If cancelled in Dispatched state -> vehicle and driver revert to Available
    if (oldStatus === 'Dispatched') {
      if (trip.vehicle_id) {
        await db.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [trip.vehicle_id]);
      }
      if (trip.driver_id) {
        await db.query("UPDATE drivers SET status = 'Available' WHERE id = $1", [trip.driver_id]);
      }
    }

    res.json({ message: 'Trip cancelled successfully' });
  } catch (err) {
    console.error('Error cancelling trip:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST complete trip
router.post('/:id/complete', authenticateToken, requireRole(['Fleet Manager', 'Driver']), async (req, res) => {
  const { id } = req.params;
  const { odometer_reading, fuel_amount, fuel_cost } = req.body;

  try {
    const tripRes = await db.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (tripRes.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }

    const trip = tripRes.rows[0];
    if (trip.status !== 'Dispatched') {
      return res.status(400).json({ error: 'Only Dispatched trips can be completed' });
    }

    // Complete trip
    await db.query("UPDATE trips SET status = 'Completed', completed_at = CURRENT_TIMESTAMP WHERE id = $1", [id]);

    // Revert statuses to Available
    if (trip.vehicle_id) {
      await db.query("UPDATE vehicles SET status = 'Available' WHERE id = $1", [trip.vehicle_id]);
      if (odometer_reading) {
        await db.query("UPDATE vehicles SET odometer = $1 WHERE id = $2", [odometer_reading, trip.vehicle_id]);
      }
    }
    if (trip.driver_id) {
      await db.query("UPDATE drivers SET status = 'Available' WHERE id = $1", [trip.driver_id]);
    }

    // Optional: Log fuel if submitted upon completion
    if (trip.vehicle_id && trip.driver_id && fuel_amount && fuel_cost && odometer_reading) {
      const vehRes = await db.query('SELECT odometer FROM vehicles WHERE id = $1', [trip.vehicle_id]);
      const prevOdo = vehRes.rows[0] ? vehRes.rows[0].odometer : 0;
      const distance = Math.max(0, odometer_reading - prevOdo);

      await db.query(
        `INSERT INTO fuel_logs (vehicle_id, driver_id, date, fuel_amount, distance_traveled, cost)
         VALUES ($1, $2, CURRENT_DATE, $3, $4, $5)`,
        [trip.vehicle_id, trip.driver_id, fuel_amount, distance, fuel_cost]
      );
    }

    res.json({ message: 'Trip completed successfully' });
  } catch (err) {
    console.error('Error completing trip:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET recommendations for smart dispatch
router.get('/recommendations', authenticateToken, async (req, res) => {
  const { cargo_weight } = req.query;
  const weight = parseFloat(cargo_weight);

  if (isNaN(weight)) {
    return res.status(400).json({ error: 'cargo_weight is required and must be a number' });
  }

  try {
    // 1. Fetch eligible vehicles (Available, Max Capacity >= cargo_weight)
    const vehRes = await db.query(
      "SELECT * FROM vehicles WHERE status = 'Available' AND max_cargo_weight >= $1",
      [weight]
    );

    // 2. Fetch eligible drivers (Available, License valid, Not suspended)
    const drvRes = await db.query(
      "SELECT * FROM drivers WHERE status = 'Available' AND license_expiry >= CURRENT_DATE"
    );

    const vehicles = vehRes.rows;
    const drivers = drvRes.rows;

    if (vehicles.length === 0 || drivers.length === 0) {
      return res.json([]); // No possible pairings
    }

    // Gather extra data for normalization and scoring:
    // A. Rolling Fuel average of fleet
    const fuelLogsRes = await db.query('SELECT vehicle_id, fuel_amount, distance_traveled, cost FROM fuel_logs');
    const fuelLogs = fuelLogsRes.rows;

    // Calculate average efficiency for each vehicle: distance_traveled / fuel_amount
    const vehEfficiencies = {};
    const vehCosts = {};
    
    fuelLogs.forEach(log => {
      if (!vehEfficiencies[log.vehicle_id]) {
        vehEfficiencies[log.vehicle_id] = { fuel: 0, distance: 0, cost: 0 };
      }
      vehEfficiencies[log.vehicle_id].fuel += parseFloat(log.fuel_amount);
      vehEfficiencies[log.vehicle_id].distance += parseFloat(log.distance_traveled);
      vehEfficiencies[log.vehicle_id].cost += parseFloat(log.cost);
    });

    let fleetEffSum = 0;
    let fleetEffCount = 0;
    
    const calculatedVehStats = {};
    Object.keys(vehEfficiencies).forEach(vId => {
      const stats = vehEfficiencies[vId];
      const eff = stats.fuel > 0 ? stats.distance / stats.fuel : 3.0; // default 3 km/L
      const costPerKm = stats.distance > 0 ? stats.cost / stats.distance : 0.5; // default $0.50/km
      calculatedVehStats[vId] = { efficiency: eff, costPerKm };
      fleetEffSum += eff;
      fleetEffCount++;
    });

    const fleetAvgEff = fleetEffCount > 0 ? fleetEffSum / fleetEffCount : 3.0;

    // B. Maintenance closed logs for headroom
    const maintLogsRes = await db.query(
      "SELECT vehicle_id, MAX(odometer_at_service) as last_service_odo FROM maintenance_logs WHERE status = 'Closed' GROUP BY vehicle_id"
    );
    const lastServiceMap = {};
    maintLogsRes.rows.forEach(row => {
      lastServiceMap[row.vehicle_id] = row.last_service_odo;
    });

    // C. Last completed trip dates for vehicles to calculate idle days
    const lastTripRes = await db.query(
      "SELECT vehicle_id, MAX(completed_at) as last_completed FROM trips WHERE status = 'Completed' AND vehicle_id IS NOT NULL GROUP BY vehicle_id"
    );
    const lastTripMap = {};
    lastTripRes.rows.forEach(row => {
      lastTripMap[row.vehicle_id] = new Date(row.last_completed);
    });

    // Generate pairings and calculate scores
    const pairings = [];
    const now = new Date();

    vehicles.forEach(vehicle => {
      drivers.forEach(driver => {
        // Calculate S_safety
        const sSafety = parseFloat(driver.safety_score);

        // Calculate S_fuel
        const vehStats = calculatedVehStats[vehicle.id] || { efficiency: 3.0, costPerKm: 0.5 };
        // Normalize: (vehicle_eff / fleet_avg) * 50 capped at 100
        const sFuel = Math.min(100, Math.max(0, (vehStats.efficiency / fleetAvgEff) * 100));

        // Calculate S_headroom
        const lastServiceOdo = lastServiceMap[vehicle.id] || 0;
        const distSinceMaint = vehicle.odometer - lastServiceOdo;
        const headroom = 10000 - distSinceMaint;
        const sHeadroom = Math.min(100, Math.max(0, (headroom / 10000) * 100));

        // Calculate S_cost
        const sCost = (1 / (1 + vehStats.costPerKm)) * 100;

        // Calculate S_idle
        const lastCompleted = lastTripMap[vehicle.id];
        let daysIdle = 30; // Default if never had a trip
        if (lastCompleted) {
          const diffTime = Math.abs(now - lastCompleted);
          daysIdle = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        }
        // Let's normalize days idle. Since we don't have a max, let's cap it at 30 days
        const sIdle = Math.min(100, (daysIdle / 30) * 100);

        // Formula: Score = 0.30*S_safety + 0.25*S_fuel + 0.20*S_headroom + 0.15*S_cost + 0.10*S_idle
        const score = (0.30 * sSafety) + (0.25 * sFuel) + (0.20 * sHeadroom) + (0.15 * sCost) + (0.10 * sIdle);

        // Human readable reason
        let reason = '';
        if (driver.safety_score > 95 && sHeadroom > 80) {
          reason = `Excellent pairing: ${driver.name} has a top-tier safety record (${driver.safety_score}) and ${vehicle.make} is freshly serviced.`;
        } else if (driver.safety_score > 90) {
          reason = `Recommended because of ${driver.name}'s strong safety performance of ${driver.safety_score}.`;
        } else if (sFuel > 110) {
          reason = `Highly efficient: ${vehicle.make} ${vehicle.model} has above-average fuel efficiency.`;
        } else if (sIdle > 80) {
          reason = `${vehicle.make} is ready for dispatch after being idle for ${daysIdle} days.`;
        } else {
          reason = `Solid baseline pairing with balanced efficiency and safety characteristics.`;
        }

        pairings.push({
          vehicle_id: vehicle.id,
          vehicle_make: vehicle.make,
          vehicle_model: vehicle.model,
          vehicle_plate: vehicle.license_plate,
          driver_id: driver.id,
          driver_name: driver.name,
          score: Math.round(score * 10) / 10,
          reason,
          stats: {
            safety: sSafety,
            fuel: Math.round(sFuel),
            headroom: Math.round(sHeadroom),
            cost: Math.round(sCost),
            idle: Math.round(sIdle)
          }
        });
      });
    });

    // Sort pairings by score descending and return top 3
    pairings.sort((a, b) => b.score - a.score);
    res.json(pairings.slice(0, 3));
  } catch (err) {
    console.error('Error generating recommendations:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
