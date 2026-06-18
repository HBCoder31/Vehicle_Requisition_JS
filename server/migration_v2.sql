-- ============================================================
-- Vehicle Requisition Portal — Enterprise Migration Script V2
-- Goal: Non-destructive migration to add Enterprise features
-- preserving existing tables (employees, vehicles, etc.)
-- ============================================================

USE vehicle_requisition_portal;

SET FOREIGN_KEY_CHECKS = 0;

-- ────────────────────────────────────────────────────────────
-- 1. DRIVER MANAGEMENT IMPROVEMENTS
-- ────────────────────────────────────────────────────────────

-- Alter drivers table to add licensing and link to campuses
ALTER TABLE drivers 
ADD COLUMN campus_id INT NULL AFTER id,
ADD COLUMN license_number VARCHAR(50) NULL UNIQUE AFTER campus_id,
ADD COLUMN license_expiry DATE NULL AFTER license_number;

-- Add a strict foreign key for drivers in vehicle_requests (allows NULL for backward compatibility)
ALTER TABLE vehicle_requests 
ADD COLUMN assigned_driver_id INT NULL AFTER assigned_vehicle_id,
ADD CONSTRAINT fk_requests_driver FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id);


-- ────────────────────────────────────────────────────────────
-- 2. VEHICLE MAINTENANCE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  scheduled_date DATE NOT NULL,
  description TEXT NOT NULL,
  status ENUM('Scheduled', 'In_Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES employees(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS maintenance_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  maintenance_id INT,
  vehicle_id INT NOT NULL,
  maintenance_date DATE NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  description TEXT NOT NULL,
  vendor VARCHAR(150),
  invoice_url VARCHAR(500),
  FOREIGN KEY (maintenance_id) REFERENCES vehicle_maintenance(id) ON DELETE SET NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 3. FUEL TRACKING
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fuel_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  driver_id INT,
  log_date DATETIME NOT NULL,
  liters DECIMAL(8,2) NOT NULL,
  cost DECIMAL(10,2) NOT NULL,
  odometer_reading INT NOT NULL,
  receipt_url VARCHAR(500),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Alter vehicles to track current odometer and compliance
ALTER TABLE vehicles
ADD COLUMN current_odometer INT DEFAULT 0,
ADD COLUMN insurance_expiry DATE NULL,
ADD COLUMN fitness_expiry DATE NULL,
ADD COLUMN pollution_expiry DATE NULL;

-- ────────────────────────────────────────────────────────────
-- 4. FILE ATTACHMENTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS request_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES vehicle_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES employees(id)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 5. REQUEST HISTORY & AUDIT LOGS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS request_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  status_from VARCHAR(50),
  status_to VARCHAR(50) NOT NULL,
  changed_by INT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES vehicle_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES employees(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INT NOT NULL,
  old_data JSON,
  new_data JSON,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 6. NOTIFICATIONS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('System', 'Request', 'Approval', 'Maintenance', 'Alert') DEFAULT 'System',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  email_enabled TINYINT(1) DEFAULT 1,
  sms_enabled TINYINT(1) DEFAULT 0,
  push_enabled TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 7. APPROVAL WORKFLOW IMPROVEMENTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS approval_workflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workflow_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  step_order INT NOT NULL,
  role_name VARCHAR(50) NOT NULL, -- e.g., 'HOD', 'COO'
  is_final_approval TINYINT(1) DEFAULT 0,
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workflow_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  step_id INT,
  actor_id INT NOT NULL,
  action ENUM('Approved', 'Rejected', 'Forwarded', 'Returned') NOT NULL,
  comments TEXT,
  action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES vehicle_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (step_id) REFERENCES workflow_steps(id) ON DELETE SET NULL,
  FOREIGN KEY (actor_id) REFERENCES employees(id)
) ENGINE=InnoDB;

-- Associate dynamic workflow to existing requests if needed
ALTER TABLE vehicle_requests
ADD COLUMN workflow_id INT NULL AFTER purpose,
ADD COLUMN current_step_id INT NULL AFTER status,
ADD CONSTRAINT fk_request_workflow FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id),
ADD CONSTRAINT fk_request_step FOREIGN KEY (current_step_id) REFERENCES workflow_steps(id);

SET FOREIGN_KEY_CHECKS = 1;
