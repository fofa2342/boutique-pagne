// setup-db.js
import pool from './config/db.js';

const createUsersTable = async () => {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.execute(createTableQuery);
    console.log('Table "users" created successfully or already exists.');
    process.exit(0);
  } catch (error) {
    console.error('Error creating "users" table:', error);
    process.exit(1);
  }
};

createUsersTable();
