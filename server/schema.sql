-- ============================================================
-- Vehicle Requisition Portal — Enterprise Database Schema
-- MySQL 8.0+
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE DATABASE IF NOT EXISTS vehicle_requisition_portal
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE vehicle_requisition_portal;

-- ────────────────────────────────────────────────────────────
-- 1. ORGANIZATION & STRUCTURE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campuses (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  location VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS buildings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50),
  FOREIGN KEY (campus_id) REFERENCES campuses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cost_centers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  cost_center_id INT,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (cost_center_id) REFERENCES cost_centers(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS department_budgets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  department_id INT NOT NULL,
  fiscal_year YEAR NOT NULL,
  allocated_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  spent_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (department_id) REFERENCES departments(id),
  UNIQUE KEY unique_dept_year (department_id, fiscal_year)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 2. RBAC & USER MANAGEMENT
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS roles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS permissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  module VARCHAR(50) NOT NULL,
  description VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL,
  permission_id INT NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT,
  department_id INT,
  employee_number VARCHAR(50) UNIQUE,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  avatar_url VARCHAR(500),
  is_active TINYINT(1) DEFAULT 1,
  is_locked TINYINT(1) DEFAULT 0,
  email_verified TINYINT(1) DEFAULT 0,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS user_roles (
  user_id INT NOT NULL,
  role_id INT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS emergency_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  contact_name VARCHAR(150) NOT NULL,
  relation VARCHAR(50),
  phone VARCHAR(20) NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 3. SECURITY & SESSIONS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_by INT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS api_keys (
  id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  is_revoked TINYINT(1) DEFAULT 0,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(255) PRIMARY KEY,
  user_id INT NOT NULL,
  ip_address VARCHAR(45),
  device_info VARCHAR(255),
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS login_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  ip_address VARCHAR(45),
  device_info VARCHAR(255),
  success TINYINT(1) NOT NULL,
  login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS failed_login_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  ip_address VARCHAR(45) NOT NULL,
  attempt_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email_time (email, attempt_time)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 4. FLEET ENTITIES
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicle_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_locations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  name VARCHAR(150) NOT NULL,
  type ENUM('Garage', 'Parking Lot', 'Service Center') DEFAULT 'Parking Lot',
  FOREIGN KEY (campus_id) REFERENCES campuses(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  category_id INT NOT NULL,
  current_location_id INT,
  registration_no VARCHAR(50) NOT NULL UNIQUE,
  make VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  manufacturing_year YEAR NOT NULL,
  capacity INT NOT NULL DEFAULT 4,
  fuel_type ENUM('Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG') NOT NULL,
  status ENUM('Available', 'In_Use', 'Maintenance', 'Out_Of_Service') DEFAULT 'Available',
  current_odometer INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (category_id) REFERENCES vehicle_categories(id),
  FOREIGN KEY (current_location_id) REFERENCES vehicle_locations(id),
  INDEX idx_vehicle_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS drivers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT NOT NULL,
  user_id INT UNIQUE, -- If the driver is also a system user
  license_number VARCHAR(50) NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  is_available TINYINT(1) DEFAULT 1,
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_license_expiry (license_expiry)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 5. FLEET LIFECYCLE & COMPLIANCE
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicle_documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  doc_type VARCHAR(100) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  issue_date DATE,
  expiry_date DATE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_doc_expiry (expiry_date)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_insurance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  provider VARCHAR(150) NOT NULL,
  policy_number VARCHAR(100) NOT NULL,
  premium_amount DECIMAL(10,2),
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_fitness (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  certificate_number VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_pollution (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  certificate_number VARCHAR(100) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  scheduled_date DATE NOT NULL,
  description TEXT NOT NULL,
  status ENUM('Scheduled', 'In_Progress', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
  created_by INT,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id)
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

CREATE TABLE IF NOT EXISTS vehicle_gps_tracking (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  vehicle_id INT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  speed DECIMAL(5,2) DEFAULT 0.00,
  heading DECIMAL(5,2),
  recorded_at TIMESTAMP NOT NULL,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE,
  INDEX idx_gps_vehicle_time (vehicle_id, recorded_at)
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 6. WORKFLOWS & REQUESTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS travel_purposes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  is_active TINYINT(1) DEFAULT 1
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS approval_workflows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campus_id INT,
  name VARCHAR(150) NOT NULL,
  description VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  FOREIGN KEY (campus_id) REFERENCES campuses(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS workflow_steps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  workflow_id INT NOT NULL,
  step_order INT NOT NULL,
  role_id INT NOT NULL,
  is_final_approval TINYINT(1) DEFAULT 0,
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vehicle_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  requester_id INT NOT NULL,
  department_id INT NOT NULL,
  campus_id INT NOT NULL,
  travel_purpose_id INT NOT NULL,
  workflow_id INT,
  pickup_location VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  travel_type ENUM('Local', 'Outstation') NOT NULL DEFAULT 'Local',
  passengers INT NOT NULL DEFAULT 1,
  travel_date DATE NOT NULL,
  travel_time TIME NOT NULL,
  return_date DATE,
  return_time TIME,
  status ENUM('Pending_HOD','Approved_HOD','Rejected_HOD','Pending_COO','Approved_COO','Rejected_COO','Vehicle_Assigned','In_Transit','Completed','Cancelled','Deleted') NOT NULL DEFAULT 'Pending_HOD',
  current_step_id INT,
  work_type ENUM('Personal', 'Company') NOT NULL DEFAULT 'Company',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id),
  FOREIGN KEY (department_id) REFERENCES departments(id),
  FOREIGN KEY (campus_id) REFERENCES campuses(id),
  FOREIGN KEY (travel_purpose_id) REFERENCES travel_purposes(id),
  FOREIGN KEY (workflow_id) REFERENCES approval_workflows(id),
  FOREIGN KEY (current_step_id) REFERENCES workflow_steps(id),
  INDEX idx_request_status (status),
  INDEX idx_request_campus_date (campus_id, travel_date)
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
  FOREIGN KEY (actor_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES vehicle_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_attachments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  uploaded_by INT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES vehicle_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS request_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  status_from VARCHAR(50),
  status_to VARCHAR(50) NOT NULL,
  changed_by INT,
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES vehicle_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 7. DISPATCH & TRIPS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vehicle_assignments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL UNIQUE,
  vehicle_id INT NOT NULL,
  driver_id INT NOT NULL,
  assigned_by INT NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Assigned', 'In_Progress', 'Completed', 'Cancelled') DEFAULT 'Assigned',
  FOREIGN KEY (request_id) REFERENCES vehicle_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(id),
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trip_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  assignment_id INT NOT NULL UNIQUE,
  start_time DATETIME NOT NULL,
  end_time DATETIME,
  start_odometer INT NOT NULL,
  end_odometer INT,
  start_location_id INT,
  end_location_id INT,
  remarks TEXT,
  FOREIGN KEY (assignment_id) REFERENCES vehicle_assignments(id) ON DELETE CASCADE,
  FOREIGN KEY (start_location_id) REFERENCES vehicle_locations(id),
  FOREIGN KEY (end_location_id) REFERENCES vehicle_locations(id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS trip_checklists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  trip_id INT NOT NULL UNIQUE,
  exterior_clean TINYINT(1) DEFAULT 1,
  interior_clean TINYINT(1) DEFAULT 1,
  fuel_level DECIMAL(5,2) DEFAULT 100.00,
  tyre_pressure_ok TINYINT(1) DEFAULT 1,
  documents_present TINYINT(1) DEFAULT 1,
  remarks TEXT,
  FOREIGN KEY (trip_id) REFERENCES trip_logs(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ────────────────────────────────────────────────────────────
-- 8. AUDIT, LOGS & REPORTS
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  type ENUM('System', 'Request', 'Approval', 'Maintenance', 'Alert') DEFAULT 'System',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS notification_preferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  email_enabled TINYINT(1) DEFAULT 1,
  sms_enabled TINYINT(1) DEFAULT 0,
  push_enabled TINYINT(1) DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  activity_type VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  query_config JSON,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS report_exports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  report_id INT NOT NULL,
  generated_by INT NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  format ENUM('PDF', 'Excel', 'CSV') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (report_id) REFERENCES reports(id) ON DELETE CASCADE,
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;
