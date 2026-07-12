# TransitOps: Fleet & Freight Operations Platform

TransitOps is a full-stack transport operations platform built to manage and optimize cargo freight transit, driver safety compliance, vehicle maintenance lifecycles, and financial analytics. 

It is tailored for logistics operations, complete with regional support for **Indian depot operations**, **Rupee currency symbol (`₹`) display**, dynamic Leaflet maps, and strict **Role-Based Access Control (RBAC)** enforcement.

---

## 🛠️ Architecture & Tech Stack

- **Frontend**: React (Vite) + TailwindCSS + Leaflet maps + Framer Motion.
- **Backend**: Node.js + Express.js + REST APIs.
- **Database**: PostgreSQL (hosted on Supabase) + strict database constraints.
- **Security**: JSON Web Token (JWT) stateful authorization + bcrypt encryption.

---

## 🗺️ Indian Context Customization

The platform is natively integrated for Indian operations:
1. **Locations**: Supports Mumbai, Delhi, Bengaluru, Chennai, and Kolkata alongside standard US regional centers.
2. **Dynamic Centering**: The Live Leaflet Map automatically detects if Indian vehicles exist in the active fleet and shifts the map center dynamically to India (`[20.5937, 78.9629]`, Zoom `5`).
3. **Currency Conversion**: The entire application displays financial metrics, billed revenues, fuel costs, and maintenance order sheets in Rupees (`₹`).
4. **Local Vehicles & Drivers**: Seeded with local models (Tata Prima 4025, Mahindra Blazo X, BharatBenz 3523R) and drivers (Aarav Sharma, Vihaan Patel).

---

## 🔐 Role-Based Access Control (RBAC)

TransitOps secures routes and administrative forms depending on user role:

| Feature / Page | Fleet Manager | Driver | Safety Officer | Financial Analyst |
| :--- | :---: | :---: | :---: | :---: |
| **Command Center Dashboard** | Read / Filter | Read Only | Read Only | Read Only |
| **Live Map Pins** | Full Visibility | Full Visibility | Full Visibility | Full Visibility |
| **Register & Edit Vehicles** | Write / Soft-Delete | Hidden | Hidden | Hidden |
| **Onboard Drivers** | Write | Hidden | Write | Hidden |
| **Manage Driver Scores** | Hidden | Hidden | Write | Hidden |
| **Dispatch & Cancel Trips** | Write | Write | Hidden | Hidden |
| **Maintenance Orders (CRUD)** | Write | Hidden | Hidden | Hidden |
| **Log Fuel Intakes** | Write | Write | Hidden | Hidden |
| **ROI & Analytics Reports** | Read / Export | Hidden | Hidden | Read / Export |

---

## 🚀 Setup & Execution Guide

### Prerequisites
- Node.js (v18 or higher)
- npm package manager
- A Supabase PostgreSQL database instance

### 1. Backend Configuration
Create a `.env` file in the `backend/` directory:
```env
PORT=5000
DATABASE_URL=your_postgresql_supabase_connection_string
JWT_SECRET=your_jwt_signing_secret
```

Initialize database tables and seed Indian assets:
```bash
cd backend
npm install
npm run db:setup
```

Start the backend server:
```bash
npm run start
```
The server will start listening at `http://localhost:5000`.

### 2. Frontend Configuration
Install dependencies and run the Vite server:
```bash
cd ../frontend
npm install
npm run dev
```
The application will launch locally at `http://localhost:3000`.

---

## 🔑 Quick Login Demo Accounts

Use the **Quick Login** panel on the login page or enter these credentials:

- **Fleet Manager**: `manager` / `password`
- **Driver**: `driver1` / `password`
- **Safety Officer**: `safety` / `password`
- **Financial Analyst**: `analyst` / `password`

---

## 📈 Compliance & Verification Plan

Refer to the interactive [walkthrough guide](demo_walkthrough_guide.md) for step-by-step scripts on verifying dispatcher recommendation engines, license warnings, soft-deletions, odometer warnings, and cost calculations.
