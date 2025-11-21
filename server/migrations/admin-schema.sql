-- Admin Users Table
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  role ENUM('super_admin', 'admin', 'billing') DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
);

-- User Service Limits Table
CREATE TABLE IF NOT EXISTS user_service_limits (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  service_name ENUM('elevenlabs', 'gemini', 'deepgram') NOT NULL,
  monthly_limit DECIMAL(10, 2) DEFAULT NULL COMMENT 'NULL means unlimited',
  daily_limit DECIMAL(10, 2) DEFAULT NULL COMMENT 'NULL means unlimited',
  is_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_service (user_id, service_name),
  INDEX idx_user_id (user_id),
  INDEX idx_service_name (service_name)
);

-- User Service Usage Tracking Table
CREATE TABLE IF NOT EXISTS user_service_usage (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  service_name ENUM('elevenlabs', 'gemini', 'deepgram') NOT NULL,
  usage_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  usage_type ENUM('characters', 'tokens', 'dollars') NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_service_period (user_id, service_name, period_start, period_end),
  INDEX idx_period (period_start, period_end)
);

-- Platform Billing Records Table
CREATE TABLE IF NOT EXISTS platform_billing (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,
  elevenlabs_usage DECIMAL(10, 2) DEFAULT 0,
  gemini_usage DECIMAL(10, 2) DEFAULT 0,
  deepgram_usage DECIMAL(10, 2) DEFAULT 0,
  platform_fee DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) DEFAULT 0,
  status ENUM('pending', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_period (user_id, billing_period_start, billing_period_end),
  INDEX idx_status (status)
);

-- Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id VARCHAR(36) PRIMARY KEY,
  admin_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  target_user_id VARCHAR(36),
  details TEXT,
  ip_address VARCHAR(45),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  INDEX idx_admin_id (admin_id),
  INDEX idx_target_user (target_user_id),
  INDEX idx_created_at (created_at)
);

-- Insert default super admin (password: admin123 - CHANGE THIS IMMEDIATELY)
INSERT INTO admin_users (id, email, password_hash, name, role)
VALUES (
  'admin-super-001',
  'admin@ziyavoice.com',
  '$2a$10$YourHashedPasswordHere',
  'Super Admin',
  'super_admin'
) ON DUPLICATE KEY UPDATE email = email;
