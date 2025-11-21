const mysql = require('./config/database.js');

async function updateCampaignRecordsTable() {
  try {
    // Add call_sid column if it doesn't exist
    try {
      await mysql.execute("ALTER TABLE campaign_records ADD COLUMN call_sid VARCHAR(100)");
      console.log("Added call_sid column");
    } catch (error) {
      if (error.message.includes("Duplicate column name")) {
        console.log("call_sid column already exists");
      } else {
        throw error;
      }
    }

    // Add recording_url column if it doesn't exist
    try {
      await mysql.execute("ALTER TABLE campaign_records ADD COLUMN recording_url TEXT");
      console.log("Added recording_url column");
    } catch (error) {
      if (error.message.includes("Duplicate column name")) {
        console.log("recording_url column already exists");
      } else {
        throw error;
      }
    }

    // Add retries column if it doesn't exist
    try {
      await mysql.execute("ALTER TABLE campaign_records ADD COLUMN retries INT DEFAULT 0");
      console.log("Added retries column");
    } catch (error) {
      if (error.message.includes("Duplicate column name")) {
        console.log("retries column already exists");
      } else {
        throw error;
      }
    }

    // Add updated_at column if it doesn't exist
    try {
      await mysql.execute("ALTER TABLE campaign_records ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
      console.log("Added updated_at column");
    } catch (error) {
      if (error.message.includes("Duplicate column name")) {
        console.log("updated_at column already exists");
      } else {
        throw error;
      }
    }

    // Add foreign key constraint if it doesn't exist
    try {
      await mysql.execute("ALTER TABLE campaign_records ADD CONSTRAINT fk_campaign_records_campaign_id FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE");
      console.log("Added foreign key constraint");
    } catch (error) {
      if (error.message.includes("Duplicate foreign key constraint name") || error.message.includes("Cannot add or update a child row")) {
        console.log("Foreign key constraint already exists or data prevents adding it");
      } else {
        throw error;
      }
    }

    console.log("Campaign records table updated successfully");
  } catch (error) {
    console.error("Error updating campaign records table:", error);
  }
}

updateCampaignRecordsTable();