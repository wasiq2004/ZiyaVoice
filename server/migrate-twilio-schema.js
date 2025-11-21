const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const { readFileSync } = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ziya_voice_agent',
  multipleStatements: true
};

async function migrateSchema() {
  let connection;
  try {
    connection = await mysql.createConnection(MYSQL_CONFIG);
    console.log('Connected to MySQL database');

    // Read the schema file
    const schemaPath = path.resolve(__dirname, '../src/migrations/mysql-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await connection.query(schema);
    console.log('Database schema migrated successfully');

    // Also run the additional Twilio-specific migrations
    const additionalMigrations = `
      -- Create user_twilio_numbers table if it doesn't exist
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

      -- Add columns to calls table if they don't exist
      ALTER TABLE calls 
        ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(36) NULL,
        ADD COLUMN IF NOT EXISTS recording_url TEXT NULL,
        ADD COLUMN IF NOT EXISTS transcript TEXT NULL,
        ADD COLUMN IF NOT EXISTS twilio_number_id VARCHAR(36) NULL;

      -- Create call_segments table if it doesn't exist
      CREATE TABLE IF NOT EXISTS call_segments (
        id VARCHAR(36) PRIMARY KEY,
        call_id VARCHAR(36) NOT NULL,
        user_transcript TEXT,
        agent_response TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (call_id) REFERENCES calls(id) ON DELETE CASCADE
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_user_twilio_numbers_user_id ON user_twilio_numbers(user_id);
      CREATE INDEX IF NOT EXISTS idx_user_twilio_numbers_phone ON user_twilio_numbers(phone_number);
      CREATE INDEX IF NOT EXISTS idx_user_twilio_numbers_verified ON user_twilio_numbers(verified);
      CREATE INDEX IF NOT EXISTS idx_calls_campaign_id ON calls(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_calls_twilio_number_id ON calls(twilio_number_id);
      CREATE INDEX IF NOT EXISTS idx_call_segments_call_id ON call_segments(call_id);
      CREATE INDEX IF NOT EXISTS idx_call_segments_timestamp ON call_segments(timestamp);
    `;

    await connection.query(additionalMigrations);
    console.log('Additional Twilio migrations completed');

  } catch (error) {
    console.error('Error migrating schema:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

migrateSchema();

