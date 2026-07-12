const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET reports metrics aggregated per vehicle
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Gather all necessary raw tables to run calculations in memory
    const vehiclesRes = await db.query('SELECT * FROM vehicles');
    const vehicles = vehiclesRes.rows;

    const fuelLogsRes = await db.query('SELECT * FROM fuel_logs');
    const fuelLogs = fuelLogsRes.rows;

    const maintenanceLogsRes = await db.query('SELECT * FROM maintenance_logs');
    const maintenanceLogs = maintenanceLogsRes.rows;

    const tripsRes = await db.query('SELECT * FROM trips');
    const trips = tripsRes.rows;

    const reports = vehicles.map(vehicle => {
      // 1. Fuel efficiency calculations
      const vFuelLogs = fuelLogs.filter(f => f.vehicle_id === vehicle.id);
      const totalFuel = vFuelLogs.reduce((sum, f) => sum + parseFloat(f.fuel_amount), 0);
      const totalDistance = vFuelLogs.reduce((sum, f) => sum + parseFloat(f.distance_traveled), 0);
      const fuelCost = vFuelLogs.reduce((sum, f) => sum + parseFloat(f.cost), 0);
      const fuelEfficiency = totalFuel > 0 ? totalDistance / totalFuel : 0.0;

      // 2. Maintenance costs calculations
      const vMaintLogs = maintenanceLogs.filter(m => m.vehicle_id === vehicle.id);
      const maintenanceCost = vMaintLogs.reduce((sum, m) => sum + parseFloat(m.cost), 0);

      // Operational Cost = Fuel Cost + Maintenance Cost
      const operationalCost = fuelCost + maintenanceCost;

      // 3. Utilization calculations
      const vTrips = trips.filter(t => t.vehicle_id === vehicle.id);
      const tripsCount = vTrips.length;
      
      // Calculate days on trip (assume average trip takes 2 days)
      const completedOrDispatchedTrips = vTrips.filter(t => t.status === 'Completed' || t.status === 'Dispatched');
      const daysOnTrips = completedOrDispatchedTrips.length * 2.0;
      // Fleet Utilization % = (Days on trips / 30-day baseline) * 100
      const utilization = Math.min(100, Math.round((daysOnTrips / 30) * 100 * 10) / 10);

      // 4. ROI calculations
      const totalRevenue = vTrips
        .filter(t => t.status === 'Completed' || t.status === 'Dispatched')
        .reduce((sum, t) => sum + parseFloat(t.revenue), 0);

      const acqCost = parseFloat(vehicle.acquisition_cost);
      // ROI = (Total Revenue - Operational Cost) / Acquisition Cost
      const roi = acqCost > 0 ? (totalRevenue - operationalCost) / acqCost : 0.0;

      return {
        vehicle_id: vehicle.id,
        make: vehicle.make,
        model: vehicle.model,
        license_plate: vehicle.license_plate,
        fuel: {
          total_distance: totalDistance,
          total_fuel: totalFuel,
          efficiency: Math.round(fuelEfficiency * 100) / 100
        },
        utilization: {
          trips_count: tripsCount,
          days_on_trips: daysOnTrips,
          percentage: utilization || 0.0
        },
        costs: {
          fuel_cost: fuelCost,
          maintenance_cost: maintenanceCost,
          operational_cost: operationalCost
        },
        roi: {
          revenue: totalRevenue,
          operational_cost: operationalCost,
          acquisition_cost: acqCost,
          roi_value: Math.round(roi * 1000) / 1000 // decimal ratio format (e.g. 0.125 for 12.5% ROI)
        }
      };
    });

    res.json(reports);
  } catch (err) {
    console.error('Error compiling reports:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
