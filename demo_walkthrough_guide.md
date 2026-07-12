# TransitOps: Demo Walkthrough & Presentation Guide (India Edition)

This guide is structured as a step-by-step presentation script. It will help you walk judges, clients, or team members through the entire platform in a logical, high-impact flow, highlighting role-based permissions and utilizing Indian depots, vehicles, and driver compliance data.

---

## 🎬 Act 1: Introduction & The Core Problem (60 Seconds)

**💡 Pitch Concept:**
"Logistics companies struggle with spreadsheets and disconnected logbooks. This leads to scheduling conflicts, overweight cargo, underutilized fleets, expired driver compliance, and hidden operational expenses. **TransitOps** is a full-stack transport operations platform that solves this by digitizing the entire fleet lifecycle and enforcing business rules at both the API and database levels."

**🚶 Action items:**
1. Open `http://localhost:3000/login` in your browser.
2. Highlight the clean, dark-theme layout.
3. Show the **Quick Login** panel containing selectors for all four roles: Fleet Manager, Driver, Safety Officer, and Financial Analyst.
4. Click **Fleet Manager** to automatically log in.

---

## 📊 Act 2: Dashboard & Live Command Center (90 Seconds)

👉 **Role Context: Logged in as Fleet Manager (`manager` / `password`)**

**💡 Pitch Concept:**
"Once logged in as a Fleet Manager, you are welcomed by the **Fleet Command Center**. This dashboard provides a real-time operational overview, keeping key fleet KPIs and predictive safety alerts at your fingertips."

**🚶 Action items:**
1. Point to the **4 KPI Cards**:
   - *Fleet Utilization*: Shows active (On Trip) vehicles vs. total vehicles.
   - *Operational Status*: Available vs. In Shop (In Maintenance) and Retired counts.
   - *Billed Revenue*: Billed amount for all active and completed trips.
   - *Operational Cost*: Strict sum of Fuel + Maintenance costs (tolls and misc are tracked separately to maintain data integrity).
2. Point out the **Predictive Alerts & Fuel Anomalies** widget:
   - Explain that the system automatically checks vehicle odometers. If a vehicle exceeds $90\%$ of its $10,000\text{ km}$ service interval, it flags a *Warning (Service Due Soon)*. If it exceeds $100\%$, it flags a *Critical (Service Overdue)* alert.
   - Note that if a logged fuel entry's efficiency drops by $>25\%$ compared to the vehicle's historical rolling average, a *Fuel Anomaly* alert is generated with details.
3. Demonstrate the **Depot Region Filter**:
   - Change the dropdown filter from *All Regions* to **Mumbai**.
   - Point out that the KPIs, the alerts widget, and the Live Map markers dynamically filter to show only Mumbai assets.
   - Change the filter back to *All Regions*.
4. Show the **Live Ops Map**:
   - Notice that because Indian vehicle seeds are present, the map automatically centers on India.
   - Point out the violet pins representing major Indian depots (Mumbai, Delhi, Bengaluru, Chennai, Kolkata).
   - Point out the colored pins representing vehicles (Green = Available, Orange = In Shop).

---

## 🚛 Act 3: Fleet Registry & Onboarding Assets (90 Seconds)

👉 **Role Context: Logged in as Fleet Manager (`manager` / `password`)**
*(Only the Fleet Manager role has access to vehicles CRUD and registration forms. Non-authorized pages will block access).*

### A. Registering a New Vehicle
1. Click **Vehicles** in the sidebar.
2. Click **Register Vehicle** to open the creation modal:
   - Enter Make: `Tata`, Model: `Prima 4025`, Year: `2024`.
   - Enter License Plate: `MH-12-PQ-9999`.
   - Enter Max Cargo Weight: `40000` (kg), Odometer: `15000`, Acquisition Cost: `120000` (₹).
   - Select Home Depot: **Mumbai**.
   - Click **Save Vehicle**.
3. *Enforce Uniqueness Check:* Explain that if a user attempts to enter a duplicate license plate, the system throws a validation warning (`Vehicle license plate already exists`) preventing duplicate assets.
4. Note that we support soft-deleting vehicles by moving them to a `Retired` status to preserve historic financial/trip records.

### B. Onboarding a New Driver (Also accessible by Safety Officer)
1. Click **Drivers** in the sidebar.
2. Click **Register Driver** to open the creation modal:
   - Enter Name: `Aarav Sharma`.
   - Enter License Number: `DL-IND-9988`.
   - Set License Expiry: Select a date 25 days from today.
   - Set Safety Score: `96.00`.
   - Select Status: *Available*.
   - Click **Save Driver**.
3. Point out the color-coded **License Status** warning badges:
   - Point to Aarav Sharma's row showing a **Yellow Badge** (`Expiring in 25 days`).
   - Explain the rules: 🟢 Green for valid, 🟡 Yellow for $< 30$ days warning, 🔴 Red for expired or expiring within 7 days.

---

## 🗺️ Act 4: Smart Dispatch & State Machine (90 Seconds)

👉 **Role Context: Logged in as Fleet Manager or Driver**
*(Drivers are authorized to plan, dispatch, and cancel trips in TransitOps).*

**💡 Pitch Concept:**
"Now let's plan a freight run from Mumbai to Delhi. We've built a **Smart Dispatch Recommendation Engine** that scores and pairs the best available vehicles and drivers. The system then enforces strict safety and cargo validations before dispatch."

**🚶 Action items:**
1. Click **Trips** in the sidebar. Click **Create Draft Trip**.
2. Select Source: **Mumbai**, Destination: **Delhi**.
3. Type Cargo Weight: `18000` (kg), and Revenue: `3800` (₹).
4. Enter Cargo Weight and notice the **Recommended Pairings** card instantly appears at the top:
   - Explain the scoring calculation: $30\%$ Driver Safety + $25\%$ Normalized Fuel Efficiency + $20\%$ Maintenance Headroom + $15\%$ Cost Efficiency + $10\%$ Idle Time.
   - Read the human-readable recommendation reason for the top pick.
5. Click **Use Recommendation** (or manually select *Tata Prima 4025* and *Aarav Sharma* from the dropdowns).
6. Click **Dispatch Trip** to trigger the state machine:
   - Notice the trip status immediately updates to `Dispatched`.
7. Go back to the **Dashboard**:
   - Look at the **Live Map**. Point out that the vehicle pin has changed to blue (On Trip) and is now animating (moving) along the dotted path from Mumbai to Delhi.
   - Click the moving marker to show the tooltip displaying driver name, cargo weight, and live trip progress.

---

## 🔄 Act 5: State Reversal & Maintenance Flows (90 Seconds)

👉 **Role Context: Logged in as Fleet Manager**
*(Trips cancellation can be done by Drivers, but creating and closing maintenance is restricted to Fleet Manager only).*

**💡 Pitch Concept:**
"TransitOps handles unexpected plan changes gracefully. Cancelling a trip automatically frees up the assets, and scheduling maintenance removes them from dispatch pools."

**🚶 Action items:**
1. Go back to the **Trips** page. Click **Cancel** on our dispatched trip.
   - Notice the status updates to `Cancelled`.
2. Go to **Vehicles** and **Drivers** lists:
   - Verify that both the Tata Prima 4025 and Aarav Sharma have immediately reverted to `Available` status.
3. Click **Maintenance & Fuel** in the sidebar:
   - Log a new maintenance log for **BharatBenz 3523R** (description: "Suspension inspection", odometer: `18000`, cost: `600` (₹)).
   - Notice that the BharatBenz 3523R status immediately updates to `In Shop`.
4. Navigate to the **Trips** page and open the trip form:
   - Point out that BharatBenz 3523R has been hidden and cannot be selected for new trips.
5. Go back to **Maintenance & Fuel**, locate the BharatBenz log under *Active logs*, and click **Close**:
   - Show that the BharatBenz status returns to `Available` (unless its database status was set to `Retired`).

---

## 📈 Act 6: Analytics, Financial Reports, & CSV Export (45 Seconds)

👉 **Role Context: Logged in as Fleet Manager or Financial Analyst**
*(Safety Officers and Drivers are restricted from viewing operational cost breakdowns and ROI ratios).*

**💡 Pitch Concept:**
"TransitOps compiles operations data into actionable financial and efficiency reports, ready to be exported for business analysts."

**🚶 Action items:**
1. Click **Reports** in the sidebar.
2. Click through the four tabs:
   - **Fuel Efficiency**: Aggregates total distance, total fuel, and calculates average fuel efficiency ($km/L$) per vehicle.
   - **Fleet Utilization**: Compares actual trip days against a 30-day baseline to display utilization percentage.
   - **Operational Cost**: Displays fuel and maintenance costs.
   - **Vehicle ROI**: Displays the ROI ratio calculated as:
     $$\text{ROI} = \frac{\text{Total Revenue} - \text{Operational Cost}}{\text{Acquisition Cost}}$$
3. Click the **Export to CSV** button and show that the file downloads successfully.

---

## 🔐 Act 7: Role-Based Access Control (RBAC) Verification (90 Seconds)

**💡 Pitch Concept:**
"TransitOps implements strict security boundaries. Let's log in as other roles to confirm their permissions."

### A. The Driver Flow (`driver1` / `password`)
1. Click **Logout** at the bottom of the sidebar.
2. Select **Driver** (driver1) on the quick login panel:
   - Note that the *Vehicles*, *Drivers*, and *Reports* tabs are completely hidden from the sidebar.
3. Go to **Trips**:
   - Create a draft trip (Source: **Mumbai**, Destination: **Delhi**, Weight: `8000`).
   - Show that a Driver CAN dispatch and cancel trips, ensuring field flexibility, but they have zero access to administrative panels or company-wide ROI analytics.
4. Log out.

### B. The Safety Officer Flow (`safety` / `password`)
1. Select **Safety Officer** on the quick login panel:
   - Note that the *Drivers* tab is visible, but *Vehicles*, *Maintenance*, and *Reports* tabs are hidden.
2. Go to **Drivers**:
   - Click **Edit** on a driver profile. Update their Safety Score to `98.00`.
   - Explain that Safety Officers have full update rights over driver licensing, expiry checks, and safety scores to enforce compliance, but they cannot access financial stats.
3. Log out.

### C. The Financial Analyst Flow (`analyst` / `password`)
1. Select **Financial Analyst** on the quick login panel:
   - Note that *Reports* and *Dashboard* are visible, but *Vehicles*, *Drivers*, *Trips*, and *Maintenance* write actions are restricted.
2. Click **Reports**:
   - Show that the Analyst has full read access to financial ROI tables, fuel efficiency indices, and operational costs.
   - Click **Export to CSV** to prove they can generate exports, but confirm that they have no forms or buttons to edit or add new trips, vehicles, or drivers.
3. Log out.

---

## 🎯 Wrap-Up (15 Seconds)

"In summary, TransitOps is a feature-complete transport operations dashboard. It handles core logistics, enforces mandatory business validations, displays real-time live map tracking, suggests recommendations, detects anomalies, and calculates financial metrics on a Supabase database instance."
