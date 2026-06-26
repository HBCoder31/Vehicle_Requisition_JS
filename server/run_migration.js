require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('./config/db');

async function runMigration() {
  const sqlPath = path.join(__dirname, 'migration_phase2.sql');
  console.log(`Reading migration from: ${sqlPath}`);
  
  let sqlContent = fs.readFileSync(sqlPath, 'utf8');
  
  // Strip out single-line comments starting with '--'
  sqlContent = sqlContent
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n');
    
  // Split statements by semicolon
  const statements = sqlContent
    .split(';')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt.length > 0);

  console.log(`Found ${statements.length} SQL statements to execute.`);

  const connection = await pool.getConnection();
  try {
    // Disable foreign keys temporarily during schema modification
    await connection.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}:`);
      console.log(stmt.substring(0, 100) + (stmt.length > 100 ? '...' : ''));
      await connection.execute(stmt);
    }
    
    await connection.execute('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Phase 2 migrations completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    connection.release();
    process.exit(0);
  }
}

runMigration();
