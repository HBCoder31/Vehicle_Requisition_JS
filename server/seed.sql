-- ============================================================
-- Vehicle Requisition Portal — Seed Data
-- Run AFTER schema.sql
-- ============================================================

USE vehicle_requisition_portal;

-- ────────────────────────────────────────────────────────────
-- Departments
-- ────────────────────────────────────────────────────────────
INSERT INTO departments (name, code) VALUES
  ('Human Resources',  'HR'),
  ('Information Technology', 'IT'),
  ('Finance & Accounts', 'FIN'),
  ('Operations',       'OPS'),
  ('Administration',   'ADM')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ────────────────────────────────────────────────────────────
-- Employees
-- 
-- Passwords are all set to 'password123'
-- ────────────────────────────────────────────────────────────
INSERT INTO employees (employee_number, email, password_hash, full_name, role, department_id, phone) VALUES
  -- Admin
  ('EMP001', 'harshbohra41@gmail.com', '$2b$10$y2pag8Hp2ymVcC5n5bNjl.cgTq6YBppluUKJ7y7qsbNmJwyBCz5xu', 'System Administrator', 'Admin',    5, '+91-9000000001'),

  -- COO
  ('EMP002', 'nisha.bhilwara@gmail.com', '$2b$10$y2pag8Hp2ymVcC5n5bNjl.cgTq6YBppluUKJ7y7qsbNmJwyBCz5xu', 'Rajesh Kumar',         'COO',      NULL, '+91-9000000002'),

  -- HODs (one per department)
  ('EMP003', 'sharad.bhilwara@gmail.com', '$2b$10$y2pag8Hp2ymVcC5n5bNjl.cgTq6YBppluUKJ7y7qsbNmJwyBCz5xu', 'Priya Sharma',         'HOD',      1, '+91-9000000003'),
 

  -- Garage
  ('EMP004', 'bohrakartikeya@gmail.com', '$2b$10$y2pag8Hp2ymVcC5n5bNjl.cgTq6YBppluUKJ7y7qsbNmJwyBCz5xu', 'Garage Manager',       'Garage',   NULL, '+91-9000000007'),

  -- Regular Employees
  ('EMP005', 'newharsh31@gmail.com', '$2b$10$y2pag8Hp2ymVcC5n5bNjl.cgTq6YBppluUKJ7y7qsbNmJwyBCz5xu', 'Neha Gupta',           'Employee', 1, '+91-9000000008')
  
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), employee_number = VALUES(employee_number);

-- ────────────────────────────────────────────────────────────
-- Vehicles
-- ────────────────────────────────────────────────────────────
INSERT INTO vehicles (registration_no, make, model, vehicle_type, capacity, fuel_type) VALUES
  ('MP-15-AB-1234', 'Maruti Suzuki', 'Dzire',     'Sedan', 4, 'Petrol'),
  ('MP-15-CD-5678', 'Toyota',        'Innova',    'SUV',   7, 'Diesel'),
  ('MP-15-EF-9012', 'Mahindra',      'Bolero',    'SUV',   7, 'Diesel'),
  ('MP-15-GH-3456', 'Tata',          'Winger',    'Van',  12, 'Diesel'),
  ('MP-15-IJ-7890', 'Ashok Leyland', 'Bus 32S',   'Bus',  32, 'Diesel')
ON DUPLICATE KEY UPDATE make = VALUES(make);
