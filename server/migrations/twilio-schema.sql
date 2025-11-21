-- Twilio Integration Database Schema

-- Create user_twilio_configs table to store user-specific Twilio credentials
CREATE TABLE IF NOT EXISTS user_twilio_configs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  account_sid VARCHAR(100) NOT NULL,
  auth_token VARCHAR(100) NOT NULL,
  api_key_sid VARCHAR(100),
  api_key_secret VARCHAR(100),
  app_url VARCHAR(500) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_config (user_id),
  INDEX idx_user_id (user_id)
);

-- Create phone_numbers table (user-specific)
CREATE TABLE IF NOT EXISTS phone_numbers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  number VARCHAR(50) NOT NULL,
  twilio_number_sid VARCHAR(100) NOT NULL,
  provider VARCHAR(50) DEFAULT 'twilio',
  region VARCHAR(100),
  capabilities JSON,
  voice_webhook_url TEXT,
  status_webhook_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_number (user_id, number),
  INDEX idx_user_id (user_id),
  INDEX idx_number (number),
  INDEX idx_twilio_sid (twilio_number_sid),
  INDEX idx_provider (provider)
);

-- Create calls table (user-specific)
CREATE TABLE IF NOT EXISTS calls (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  call_sid VARCHAR(100) NOT NULL,
  from_number VARCHAR(50) NOT NULL,
  to_number VARCHAR(50) NOT NULL,
  direction ENUM('inbound', 'outbound') NOT NULL,
  status VARCHAR(50) DEFAULT 'initiated',
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  duration INT DEFAULT 0,
  recording_url TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_call_sid (call_sid),
  INDEX idx_from_number (from_number),
  INDEX idx_to_number (to_number),
  INDEX idx_direction (direction),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp)
);


