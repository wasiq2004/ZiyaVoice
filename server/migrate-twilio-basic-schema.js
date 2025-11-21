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
    const schemaPath = path.resolve(__dirname, 'migrations/twilio-schema.sql');
    const schema = readFileSync(schemaPath, 'utf8');

    // Execute the schema
    await connection.query(schema);
    console.log('✅ Twilio basic schema migrated successfully');

    // Verify tables were created
    const [tables] = await connection.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('phone_numbers', 'calls')
    `, [MYSQL_CONFIG.database]);

    console.log('\nCreated tables:');
    tables.forEach((table) => {
      console.log(`  - ${table.TABLE_NAME}`);
    });

    console.log('\n✅ Migration complete!');
  } catch (error) {
    console.error('❌ Error migrating schema:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nDatabase connection closed');
    }
  }
}

migrateSchema();


