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

async function applySchema() {
  let connection;
  try {
    // First, connect without specifying a database to create the database
    let initialConnection = await mysql.createConnection({
      host: MYSQL_CONFIG.host,
      port: MYSQL_CONFIG.port,
      user: MYSQL_CONFIG.user,
      password: MYSQL_CONFIG.password
    });

    console.log('Connected to MySQL server');

    // Create database if it doesn't exist
    await initialConnection.execute(`CREATE DATABASE IF NOT EXISTS ${MYSQL_CONFIG.database}`);
    console.log(`Database ${MYSQL_CONFIG.database} created or already exists`);

    await initialConnection.end();

    // Now connect with the database specified
    connection = await mysql.createConnection({
      host: MYSQL_CONFIG.host,
      port: MYSQL_CONFIG.port,
      user: MYSQL_CONFIG.user,
      password: MYSQL_CONFIG.password,
      database: MYSQL_CONFIG.database
    });

    console.log(`Using database ${MYSQL_CONFIG.database}`);

    // Read the schema file
    const schemaPath = path.resolve('../src/migrations/mysql-schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');

    // Split the schema into individual statements
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    // Execute each statement
    for (const statement of statements) {
      if (statement.toUpperCase().startsWith('USE ') || 
          statement.toUpperCase().startsWith('CREATE DATABASE ')) {
        continue; // Skip these as we've already handled them
      }
      
      try {
        await connection.execute(statement);
        console.log('Executed:', statement.substring(0, 50) + (statement.length > 50 ? '...' : ''));
      } catch (error) {
        console.warn('Warning executing statement:', error.message);
        console.log('Statement:', statement);
      }
    }

    console.log('Schema applied successfully');
  } catch (error) {
    console.error('Error applying schema:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Connection closed');
    }
  }
}

applySchema();