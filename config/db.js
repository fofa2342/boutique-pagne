import 'dotenv/config'
import mysql from "mysql2/promise";
import fs from 'fs';
import path from 'path';

const {
  DB_HOST,
  DB_USER,
  DB_PASS,
  DB_NAME,
  DB_PORT,
  DB_SSL_CA,
  NODE_ENV
} = process.env;

if (!DB_HOST || !DB_USER || !DB_PASS || !DB_NAME) {
  throw new Error("Missing required database environment variables (DB_HOST, DB_USER, DB_PASS, DB_NAME)");
}

// SSL Configuration
const sslConfig = {};
if (NODE_ENV === 'production') {
  // For Aiven and similar managed databases with self-signed certificates
  // Accept self-signed but still use SSL encryption
  sslConfig.ssl = {
    rejectUnauthorized: false  // Accept self-signed certificates
  };
  console.log('[INFO] Production mode: SSL enabled with relaxed certificate validation for managed databases');
} else {
  // Development: Allow self-signed certificates
  console.warn('[WARNING] Development mode: SSL certificate validation is relaxed');
  sslConfig.ssl = {
    rejectUnauthorized: false
  };
}

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASS,
  port: Number(DB_PORT),
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ...sslConfig
});

// Test connection on startup
pool.getConnection()
  .then(connection => {
    console.log('[SUCCESS] Database connected successfully');
    connection.release();
  })
  .catch(err => {
    console.error('[ERROR] Database connection failed:', err.message);
    process.exit(1);
  });

export default pool;