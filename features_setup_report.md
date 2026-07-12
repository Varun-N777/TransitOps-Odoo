# TransitOps: Features & Setup Documentation

This document provides a comprehensive report of the TransitOps platform setup, detailing the database schema, backend API structures, frontend views, implemented business rules, and the integration of differentiator features.

---

## 💾 1. Database Architecture (AWS Supabase)

The database has been migrated to a remote PostgreSQL database hosted on AWS via Supabase:
- **Host**: `aws-1-ap-northeast-2.pooler.supabase.com:6543`
- **Database**: `postgres`
- **User**: `postgres.leprswogkdzfkfqjuuvp`

### Schema Design (`schema.sql`)
The database contains the following tables:

1. **`users`**: Manages credentials and roles.
   - Columns: `id`, `username`, `password_hash`, `role` (`Fleet Manager`, `Driver`, `Safety Officer`, `Financial Analyst`).
2. **`vehicles`**: Tracks vehicle assets.
   - Columns: `id`, `make`, `model`, `year`, `license_plate`, `max_cargo_weight`, `odometer`, `status` (`Available`, `On Trip`, `In Shop`, `Retired`), `home_depot`, `acquisition_cost`.
3. **`drivers`**: Tracks driver compliance and safety.
   - Columns: `id`, `user_id`, `name`, `license_number`, `license_expiry`, `safety_score`, `status` (`Available`, `On Trip`, `Suspended`).
4. **`trips`**: Manages freight logistics routes and statuses.
   - Columns: `id`, `source`, `destination`, `cargo_weight`, `status` (`Draft`, `Dispatched`, `Completed`, `Cancelled`), `vehicle_id`, `driver_id`, `revenue`, `created_at`, `completed_at`.
5. **`maintenance_logs`**: Logs vehicle service events.
   - Columns: `id`, `vehicle_id`, `description`, `status` (`Open`, `Closed`), `odometer_at_service`, `cost`, `start_date`, `end_date`.
6. **`fuel_logs`**: Logs fuel purchase events.
   - Columns: `id`, `vehicle_id`, `driver_id`, `date`, `fuel_amount`, `distance_traveled`, `cost`.
7. **`other_expenses`**: Supplementary expense tracker.
   - Columns: `id`, `trip_id`, `type` (`Toll`, `Miscellaneous`), `amount`, `description`.
8. **`alerts`**: Stores persistent anomalies and warnings.
   - Columns: `id`, `type` (`Fuel Anomaly`, `Predictive Maintenance`), `vehicle_id`, `description`, `severity` (`Warning`, `Critical`), `created_at`, `resolved`.

---

## ⚙️ 2. Backend Services & Routing (Express API)

The server runs in the background on port `5000`.

### Endpoints
- **Auth (`/api/auth`)**:
  - `POST /login`: Validates password hashes using `bcryptjs` and signs a JWT.
  - `POST /register`: Registers new accounts with RBAC mapping.
  - `GET /me`: Returns the decoded token profile.
- **Vehicles (`/api/vehicles`)**:
  - `GET /`: Lists vehicles (supports filters for status & region/home depot).
  - `POST /`: Registers a vehicle (enforces unique plates).
  - `PUT /:id`: Updates vehicle metadata.
  - `DELETE /:id`: Deletes a vehicle.
- **Drivers (`/api/drivers`)**:
  - `GET /`: Lists drivers (calculates warning levels based on `license_expiry`).
  - `POST /`: Registers a driver.
  - `PUT /:id`: Updates driver profile.
  - `DELETE /:id`: Deletes a driver.
- **Trips (`/api/trips`)**:
  - `GET /`: Lists all trips with populated names and license plates.
  - `POST /`: Creates a trip in `Draft` or `Dispatched` status.
  - `POST /:id/dispatch`: Dispatches a draft trip, switching the assigned vehicle and driver statuses to `On Trip`.
  - `POST /:id/cancel`: Cancels a trip. If dispatched, automatically reverts the vehicle and driver back to `Available`.
  - `POST /:id/complete`: Completes a trip. Records final odometer readings and processes optional fuel logs.
  - `GET /recommendations`: **Smart Dispatch recommendation engine** scoring pairings.
- **Maintenance (`/api/maintenance`)**:
  - `GET /`: Lists maintenance events.
  - `POST /`: Opens a maintenance log. Automatically sets the vehicle status to `In Shop`.
  - `POST /:id/close`: Closes a maintenance log. Sets the vehicle back to `Available` *unless* the vehicle is marked as `Retired`.
- **Expenses (`/api/expenses`)**:
  - `GET/POST /fuel`: Lists or submits fuel purchases (performs rolling average efficiency anomaly checks).
  - `GET/POST /other`: Submits toll or miscellaneous trip expenses.
- **Dashboard (`/api/dashboard`)**:
  - `GET /`: Returns counts, regional statistics, and warning alerts.
- **Reports (`/api/reports`)**:
  - `GET /`: Compiles raw stats into metrics: Fuel Efficiency (distance/fuel), Utilization % (days on trips/30), Operational Cost (fuel + maintenance), and Vehicle ROI (revenue - operational cost) / acquisition cost.

---

## 💻 3. Frontend Application (React + Tailwind CSS)

The React client runs in the background on port `3000`.

### Views & Pages
1. **LoginPage**: Displays standard input fields with a **Quick Login** selector panel for immediate role-based testing (`manager`, `driver1`, `safety`, `analyst`).
2. **Dashboard**: Shows key metrics (Utilization, Available count, Revenue, Operational Costs), active alerts, and the region selection filter. Includes the **Live Ops Map**:
   - Leaflet container styled with a dark theme.
   - Moving animation: `Dispatched` vehicles move as blue markers along a straight-line polyline between source and destination depots.
   - Popups display ETA progress, cargo load, and driver name.
3. **Vehicles Registry**: Displays a data table with search, status filters, and modal registration forms.
4. **Drivers Registry**: Displays driver lists with colored warning badges matching their license expiry date:
   - 🔴 Red: Expired or expiring in $< 7$ days.
   - 🟡 Yellow: Expiring in $< 30$ days.
   - 🟢 Green: Valid.
5. **Trips Dispatcher**: Displays the **Smart Dispatch 추천 Pairing** widget:
   - Analyzes cargo weights and retrieves eligible vehicle/driver pairings.
   - Calculates custom weighted safety, fuel, service headroom, cost, and idle rotation scores.
   - Renders the top 3 matches with clear reasoning text.
6. **Maintenance & Fuel Logging**: Logs fuel quantities, toll costs, and opens/closes vehicle maintenance tickets.
7. **Reports Deck**: Sortable tables and tabs for the four required reporting metrics. Includes a download trigger that constructs and exports formatted CSV files.
