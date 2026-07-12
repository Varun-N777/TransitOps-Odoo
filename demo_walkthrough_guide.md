# TransitOps: Technical Evaluation & Verification Manual

Welcome to the technical evaluation manual for TransitOps. This document is designed from an **evaluator's perspective** to guide you through the structural architecture, security mechanisms, compliance rules, and localization capabilities of the platform.

---

## 🏗️ 1. Technical Architecture & Component Mapping

TransitOps is divided into two primary subsystems:
1. **Express Backend API (`/backend`)**: Built with Node.js, routing requests to a hosted PostgreSQL instance (Supabase) via parameter-safe queries. Auth is handled by stateful JWTs.
2. **Vite Frontend SPA (`/frontend`)**: Built with React, TailwindCSS, and Leaflet Maps, utilizing component-level role permissions (RBAC).

### Key Files Mapping:
- **Database Schema**: [schema.sql](file:///d:/Odoo-TransitOps/backend/db/schema.sql) — Enforces relations, foreign keys, and location check constraints.
- **Backend API Routes**: [backend/routes/](file:///d:/Odoo-TransitOps/backend/routes/)
  - [dashboard.js](file:///d:/Odoo-TransitOps/backend/routes/dashboard.js) — Calculates operational cost aggregates, odometer thresholds, and fuel efficiency anomalies.
  - [trips.js](file:///d:/Odoo-TransitOps/backend/routes/trips.js) — Handles state machine validations and smart recommendation scoring.
- **Frontend Core Components**: [frontend/src/components/](file:///d:/Odoo-TransitOps/frontend/src/components/)
  - [LiveMap.jsx](file:///d:/Odoo-TransitOps/frontend/src/components/LiveMap.jsx) — Implements dynamic geographic auto-centering and animated Leaflet paths.

---

## 🔐 2. Security & Role-Based Access Control (RBAC)

TransitOps enforces role boundaries at both the client-side router/render tree and the server-side middleware layer. 

### Quick Evaluation Credentials:
You can use the **Quick Login** selector on the login screen or enter these credentials manually:
- **Fleet Manager** (Admin write-access to all resources): `manager` / `password`
- **Driver** (Access to trip dispatch, cancel, and fuel logging): `driver1` / `password`
- **Safety Officer** (Access to driver compliance registry & score controls): `safety` / `password`
- **Financial Analyst** (Read-only access to dashboards & financial reports): `analyst` / `password`

### Permission Matrix:
| Feature Area | Fleet Manager | Driver | Safety Officer | Financial Analyst |
| :--- | :---: | :---: | :---: | :---: |
| **KPI Metrics & Live Map** | Read | Read | Read | Read |
| **Manage Vehicles (CRUD)** | Read/Write | Hidden | Hidden | Hidden |
| **Onboard Drivers** | Read/Write | Hidden | Read/Write | Hidden |
| **Edit Driver Safety Scores** | Hidden | Hidden | Read/Write | Hidden |
| **Trip Dispatch / Cancellation**| Read/Write | Read/Write | Hidden | Hidden |
| **Maintenance Work Orders** | Read/Write | Hidden | Hidden | Hidden |
| **Log Fuel Intakes** | Read/Write | Read/Write | Hidden | Hidden |
| **ROI Reports & CSV Export** | Read/Write | Hidden | Hidden | Read/Write |

---

## 🇮🇳 3. Localization: Indian Context Features

The platform includes a dedicated localization layer for Indian logistics:
- **Database Constraints**: The PostgreSQL database enforces a strict `CHECK` constraint on `home_depot`, `source`, and `destination` to ensure validity. This check includes: `'Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata'` alongside US regional offices.
- **Geographic Auto-Centering**: The Leaflet map dynamically shifts its focal point. If any active vehicle is stationed in India, the map automatically centers on `[20.5937, 78.9629]` (Zoom level `5`), rendering markers at local coordinate offsets.
- **Currency Transformation**: Financial attributes—including Billed Revenue, Maintenance Invoices, Fuel Receipts, and Vehicle Acquisition Costs—automatically render using the Rupee symbol (`₹`) across all dashboard widgets, registries, cost sheets, and CSV exports.

---

## 🧪 4. Step-by-Step Feature Verification Cases

### Test Case 1: Driver Compliance & Expiry Alerts
1. Log in as **Safety Officer** (`safety`).
2. Navigate to **Drivers** on the sidebar.
3. Observe the colored license expiration tags:
   - 🟢 **Green**: Active & valid licenses.
   - 🟡 **Yellow**: Expiration warning ($< 30$ days).
   - 🔴 **Red**: Expired or critical warning ($< 7$ days).
4. Click **Register Driver**. Create a profile with an expiration date set to exactly 15 days in the future.
5. **Verify**: The driver profile immediately appears with a yellow alert label indicating the exact days remaining.

### Test Case 2: Smart Recommendations & State Machine Dispatch
1. Log in as **Fleet Manager** (`manager`) or **Driver** (`driver1`).
2. Navigate to **Trips** $\rightarrow$ Click **Create Draft Trip**.
3. Set Source to **Mumbai** and Destination to **Delhi**. Enter Cargo Weight: `18000` kg.
4. **Verify Recommendation Engine**: An evaluation card displays recommending optimal vehicles/drivers based on:
   - Safety Score ($30\%$), Fuel Economy ($25\%$), Maintenance Headroom ($20\%$), Cost Efficiency ($15\%$), and Driver Idle Time ($10\%$).
5. Click **Use Recommendation** to select the recommended assets (e.g. `Tata Prima 4025` and driver `Aarav Sharma`).
6. Click **Dispatch Trip**.
7. **Verify**:
   - The trip status changes to `Dispatched`.
   - On the **Dashboard**, the vehicle marker turns blue (On Trip) and begins animating along a dotted line between Mumbai and Delhi.
   - Navigating to **Vehicles** or **Drivers** will show their status updated to `On Trip`, locking them from being dispatched elsewhere.

### Test Case 3: State Reversal (Trip Cancellation)
1. Navigate to **Trips**.
2. Locate the dispatched trip from Test Case 2 and click **Cancel**.
3. **Verify Compliance Rule**: 
   - The trip status updates to `Cancelled`.
   - Navigate to **Vehicles** and **Drivers** registries and confirm that both the `Tata Prima 4025` and `Aarav Sharma` have reverted back to `Available` status.

### Test Case 4: Maintenance Lifecycles & Dispatched Exclusions
1. Log in as **Fleet Manager** (`manager`).
2. Navigate to **Maintenance & Fuel**.
3. Create a ticket for `BharatBenz 3523R` (Description: "Brake service", Cost: `1200`).
4. **Verify**: 
   - The vehicle's status changes to `In Shop`.
   - Navigate to the **Trips** creation page. The `BharatBenz 3523R` is excluded from the available vehicles list.
5. Go back to **Maintenance & Fuel** and click **Close Ticket** (Enter invoice cost: `1200`).
6. **Verify**: The vehicle status reverts to `Available` (unless its database status is set to `Retired`).

### Test Case 5: Cost Integrity & Predictive Anomaly Warnings
1. Log in as **Fleet Manager** (`manager`).
2. Inspect the **Predictive Alerts & Fuel Anomalies** widget on the main dashboard:
   - **Service Alerts**: Odometer readings exceeding $90\%$ of the $10,000\text{ km}$ service interval trigger a yellow *Warning*. Exceeding $100\%$ triggers a red *Critical* service alert.
   - **Fuel Anomalies**: If a logged fuel entry shows a fuel economy drop of $>25\%$ compared to the vehicle's rolling historical average, an alert is generated detailing the variance.
