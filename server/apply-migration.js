const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.resolve('./.env') });

// MySQL connection configuration
const MYSQL_CONFIG = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'ziya_voice_agent',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

async function applyMigrations() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: MYSQL_CONFIG.host,
      port: MYSQL_CONFIG.port,
      user: MYSQL_CONFIG.user,
      password: MYSQL_CONFIG.password,
      database: MYSQL_CONFIG.database
    });

    console.log(`Connected to database ${MYSQL_CONFIG.database}`);

    // Read the migration file
    const migrationPath = path.resolve('./migrations/add-updated-at-to-agents.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf8');

    // Split into statements
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      try {
        await connection.execute(statement);
        console.log('✓ Executed:', statement.substring(0, 80) + (statement.length > 80 ? '...' : ''));
      } catch (error) {
        console.error('✗ Error:', error.message);
        console.log('  Statement:', statement);
      }
    }

    console.log('Migrations applied successfully!');
  } catch (error) {
    console.error('Error applying migrations:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }
}

applyMigrations();
