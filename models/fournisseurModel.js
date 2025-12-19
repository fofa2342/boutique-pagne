// models/fournisseurModel.js
import pool from "../config/db.js";import logger from '../config/logger.js';
const DEBUG = process.env.NODE_ENV !== 'production';

// Créer un fournisseur
export async function createFournisseur(fournisseurData) {
  const { nom, telephone, email, pays } = fournisseurData;
  
  const [result] = await pool.execute(
    "INSERT INTO fournisseur (nom, telephone, email, pays) VALUES (?, ?, ?, ?)",
    [nom, telephone, email, pays]
  );
  
  return result.insertId;
}

// Récupérer tous les fournisseurs
export async function getAllFournisseurs() {
  const [rows] = await pool.execute(
    "SELECT id_fournisseur, nom, telephone, email, pays FROM fournisseur ORDER BY nom"
  );
  return rows;
}

// Récupérer un fournisseur par ID
export async function getFournisseurById(id) {
  const [rows] = await pool.execute(
    "SELECT id_fournisseur, nom, telephone, email, pays FROM fournisseur WHERE id_fournisseur = ?",
    [id]
  );
  return rows[0];
}

// models/fournisseurModel.js

// Modifier un fournisseur - VERSION AVEC LOGS
export async function updateFournisseur(id, fournisseurData) {
  const { nom, telephone, email, pays } = fournisseurData;
  
  try {
    if (DEBUG) {
      logger.info(" updateFournisseur - ID:", id);
      logger.info(" Données à mettre à jour:", fournisseurData);
    }
    
    const [result] = await pool.execute(
      `UPDATE fournisseur 
       SET nom = ?, telephone = ?, email = ?, pays = ? 
       WHERE id_fournisseur = ?`,
      [nom, telephone, email, pays, id]
    );
    
    if (DEBUG) {
      logger.info(" updateFournisseur - Résultat:", result);
      logger.info(" Rows affected:", result.affectedRows);
    }
    
  } catch (error) {
    logger.error(" ERREUR dans updateFournisseur:", error);
    throw error;
  }
}

// Supprimer un fournisseur
export async function deleteFournisseur(id) {
  await pool.execute(
    "DELETE FROM fournisseur WHERE id_fournisseur = ?",
    [id]
  );
}