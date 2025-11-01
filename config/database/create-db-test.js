/* eslint-disable no-console */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Client } = require('pg');

async function createTestDatabase() {
  const client = new Client({
    host: process.env.PGHOST_TEST,
    port: process.env.PGPORT_TEST,
    user: process.env.PGUSER_TEST,
    password: process.env.PGPASSWORD_TEST,
    database: 'postgres', // Terhubung ke database default 'postgres'
  });

  const dbName = process.env.PGDATABASE_TEST;

  if (!dbName) {
    console.error('Error: PGDATABASE_TEST environment variable is not set.');
    return;
  }

  try {
    await client.connect();
    // Menggunakan parameterized query untuk keamanan
    const res = await client.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName]);

    if (res.rowCount === 0) {
      console.log(`Creating test database: ${dbName}`);
      // Memastikan nama database ditangani dengan aman
      await client.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database '${dbName}' created successfully.`);
    } else {
      console.log(`Database '${dbName}' already exists.`);
    }
  } catch (err) {
    console.error('Error creating test database:', err.message);
  } finally {
    await client.end();
  }
}

createTestDatabase();