# TransitOps: Revised Implementation Plan

TransitOps is a full-stack transport operations platform. This plan details the design and architecture for bringing the empty workspace into a fully functioning application that implements all core features, addresses compliance gaps, and implements three powerful differentiator features.

---

## Part 1: Compliance Gaps (Correctness Fixes)

1. **Trip Cancellation**: 
   - Add a "Cancel" action.
   - If a trip in `Dispatched` status is cancelled $\rightarrow$ both vehicle and driver statuses revert to `Available`.
   - If a trip in `Draft` status is cancelled $\rightarrow$ no status reversal is needed.
2. **Maintenance Close Logic**: 
   - Closing maintenance sets the vehicle status back to `Available` *unless* the vehicle's status is `Retired` (in which case it remains `Retired`).
3. **Dashboard Filters**: 
   - Add a "region" filter alongside the existing type/status filters.
   - We will add a `home_depot` field (representing the region/depot) to the `vehicles` table and use it for the filter.
4. **Revenue Capture**: 
   - Add a `revenue` field (`DECIMAL(10,2)`) to the `trips` table, captured upon trip creation (or completed state) as the billed amount.
5. **Operational Cost Formula**: 
   - Operational Cost = $\text{Fuel Cost} + \text{Maintenance Cost}$ ONLY.
   - Tolls and miscellaneous expenses are tracked separately and displayed in a supplementary cost breakdown.
6. **Vehicle ROI Formula**: 
   - $\text{ROI} = \frac{\text{Total Revenue} - \text{Operational Cost}}{\text{Acquisition Cost}}$
7. **Reports Screen**: 
   - Display a reports screen with four interactive, sortable tables and functional CSV export:
     - **Fuel Efficiency**: Distance / Fuel (km/L)
     - **Fleet Utilization %**: (Days on trips / Total days) or (% of active vehicles over time)
     - **Operational Cost**: Fuel Cost + Maintenance Cost
     - **Vehicle ROI**: Calculated per vehicle
8. **Role-Based Access Control (RBAC)**:
   - **Driver**: Can create, dispatch, and cancel trips. Access to log fuel.
   - **Fleet Manager**: Full administrative access (vehicles, drivers, maintenance, and trips).
   - **Safety Officer**: Read/manage access to drivers' licenses and safety scores.
   - **Financial Analyst**: Read-only access to reports and financial details.

---

## Part 2: Differentiator Features (Additive)

### A. Smart Dispatch Recommendation Engine
- Generates score-based pairings for any new trip.
- Hard filters: Cargo weight $\le$ Max capacity, Vehicle `Available`, Driver `Available`, Driver license valid, Driver not `Suspended`.
- Scoring formula:
  $$\text{Score} = 0.30 \times S_{\text{safety}} + 0.25 \times S_{\text{fuel}} + 0.20 \times S_{\text{headroom}} + 0.15 \times S_{\text{cost}} + 0.10 \times S_{\text{idle}}$$
  - $S_{\text{safety}}$: Driver safety score (0-100 scale).
  - $S_{\text{fuel}}$: Vehicle average efficiency normalized against the fleet average.
  - $S_{\text{headroom}}$: Odometer headroom until next service (defined as $10,000\text{ km} - \text{odometer since last maintenance}$, normalized to 0-100).
  - $S_{\text{cost}}$: Normalized cost efficiency ($1 / (1 + \text{cost per km})$).
  - $S_{\text{idle}}$: Days idle since the last completed trip (longest idle gets highest score).
- UI: Display a "Recommended Pairings" panel above the standard dropdowns with the top 3 pairings, showing their scores and a human-readable reason for the top pick.

### B. Live Ops Map
- Rendered using Leaflet and OpenStreetMap tiles.
- Pins vehicles on the map based on coordinate mappings for depots/cities (New York, Chicago, Los Angeles, Houston, Atlanta).
- Marker states:
  - `Available` / `Off Duty` $\rightarrow$ Green pin at home depot.
  - `On Trip` $\rightarrow$ Blue pin animating along a straight-line route between source and destination.
  - `In Shop` $\rightarrow$ Orange pin at maintenance shop/depot.
- Animation speed multiplier (default 30x) compressing actual hours of travel into seconds.
- Interactive popups showing ETAs and current trip load.

### C. Predictive Maintenance & Fuel Anomaly Alerts
- **Fuel Anomaly**: Upon adding a fuel log, check if the fuel efficiency is $>25\%$ lower than the vehicle's rolling average. If so, create an anomaly alert with a detailed reason.
- **Predictive Maintenance**: Flag vehicles as "service due soon" ($>90\%$ of $10,000\text{ km}$ service interval) or "service overdue" ($>100\%$).
- UI: Display a prominent "Predictive Alerts & Fuel Anomalies" card on the dashboard.

---

## Proposed Project Structure

We will structure the monorepo as follows:

```
Odoo-TransitOps/
├── backend/
│   ├── db/
│   │   ├── index.js          # PostgreSQL Pool
│   │   └── schema.sql        # Database initialization & seeding
│   ├── middleware/
│   │   └── auth.js           # JWT & RBAC Authentication
│   ├── routes/
│   │   ├── auth.js           # User Auth routes
│   │   ├── vehicles.js       # Vehicle routes
│   │   ├── drivers.js        # Driver routes
│   │   ├── trips.js          # Trips & Smart Dispatch recommendation route
│   │   ├── maintenance.js    # Maintenance logs
│   │   ├── expenses.js       # Fuel & other expenses
│   │   ├── dashboard.js      # Dashboard widgets & alerts
│   │   └── reports.js        # Reports query aggregator
│   ├── services/
│   │   └── scheduler.js      # Daily license expiry checks (Nodemailer mock)
│   ├── server.js             # Main server setup
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx   # Collapsible Navigation
    │   │   ├── LiveMap.jsx   # Leaflet Map Component
    │   │   └── KPICard.jsx   # KPI widgets
    │   ├── context/
    │   │   └── AuthContext.jsx # Global User Context
    │   ├── pages/
    │   │   ├── Login.jsx     # Login with Role Quick-Selects
    │   │   ├── Dashboard.jsx # Overview with KPI & Alerts
    │   │   ├── Vehicles.jsx  # Vehicle registry
    │   │   ├── Drivers.jsx   # Driver registry
    │   │   ├── Trips.jsx     # Dispatch planner
    │   │   ├── MaintenanceFuel.jsx # Maintenance & logs
    │   │   └── Reports.jsx   # Analytical tables & CSV exports
    │   ├── App.jsx           # Routes & core styling
    │   ├── main.jsx
    │   └── index.css         # Styling system
    ├── package.json
    ├── tailwind.config.js
    └── index.html
```

---

## Verification Plan

### Automated Checks
- Verify local DB migration and seeds run cleanly: `npm run db:setup`.
- Run an integration smoke-test script verifying API responses for validations (overweight cargo, unavailable driver, suspended license).

### Manual Walkthrough (with Browser Subagent)
1. **RBAC validation**: Log in as Fleet Manager, Driver, Safety Officer, and Financial Analyst to verify action restrictions.
2. **Dispatch recommendation**: Open Trip Planner, inspect recommendation engine calculations.
3. **Trip lifecycle & cancellation**: Dispatch a trip, verify "On Trip" status for vehicle/driver, cancel the trip and verify status reversion to "Available".
4. **Live map interpolation**: Confirm dispatched vehicle marker starts animating and updates ETA.
5. **Fuel anomaly check**: Log a fuel entry that is 30% less efficient than normal, verify anomaly warning is created.
6. **CSV Export**: Click "Export CSV" and check formatting.
