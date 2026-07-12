const fs = require('fs');
const path = require('path');
const { pool } = require('./index');

async function setupDatabase() {
  try {
    console.log('Connecting to PostgreSQL database...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    
    console.log('Executing schema.sql...');
    await pool.query(schemaSql);
    console.log('Database successfully initialized and seeded!');
  } catch (err) {
    console.error('Error setting up the database:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupDatabase();
