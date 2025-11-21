-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS ziya_voice_agent;
USE ziya_voice_agent;

-- Create users table (equivalent to Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  google_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Create profiles table to store additional user information
CREATE TABLE IF NOT EXISTS profiles (
  id VARCHAR(36) PRIMARY KEY,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  username VARCHAR(255) UNIQUE,
  full_name VARCHAR(255),
  avatar_url TEXT,
  FOREIGN KEY (id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create user_credits table to store credit information for each user
CREATE TABLE IF NOT EXISTS user_credits (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  total_credits INT DEFAULT 0,
  used_credits INT DEFAULT 0,
  gemini_credits INT DEFAULT 0,
  elevenlabs_credits INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create credit_transactions table to track credit purchases and usage
CREATE TABLE IF NOT EXISTS credit_transactions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  transaction_type ENUM('purchase', 'usage') NOT NULL,
  service_type ENUM('gemini', 'elevenlabs', 'platform') NOT NULL,
  amount INT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

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

-- Create agents table to store voice agents
CREATE TABLE IF NOT EXISTS agents (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  name VARCHAR(255) NOT NULL,
  identity TEXT,
  status VARCHAR(50) DEFAULT 'Active',
  model VARCHAR(100) DEFAULT 'gemini-2.5-flash',
  voice_id VARCHAR(100),
  language VARCHAR(50),
  settings JSON,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create documents table to store knowledge base documents
CREATE TABLE IF NOT EXISTS documents (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  agent_id VARCHAR(36),
  name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  file_size INT,
  content LONGTEXT,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create phone_numbers table to store phone number information
CREATE TABLE IF NOT EXISTS phone_numbers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  number VARCHAR(50) NOT NULL,
  country_code VARCHAR(10),
  source VARCHAR(100),
  agent_name VARCHAR(255),
  agent_id VARCHAR(36),
  region VARCHAR(100),
  next_cycle TIMESTAMP NULL,
  provider VARCHAR(50),
  twilio_sid VARCHAR(100), -- Twilio SID for the purchased number
  capabilities JSON, -- Capabilities of the phone number
  purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, -- When the number was purchased
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE SET NULL
);

-- Create calls table to store call information
CREATE TABLE IF NOT EXISTS calls (
  id VARCHAR(36) PRIMARY KEY,
  phone_number_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  agent_id VARCHAR(36) NOT NULL,
  call_sid VARCHAR(100), -- Twilio Call SID
  from_number VARCHAR(50),
  to_number VARCHAR(50),
  status VARCHAR(50) DEFAULT 'initiated',
  provider VARCHAR(50) DEFAULT 'twilio',
  model VARCHAR(100),
  voice_id VARCHAR(100),
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  duration INT DEFAULT 0, -- Duration in seconds
  FOREIGN KEY (phone_number_id) REFERENCES phone_numbers(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

-- Create call_logs table to store call processing logs
CREATE TABLE IF NOT EXISTS call_logs (
  id VARCHAR(36) PRIMARY KEY,
  call_id VARCHAR(36) NOT NULL,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  log_type VARCHAR(50), -- 'stt', 'llm', 'tts', 'info', 'error'
  message TEXT,
  data JSON, -- Additional structured data
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- Create api_keys table to store user-specific API keys
CREATE TABLE IF NOT EXISTS user_api_keys (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  api_key VARCHAR(512) NOT NULL, -- Increased size to accommodate hashed keys
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_service (user_id, service_name)
);

-- Create indexes for better performance
CREATE INDEX idx_agents_user_id ON agents(user_id);
CREATE INDEX idx_agents_created_at ON agents(created_at);
CREATE INDEX idx_documents_user_id ON documents(user_id);
CREATE INDEX idx_documents_agent_id ON documents(agent_id);
CREATE INDEX idx_phone_numbers_user_id ON phone_numbers(user_id);
CREATE INDEX idx_phone_numbers_agent_id ON phone_numbers(agent_id);
CREATE INDEX idx_phone_numbers_created_at ON phone_numbers(created_at);
CREATE INDEX idx_phone_numbers_twilio_sid ON phone_numbers(twilio_sid);
CREATE INDEX idx_calls_phone_number_id ON calls(phone_number_id);
CREATE INDEX idx_calls_user_id ON calls(user_id);
CREATE INDEX idx_calls_agent_id ON calls(agent_id);
CREATE INDEX idx_calls_call_sid ON calls(call_sid);
CREATE INDEX idx_calls_started_at ON calls(started_at);
CREATE INDEX idx_call_logs_call_id ON call_logs(call_id);
CREATE INDEX idx_call_logs_timestamp ON call_logs(timestamp);
CREATE INDEX idx_user_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_user_api_keys_service_name ON user_api_keys(service_name);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  caller_phone VARCHAR(50),
  include_metadata BOOLEAN DEFAULT TRUE,
  status VARCHAR(50) DEFAULT 'idle',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create campaign_records table
CREATE TABLE IF NOT EXISTS campaign_records (
  id VARCHAR(36) PRIMARY KEY,
  campaign_id VARCHAR(36) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  call_status VARCHAR(50) DEFAULT 'pending',
  call_sid VARCHAR(100),
  recording_url TEXT,
  retries INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
);

-- Create dncs table for Do Not Call list
CREATE TABLE IF NOT EXISTS dncs (
  id VARCHAR(36) PRIMARY KEY,
  phone VARCHAR(50) NOT NULL,
  user_id VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_phone (phone)
);

-- Create indexes for campaigns and campaign_records
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_campaign_records_campaign_id ON campaign_records(campaign_id);
CREATE INDEX idx_campaign_records_call_sid ON campaign_records(call_sid);
CREATE INDEX idx_campaign_records_created_at ON campaign_records(created_at);

-- Create index for DNC table
CREATE INDEX idx_dncs_phone ON dncs(phone);
CREATE INDEX idx_dncs_user_id ON dncs(user_id);

-- Create user_twilio_numbers table for storing user's Twilio phone numbers with verification
CREATE TABLE IF NOT EXISTS user_twilio_numbers (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  region VARCHAR(100),
  provider VARCHAR(50) DEFAULT 'twilio',
  verified BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(10),
  verification_expires_at TIMESTAMP NULL,
  twilio_account_sid VARCHAR(100) NOT NULL,
  twilio_auth_token VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_phone (user_id, phone_number)
);

-- Update calls table to include additional fields
ALTER TABLE calls ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(36) NULL;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS recording_url TEXT NULL;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS transcript TEXT NULL;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS twilio_number_id VARCHAR(36) NULL;

-- Create call_segments table to store individual conversation segments
CREATE TABLE IF NOT EXISTS call_segments (
  id VARCHAR(36) PRIMARY KEY,
  call_id VARCHAR(36) NOT NULL,
  user_transcript TEXT,
  agent_response TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
);

-- Create indexes for new tables
CREATE INDEX idx_user_twilio_numbers_user_id ON user_twilio_numbers(user_id);
CREATE INDEX idx_user_twilio_numbers_phone ON user_twilio_numbers(phone_number);
CREATE INDEX idx_user_twilio_numbers_verified ON user_twilio_numbers(verified);
CREATE INDEX idx_calls_campaign_id ON calls(campaign_id);
CREATE INDEX idx_calls_twilio_number_id ON calls(twilio_number_id);
CREATE INDEX idx_call_segments_call_id ON call_segments(call_id);
CREATE INDEX idx_call_segments_timestamp ON call_segments(timestamp);