require('dotenv').config();
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const ssl = (process.env.PGSSL || process.env.DB_SSL) === 'true' ? { rejectUnauthorized: false } : false;

function configFromEnv() {
  if (connectionString) return { connectionString, ssl };
  const host = process.env.PGHOST || process.env.DB_HOST || 'localhost';
  const port = Number(process.env.PGPORT || process.env.DB_PORT || 5432);
  const database = process.env.PGDATABASE || process.env.DB_NAME || 'govconnect';
  const user = process.env.PGUSER || process.env.DB_USER || undefined;
  const password = process.env.PGPASSWORD || process.env.DB_PASSWORD || undefined;
  return { host, port, database, user, password, ssl };
}

const pool = new Pool(configFromEnv());

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
