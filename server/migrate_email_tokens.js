/**
 * Migration: Create email_approval_tokens table
 * Run once: node migrate_email_tokens.js
 */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { pool } = require('./config/db');

async function migrate() {
  console.log('--- Email Approval Tokens Migration ---');
  const connection = await pool.getConnection();

  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS email_approval_tokens (
        id INT AUTO_INCREMENT PRIMARY KEY,
        token VARCHAR(128) NOT NULL UNIQUE,
        request_id INT NOT NULL,
        approver_id INT NOT NULL,
        approval_stage VARCHAR(50) NOT NULL,
        action VARCHAR(20) DEFAULT NULL,
        is_used TINYINT(1) DEFAULT 0,
        used_at TIMESTAMP NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(45) DEFAULT NULL,
        user_agent TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_token (token),
        INDEX idx_request_stage (request_id, approval_stage)
      ) ENGINE=InnoDB
    `);
    console.log('✅ email_approval_tokens table created successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    connection.release();
  }
  process.exit(0);
}

migrate();
