// models/clientModel.js
import pool from "../config/db.js";

// --- Inscription d’un client ---
export async function createClient(clientData) {
  const { nom, telephone, email, adresse } = clientData;
  const [result] = await pool.execute(
    "INSERT INTO client (nom, telephone, email, adresse) VALUES (?, ?, ?, ?)",
    [nom, telephone, email, adresse]
  );
  return result.insertId;
}

// --- Récupération de tous les clients ---
export async function getAllClients() {
  const [rows] = await pool.execute("SELECT * FROM client ORDER BY id_client DESC");
  return rows;
}

// --- Récupérer un client par ID ---
export async function getClientById(id) {
  const [rows] = await pool.execute(
    "SELECT * FROM client WHERE id_client = ?",
    [id]
  );

  return rows[0];
}

// --- Mettre à jour un client ---
export async function updateClient(id, clientData) {
  const { nom, telephone, email, adresse } = clientData;
  const [result] = await pool.execute(
    "UPDATE client SET nom = ?, telephone = ?, email = ?, adresse = ? WHERE id_client = ?",
    [nom, telephone, email, adresse, id]
  );
  return result.affectedRows;
}

// --- Supprimer un client ---
export async function deleteClient(id) {
  const [result] = await pool.execute(
    "DELETE FROM client WHERE id_client = ?",
    [id]
  );
  return result.affectedRows;
}
