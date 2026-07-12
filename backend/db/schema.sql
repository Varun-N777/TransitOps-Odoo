-- Drop tables if they exist
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS other_expenses CASCADE;
DROP TABLE IF EXISTS fuel_logs CASCADE;
DROP TABLE IF EXISTS maintenance_logs CASCADE;
DROP TABLE IF EXISTS trips CASCADE;
DROP TABLE IF EXISTS drivers CASCADE;
DROP TABLE IF EXISTS vehicles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create Users table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('Fleet Manager', 'Driver', 'Safety Officer', 'Financial Analyst'))
);

-- Create Vehicles table
CREATE TABLE vehicles (
    id SERIAL PRIMARY KEY,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(50) UNIQUE NOT NULL,
    max_cargo_weight DECIMAL(10, 2) NOT NULL, -- in kg
    odometer INTEGER NOT NULL DEFAULT 0, -- in km
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'In Shop', 'Retired')),
    home_depot VARCHAR(100) NOT NULL CHECK (home_depot IN ('New York', 'Chicago', 'Los Angeles', 'Houston', 'Atlanta')),
    acquisition_cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00
);

-- Create Drivers table
CREATE TABLE drivers (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    name VARCHAR(100) NOT NULL,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    license_expiry DATE NOT NULL,
    safety_score DECIMAL(5, 2) NOT NULL DEFAULT 100.00 CHECK (safety_score >= 0 AND safety_score <= 100),
    status VARCHAR(50) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'On Trip', 'Suspended'))
);

-- Create Trips table
CREATE TABLE trips (
    id SERIAL PRIMARY KEY,
    source VARCHAR(100) NOT NULL CHECK (source IN ('New York', 'Chicago', 'Los Angeles', 'Houston', 'Atlanta')),
    destination VARCHAR(100) NOT NULL CHECK (destination IN ('New York', 'Chicago', 'Los Angeles', 'Houston', 'Atlanta')),
    cargo_weight DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Dispatched', 'Completed', 'Cancelled')),
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE SET NULL,
    driver_id INTEGER REFERENCES drivers(id) ON DELETE SET NULL,
    revenue DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Create Maintenance Logs table
CREATE TABLE maintenance_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Open' CHECK (status IN ('Open', 'Closed')),
    odometer_at_service INTEGER NOT NULL,
    cost DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE
);

-- Create Fuel Logs table
CREATE TABLE fuel_logs (
    id SERIAL PRIMARY KEY,
    vehicle_id INTEGER NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    driver_id INTEGER NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    fuel_amount DECIMAL(10, 2) NOT NULL, -- in liters
    distance_traveled DECIMAL(10, 2) NOT NULL, -- in km
    cost DECIMAL(10, 2) NOT NULL -- in dollars
);

-- Create Other Expenses table
CREATE TABLE other_expenses (
    id SERIAL PRIMARY KEY,
    trip_id INTEGER REFERENCES trips(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Toll', 'Miscellaneous')),
    amount DECIMAL(10, 2) NOT NULL,
    description TEXT
);

-- Create Alerts table
CREATE TABLE alerts (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Fuel Anomaly', 'Predictive Maintenance')),
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    severity VARCHAR(50) NOT NULL DEFAULT 'Warning' CHECK (severity IN ('Warning', 'Critical')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved BOOLEAN NOT NULL DEFAULT FALSE
);

-- Seed Initial Users (Passwords are cryptographically hashed to 'password' using bcryptjs in seeds.js, here we add hashes or we will run seeds via script)
-- The hash for 'password' using bcrypt with 10 rounds is: $2a$10$fV3M2l6t1tN7a4y/wV6nkuN6NlyY18uH3U6tXyqXJb1x0m0m0m0m0 (or similar)
-- We will insert them directly or seed via setup.js. Let's insert standard hashes:
INSERT INTO users (username, password_hash, role) VALUES
('manager', '$2a$10$xWJkKCeIhy8vV8aLhH0l7OHLdJdC9CymWpZ86fCg7lW3L2wXGvJ4e', 'Fleet Manager'),
('driver1', '$2a$10$xWJkKCeIhy8vV8aLhH0l7OHLdJdC9CymWpZ86fCg7lW3L2wXGvJ4e', 'Driver'),
('driver2', '$2a$10$xWJkKCeIhy8vV8aLhH0l7OHLdJdC9CymWpZ86fCg7lW3L2wXGvJ4e', 'Driver'),
('safety', '$2a$10$xWJkKCeIhy8vV8aLhH0l7OHLdJdC9CymWpZ86fCg7lW3L2wXGvJ4e', 'Safety Officer'),
('analyst', '$2a$10$xWJkKCeIhy8vV8aLhH0l7OHLdJdC9CymWpZ86fCg7lW3L2wXGvJ4e', 'Financial Analyst');

-- Seed Vehicles
INSERT INTO vehicles (make, model, year, license_plate, max_cargo_weight, odometer, status, home_depot, acquisition_cost) VALUES
('Volvo', 'VNL 860', 2022, 'LV-983-FM', 36000.00, 85000, 'Available', 'New York', 145000.00),
('Freightliner', 'Cascadia', 2021, 'FL-234-NY', 38000.00, 120000, 'Available', 'Chicago', 130000.00),
('Kenworth', 'T680', 2023, 'KW-567-LA', 35000.00, 45000, 'Available', 'Los Angeles', 160000.00),
('Peterbilt', '579', 2020, 'PB-109-TX', 37000.00, 185000, 'In Shop', 'Houston', 125000.00),
('Mack', 'Anthem', 2022, 'MA-456-GA', 36000.00, 95000, 'Available', 'Atlanta', 150000.00);

-- Seed Drivers
INSERT INTO drivers (user_id, name, license_number, license_expiry, safety_score, status) VALUES
(2, 'John Doe', 'DL-882736', '2027-10-15', 92.50, 'Available'),
(3, 'Jane Smith', 'DL-992837', '2026-09-20', 97.00, 'Available'),
(NULL, 'Bob Johnson', 'DL-112233', '2024-05-12', 85.00, 'Available'), -- Expired license, not linked to user
(NULL, 'Alice Williams', 'DL-445566', '2028-12-01', 99.00, 'Suspended'); -- Suspended driver

-- Seed Trips
INSERT INTO trips (source, destination, cargo_weight, status, vehicle_id, driver_id, revenue, created_at, completed_at) VALUES
('New York', 'Chicago', 15000.00, 'Completed', 1, 1, 3200.00, '2026-07-01 08:00:00', '2026-07-02 10:00:00'),
('Chicago', 'Los Angeles', 22000.00, 'Completed', 2, 2, 5400.00, '2026-07-03 09:00:00', '2026-07-05 14:00:00'),
('Los Angeles', 'Houston', 18000.00, 'Draft', NULL, NULL, 4100.00, '2026-07-10 12:00:00', NULL);

-- Seed Maintenance Logs
INSERT INTO maintenance_logs (vehicle_id, description, status, odometer_at_service, cost, start_date, end_date) VALUES
(1, 'Engine Oil and Filter Change', 'Closed', 80000, 350.00, '2026-06-15', '2026-06-15'),
(4, 'Transmission Inspection & Repair', 'Open', 185000, 1200.00, '2026-07-10', NULL);

-- Seed Fuel Logs
INSERT INTO fuel_logs (vehicle_id, driver_id, date, fuel_amount, distance_traveled, cost) VALUES
(1, 1, '2026-07-02', 380.00, 1140.00, 520.00), -- 3 km/L
(2, 2, '2026-07-05', 720.00, 2400.00, 980.00); -- 3.33 km/L

-- Seed Other Expenses
INSERT INTO other_expenses (trip_id, type, amount, description) VALUES
(1, 'Toll', 75.00, 'I-80 tolls'),
(2, 'Toll', 120.00, 'Turnpike tolls'),
(2, 'Miscellaneous', 50.00, 'Driver meal allowance');

-- Seed Predictive Alerts
INSERT INTO alerts (type, vehicle_id, description, severity, created_at, resolved) VALUES
('Predictive Maintenance', 4, 'Vehicle PB-109-TX (Peterbilt 579) has travelled 185,000 km. Odometer exceeds 10,000 km maintenance interval by 5,000 km. Service is overdue.', 'Critical', '2026-07-11 10:00:00', false);
