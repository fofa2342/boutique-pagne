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
  // In production, use proper SSL certificate validation
  if (DB_SSL_CA && fs.existsSync(DB_SSL_CA)) {
    sslConfig.ssl = {
      ca: fs.readFileSync(DB_SSL_CA),
      rejectUnauthorized: true
    };
  } else {
    // For managed databases (like Aiven), use their SSL settings
    sslConfig.ssl = {
      rejectUnauthorized: true
    };
  }
} else {
  // Development: Allow self-signed certificates (but log warning)
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