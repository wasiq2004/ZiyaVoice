import mysqlPool from '../config/database.js';
import { encrypt } from '../dist/utils/encryption.js';

/**
 * Migration script to encrypt existing plain-text Twilio credentials
 * This should be run ONCE after implementing encryption
 */
async function encryptExistingCredentials() {
  console.log('Starting migration to encrypt existing Twilio credentials...');
  
  try {
    // Encrypt user_twilio_numbers table
    console.log('\n1. Encrypting user_twilio_numbers...');
    const [twilioNumbers] = await mysqlPool.execute(
      'SELECT id, twilio_auth_token FROM user_twilio_numbers WHERE twilio_auth_token IS NOT NULL'
    );
    
    for (const row of twilioNumbers) {
      // Check if already encrypted (contains colons in encryption format)
      if (row.twilio_auth_token && !row.twilio_auth_token.includes(':')) {
        const encrypted = encrypt(row.twilio_auth_token);
        await mysqlPool.execute(
          'UPDATE user_twilio_numbers SET twilio_auth_token = ? WHERE id = ?',
          [encrypted, row.id]
        );
        console.log(`   ✓ Encrypted auth token for record ${row.id}`);
      } else {
        console.log(`   - Skipping record ${row.id} (already encrypted or null)`);
      }
    }
    
    // Encrypt user_twilio_configs table
    console.log('\n2. Encrypting user_twilio_configs...');
    const [twilioConfigs] = await mysqlPool.execute(
      'SELECT id, auth_token, api_key_secret FROM user_twilio_configs WHERE auth_token IS NOT NULL'
    );
    
    for (const row of twilioConfigs) {
      let updateFields = [];
      let updateValues = [];
      
      // Encrypt auth_token
      if (row.auth_token && !row.auth_token.includes(':')) {
        const encrypted = encrypt(row.auth_token);
        updateFields.push('auth_token = ?');
        updateValues.push(encrypted);
        console.log(`   ✓ Encrypted auth_token for config ${row.id}`);
      }
      
      // Encrypt api_key_secret if exists
      if (row.api_key_secret && !row.api_key_secret.includes(':')) {
        const encrypted = encrypt(row.api_key_secret);
        updateFields.push('api_key_secret = ?');
        updateValues.push(encrypted);
        console.log(`   ✓ Encrypted api_key_secret for config ${row.id}`);
      }
      
      // Update if there are fields to encrypt
      if (updateFields.length > 0) {
        updateValues.push(row.id);
        await mysqlPool.execute(
          `UPDATE user_twilio_configs SET ${updateFields.join(', ')} WHERE id = ?`,
          updateValues
        );
      } else {
        console.log(`   - Skipping config ${row.id} (already encrypted or null)`);
      }
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('All existing credentials have been encrypted.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await mysqlPool.end();
  }
}

// Run migration
encryptExistingCredentials()
  .then(() => {
    console.log('\nYou can now safely delete this migration file.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration error:', error);
    process.exit(1);
  });
