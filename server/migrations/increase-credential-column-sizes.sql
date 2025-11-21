-- Migration to increase column sizes for encrypted credentials
-- Encrypted data is longer than plain text (AES-256-GCM format: iv:authTag:encryptedData)

USE ziya_voice_agent;

-- Update user_twilio_numbers table
ALTER TABLE user_twilio_numbers 
  MODIFY COLUMN twilio_auth_token VARCHAR(500);

-- Update user_twilio_configs table  
ALTER TABLE user_twilio_configs
  MODIFY COLUMN auth_token VARCHAR(500),
  MODIFY COLUMN api_key_secret VARCHAR(500);

-- Verify changes
DESCRIBE user_twilio_numbers;
DESCRIBE user_twilio_configs;

SELECT 'Migration completed successfully!' AS status;
