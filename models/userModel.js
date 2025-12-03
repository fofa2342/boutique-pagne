// models/userModel.js
import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

export async function createUser(username, password) {
  const hashedPassword = await bcrypt.hash(password, 10);
  const [result] = await pool.execute(
    'INSERT INTO users (username, password, role, status) VALUES (?, ?, ?, ?)',
    [username, hashedPassword, 'user', 'pending']
  );
  return result.insertId;
}

export async function findUserByUsername(username) {
  const [rows] = await pool.execute('SELECT id, username, password, role, status FROM users WHERE username = ?', [
    username,
  ]);
  return rows[0];
}

export async function findUserById(id) {
  const [rows] = await pool.execute('SELECT id, username, role, status FROM users WHERE id = ?', [id]);
  return rows[0];
}

export async function getAllUsers() {
  const [rows] = await pool.execute('SELECT id, username, role, status FROM users');
  return rows;
}

export async function updateUserStatus(id, status) {
  const [result] = await pool.execute(
    'UPDATE users SET status = ? WHERE id = ?',
    [status, id]
  );
  return result.affectedRows;
}

export async function updateUserRole(id, role) {
  const [result] = await pool.execute(
    'UPDATE users SET role = ? WHERE id = ?',
    [role, id]
  );
  return result.affectedRows;
}

export async function deleteUser(id) {
  const [result] = await pool.execute('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows;
}
