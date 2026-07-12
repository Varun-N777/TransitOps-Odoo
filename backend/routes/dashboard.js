const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// GET dashboard statistics & alerts
router.get('/', authenticateToken, async (req, res) => {
  const { region } = req.query; // region is mapped to home_depot in vehicles

  try {
    // 1. Vehicles statistics
    let vehQuery = 'SELECT * FROM vehicles';
    let vehParams = [];
    if (region) {
      vehQuery += ' WHERE home_depot = $1';
      vehParams.push(region);
    }
    const vehiclesRes = await db.query(vehQuery, vehParams);
    const vehicles = vehiclesRes.rows;

    const totalVehicles = vehicles.length;
    const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
    const inShopVehicles = vehicles.filter(v => v.status === 'In Shop').length;
    const onTripVehicles = vehicles.filter(v => v.status === 'On Trip').length;
    const retiredVehicles = vehicles.filter(v => v.status === 'Retired').length;

    const vehicleIds = vehicles.map(v => v.id);

    // 2. Fetch fuel logs
    let fuelLogs = [];
    if (vehicleIds.length > 0) {
      const placeholders = vehicleIds.map((_, i) => `$${i + 1}`).join(',');
      const fuelRes = await db.query(
        `SELECT * FROM fuel_logs WHERE vehicle_id IN (${placeholders})`,
        vehicleIds
      );
      fuelLogs = fuelRes.rows;
    }

    // 3. Fetch maintenance logs
    let maintenanceLogs = [];
    if (vehicleIds.length > 0) {
      const placeholders = vehicleIds.map((_, i) => `$${i + 1}`).join(',');
      const maintRes = await db.query(
        `SELECT * FROM maintenance_logs WHERE vehicle_id IN (${placeholders})`,
        vehicleIds
      );
      maintenanceLogs = maintRes.rows;
    }

    // 4. Fetch trips & expenses
    let trips = [];
    let otherExpenses = [];
    if (vehicleIds.length > 0) {
      const placeholders = vehicleIds.map((_, i) => `$${i + 1}`).join(',');
      const tripsRes = await db.query(
        `SELECT * FROM trips WHERE vehicle_id IN (${placeholders}) OR vehicle_id IS NULL`,
        // Note: if region is specified, we filter trips that were assigned to the region's vehicles
      );
      trips = tripsRes.rows;

      // Filter trips if region is set (trips where vehicle is in the region)
      if (region) {
        trips = trips.filter(t => t.vehicle_id && vehicleIds.includes(t.vehicle_id));
      }

      const tripIds = trips.map(t => t.id);
      if (tripIds.length > 0) {
        const tripPlaceholders = tripIds.map((_, i) => `$${i + 1}`).join(',');
        const expRes = await db.query(
          `SELECT * FROM other_expenses WHERE trip_id IN (${tripPlaceholders})`,
          tripIds
        );
        otherExpenses = expRes.rows;
      }
    } else {
      // If no vehicles (e.g. invalid region) but trips exist
      const tripsRes = await db.query('SELECT * FROM trips');
      trips = tripsRes.rows;
    }

    // Calculate Operational Cost = Fuel Cost + Maintenance Cost
    const fuelCostSum = fuelLogs.reduce((sum, log) => sum + parseFloat(log.cost), 0);
    const maintCostSum = maintenanceLogs.reduce((sum, log) => sum + parseFloat(log.cost), 0);
    const operationalCost = fuelCostSum + maintCostSum;

    // Calculate Tolls & Miscellaneous Cost
    const tollsCost = otherExpenses.filter(e => e.type === 'Toll').reduce((sum, e) => sum + parseFloat(e.amount), 0);
    const miscCost = otherExpenses.filter(e => e.type === 'Miscellaneous').reduce((sum, e) => sum + parseFloat(e.amount), 0);

    // Calculate Revenue
    const revenueSum = trips
      .filter(t => t.status === 'Completed' || t.status === 'Dispatched')
      .reduce((sum, t) => sum + parseFloat(t.revenue), 0);

    // 5. Compute Alerts
    // A. Predictive Maintenance Alerts (due soon: >90% of 10,000km, overdue: >100%)
    const predictiveAlerts = [];
    
    // Find last closed service odometer per vehicle
    const lastServiceOdoMap = {};
    maintenanceLogs
      .filter(log => log.status === 'Closed')
      .forEach(log => {
        if (!lastServiceOdoMap[log.vehicle_id] || log.odometer_at_service > lastServiceOdoMap[log.vehicle_id]) {
          lastServiceOdoMap[log.vehicle_id] = log.odometer_at_service;
        }
      });

    vehicles.forEach(vehicle => {
      const lastServiceOdo = lastServiceOdoMap[vehicle.id] || 0;
      const distSinceService = vehicle.odometer - lastServiceOdo;
      const interval = 10000;

      if (distSinceService >= interval) {
        predictiveAlerts.push({
          id: `pred-overdue-${vehicle.id}`,
          type: 'Predictive Maintenance',
          vehicle_id: vehicle.id,
          vehicle_plate: vehicle.license_plate,
          vehicle_name: `${vehicle.make} ${vehicle.model}`,
          description: `Service OVERDUE: Vehicle ${vehicle.license_plate} has driven ${distSinceService.toLocaleString()} km since last service (limit: 10,000 km).`,
          severity: 'Critical',
          created_at: new Date(),
          resolved: false
        });
      } else if (distSinceService >= interval * 0.9) {
        predictiveAlerts.push({
          id: `pred-soon-${vehicle.id}`,
          type: 'Predictive Maintenance',
          vehicle_id: vehicle.id,
          vehicle_plate: vehicle.license_plate,
          vehicle_name: `${vehicle.make} ${vehicle.model}`,
          description: `Service DUE SOON: Vehicle ${vehicle.license_plate} has driven ${distSinceService.toLocaleString()} km since last service.`,
          severity: 'Warning',
          created_at: new Date(),
          resolved: false
        });
      }
    });

    // B. Fetch active Fuel Anomalies and other alerts from the DB
    let dbAlertsQuery = `
      SELECT a.*, v.license_plate as vehicle_plate, v.make as vehicle_make, v.model as vehicle_model 
      FROM alerts a
      JOIN vehicles v ON a.vehicle_id = v.id
      WHERE a.resolved = FALSE
    `;
    let dbAlertsParams = [];
    if (region) {
      dbAlertsQuery += ' AND v.home_depot = $1';
      dbAlertsParams.push(region);
    }
    dbAlertsQuery += ' ORDER BY a.id DESC';
    const dbAlertsRes = await db.query(dbAlertsQuery, dbAlertsParams);
    
    const dbAlerts = dbAlertsRes.rows.map(row => ({
      id: row.id,
      type: row.type,
      vehicle_id: row.vehicle_id,
      vehicle_plate: row.vehicle_plate,
      vehicle_name: `${row.vehicle_make} ${row.vehicle_model}`,
      description: row.description,
      severity: row.severity,
      created_at: row.created_at,
      resolved: row.resolved
    }));

    // Combine alerts
    const allAlerts = [...predictiveAlerts, ...dbAlerts].sort((a, b) => {
      // Critical first, then Warning
      if (a.severity === 'Critical' && b.severity !== 'Critical') return -1;
      if (a.severity !== 'Critical' && b.severity === 'Critical') return 1;
      return new Date(b.created_at) - new Date(a.created_at);
    });

    res.json({
      kpis: {
        vehicles: {
          total: totalVehicles,
          available: availableVehicles,
          inShop: inShopVehicles,
          onTrip: onTripVehicles,
          retired: retiredVehicles
        },
        trips: {
          total: trips.length,
          draft: trips.filter(t => t.status === 'Draft').length,
          dispatched: trips.filter(t => t.status === 'Dispatched').length,
          completed: trips.filter(t => t.status === 'Completed').length,
          cancelled: trips.filter(t => t.status === 'Cancelled').length
        },
        financials: {
          revenue: revenueSum,
          operationalCost,
          tollsCost,
          miscCost,
          profit: revenueSum - operationalCost - tollsCost - miscCost
        }
      },
      alerts: allAlerts
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST resolve alert
router.post('/alerts/:id/resolve', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (id.startsWith('pred-')) {
      // Dynamic alerts are resolved by scheduling maintenance, not manually database flag.
      return res.status(400).json({ error: 'Predictive maintenance alerts are resolved by creating a maintenance log.' });
    }
    await db.query('UPDATE alerts SET resolved = TRUE WHERE id = $1', [id]);
    res.json({ message: 'Alert resolved successfully' });
  } catch (err) {
    console.error('Error resolving alert:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
