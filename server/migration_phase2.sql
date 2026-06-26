-- ============================================================
-- Vehicle Requisition Portal — Phase 2 Feature Migrations
-- Non-destructive updates to add gate security and billing.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Alter employees.role to support 'Security Guard'
ALTER TABLE employees MODIFY COLUMN role ENUM('Employee','HOD','GM-HR','COO','Garage','Admin','Security Guard') NOT NULL DEFAULT 'Employee';

-- 2. Alter vehicle_requests.status to support 'Vehicle Out' and 'Vehicle Returned'
ALTER TABLE vehicle_requests MODIFY COLUMN status ENUM('Pending_HOD','Approved_HOD','Rejected_HOD','Pending_GM_HR','Approved_GM_HR','Rejected_GM_HR','Pending_COO','Approved_COO','Rejected_COO','Vehicle_Assigned','In_Transit','Completed','Cancelled','Deleted','Vehicle Out','Vehicle Returned') NOT NULL DEFAULT 'Pending_HOD';

-- 3. Create travel_costs table
CREATE TABLE IF NOT EXISTS travel_costs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_type VARCHAR(100) UNIQUE NOT NULL,
  cost_per_km DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  updated_by INT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 4. Create vehicle_trip_logs table
CREATE TABLE IF NOT EXISTS vehicle_trip_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT UNIQUE NOT NULL,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  employee_id INT NOT NULL,
  
  -- Exit details
  exit_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  odometer_out INT NOT NULL,
  fuel_level_out VARCHAR(50) NULL,
  gate_no_out VARCHAR(50) NOT NULL,
  security_guard_out VARCHAR(150) NOT NULL,
  remarks_out TEXT NULL,
  photo_url_out VARCHAR(500) NULL,
  
  -- Return details
  entry_time TIMESTAMP NULL,
  odometer_in INT NULL,
  fuel_level_in VARCHAR(50) NULL,
  vehicle_condition VARCHAR(255) NULL,
  damage_report TEXT NULL,
  remarks_in TEXT NULL,
  photo_url_in VARCHAR(500) NULL,
  
  -- Calculation details
  distance_travelled INT DEFAULT 0,
  cost_per_km DECIMAL(10,2) DEFAULT 0.00,
  travel_cost DECIMAL(12,2) DEFAULT 0.00,
  
  status ENUM('Vehicle Out', 'Vehicle Returned') NOT NULL DEFAULT 'Vehicle Out',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (request_id) REFERENCES vehicle_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 5. Create odometer_entries table
CREATE TABLE IF NOT EXISTS odometer_entries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  trip_log_id INT NULL,
  reading_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reading_val INT NOT NULL,
  type ENUM('Exit', 'Return', 'Fuel', 'Maintenance', 'Manual') NOT NULL,
  recorded_by INT NOT NULL,
  remarks TEXT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (trip_log_id) REFERENCES vehicle_trip_logs(id) ON DELETE SET NULL,
  FOREIGN KEY (recorded_by) REFERENCES employees(id)
) ENGINE=InnoDB;

-- 6. Create employee_travel_summary table
CREATE TABLE IF NOT EXISTS employee_travel_summary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT UNIQUE NOT NULL,
  total_trips INT DEFAULT 0,
  total_distance DECIMAL(12,2) DEFAULT 0.00,
  total_cost DECIMAL(15,2) DEFAULT 0.00,
  total_paid DECIMAL(15,2) DEFAULT 0.00,
  outstanding_balance DECIMAL(15,2) DEFAULT 0.00,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Create payment_history table
CREATE TABLE IF NOT EXISTS payment_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  payment_date DATE NOT NULL,
  amount_paid DECIMAL(15,2) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL,
  receipt_number VARCHAR(100) UNIQUE NOT NULL,
  remarks TEXT NULL,
  recorded_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (recorded_by) REFERENCES employees(id)
) ENGINE=InnoDB;

-- 8. Create generated_bills table
CREATE TABLE IF NOT EXISTS generated_bills (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_log_id INT UNIQUE NOT NULL,
  bill_number VARCHAR(100) UNIQUE NOT NULL,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  generated_by INT NOT NULL,
  FOREIGN KEY (trip_log_id) REFERENCES vehicle_trip_logs(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES employees(id)
) ENGINE=InnoDB;

-- Seed default travel rates for vehicle types
INSERT INTO travel_costs (vehicle_type, cost_per_km) VALUES
  ('Sedan', 12.00),
  ('SUV', 15.00),
  ('Van', 15.00),
  ('Bus', 30.00)
ON DUPLICATE KEY UPDATE cost_per_km = VALUES(cost_per_km);

-- Seed default security guard user
INSERT INTO employees (employee_number, email, password_hash, full_name, role, department_id, phone) VALUES
  ('EMP006', 'security@opil.in', '$2b$10$y2pag8Hp2ymVcC5n5bNjl.cgTq6YBppluUKJ7y7qsbNmJwyBCz5xu', 'Security Gate Officer', 'Security Guard', 5, '+91-9000000009')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

SET FOREIGN_KEY_CHECKS = 1;
