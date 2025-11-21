const mysql = require('./config/database.js');

async function checkTable() {
  try {
    const [rows] = await mysql.execute('DESCRIBE campaign_records');
    console.log('campaign_records table structure:');
    console.log(rows);
  } catch (error) {
    console.error('Error checking table structure:', error);
  }
}

checkTable();