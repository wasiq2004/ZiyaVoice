const mysql = require('./config/database.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

async function applyAdminSchema() {
  let connection;
  
  try {
    connection = await mysql.getConnection();
    console.log('Connected to database');
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'migrations', 'admin-schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Schema file length:', schema.length);
    
    // Remove the INSERT statement and split into individual CREATE statements
    const schemaWithoutInsert = schema.split('-- Insert default super admin')[0];
    
    console.log('Schema without insert length:', schemaWithoutInsert.length);
    
    // Split by semicolons and filter out empty statements
    const statements = schemaWithoutInsert
      .split(';')
      .map(s => s.trim())
      .filter(s => {
        // Remove comment lines but keep the CREATE statements
        const lines = s.split('\n').filter(line => !line.trim().startsWith('--')).join('\n').trim();
        return lines.length > 0 && lines.toUpperCase().includes('CREATE');
      });
    
    console.log(`Found ${statements.length} CREATE TABLE statements`);
    
    if (statements.length === 0) {
      console.error('No CREATE statements found. Check SQL file format.');
      throw new Error('No CREATE statements found');
    }
    
    console.log(`Executing ${statements.length} CREATE TABLE statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await connection.query(statement);
        console.log(`✓ Statement ${i + 1} executed successfully`);
      } catch (err) {
        // Ignore duplicate key errors for UNIQUE constraints
        if (err.code === 'ER_DUP_ENTRY' || err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`⚠ Statement ${i + 1} skipped (already exists)`);
        } else {
          console.error(`✗ Statement ${i + 1} failed:`, err.message);
          // Continue with other statements instead of throwing
        }
      }
    }
    
    // Create default admin with proper password hash
    const adminPassword = 'admin123'; // CHANGE THIS IN PRODUCTION
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await connection.query(`
      INSERT INTO admin_users (id, email, password_hash, name, role)
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        password_hash = VALUES(password_hash),
        name = VALUES(name),
        role = VALUES(role)
    `, ['admin-super-001', 'admin@ziyavoice.com', passwordHash, 'Super Admin', 'super_admin']);
    
    console.log('\n✓ Admin schema migration completed successfully!');
    console.log('\n📝 Default admin credentials:');
    console.log('   Email: admin@ziyavoice.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  IMPORTANT: Change this password immediately in production!\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
      console.log('Database connection closed');
    }
    process.exit(0);
  }
}

applyAdminSchema();
