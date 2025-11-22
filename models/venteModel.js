import pool from "../config/db.js";

/* --------------------------- VENTE --------------------------- */

// Créer une vente
export async function createVente(data) {
  const { client_id, date_vente, total_ht, tax, total_ttc, montant_paye, reste } = data;

  const [result] = await pool.execute(
    `INSERT INTO vente (client_id, date_vente, total_ht, tax, total_ttc, montant_paye, reste)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [client_id, date_vente, total_ht, tax, total_ttc, montant_paye, reste]
  );

  return result.insertId;
}

/* ------------------------ DETAILS VENTE ----------------------- */

// Ajouter un produit à la vente
export async function addVenteDetail(detail) {
  const { vente_id, produit_id, quantite, prix_vente, prix_achat, subtotal, marge } = detail;

  await pool.execute(
    `INSERT INTO vente_details (vente_id, produit_id, quantite, prix_vente, prix_achat, subtotal, marge)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [vente_id, produit_id, quantite, prix_vente, prix_achat, subtotal, marge]
  );
}

/* --------------------------- PAIEMENT -------------------------- */

// Ajouter un paiement partiel
export async function addPaiement(paiement) {
  const { vente_id, montant, mode } = paiement;

  // 1. Insérer le nouveau paiement
  await pool.execute(
    `INSERT INTO paiement (vente_id, montant, mode) VALUES (?, ?, ?)`,
    [vente_id, montant, mode]
  );

  // 2. Récupérer les informations actuelles de la vente
  const [ventes] = await pool.execute(
    `SELECT total_ttc, montant_paye FROM vente WHERE id_vente = ?`,
    [vente_id]
  );
  const venteActuelle = ventes[0];

  if (venteActuelle) {
    // 3. Calculer le nouveau montant payé et le reste, en s'assurant que les types sont corrects
    const montantPayeActuel = parseFloat(venteActuelle.montant_paye) || 0;
    const montantAjoute = parseFloat(montant) || 0;
    const nouveauMontantPaye = montantPayeActuel + montantAjoute;
    const nouveauReste = parseFloat(venteActuelle.total_ttc) - nouveauMontantPaye;

    // 4. Mettre à jour la vente
    await pool.execute(
      `UPDATE vente SET montant_paye = ?, reste = ? WHERE id_vente = ?`,
      [nouveauMontantPaye, nouveauReste, vente_id]
    );
  }
}

/* --------------------------- GETTERS --------------------------- */

// Obtenir une vente
export async function getVenteById(id) {
  const [rows] = await pool.execute(
    `SELECT v.*, c.nom as client_nom
     FROM vente v
     LEFT JOIN client c ON v.client_id = c.id_client
     WHERE v.id_vente = ?`,
    [id]
  );
  return rows[0];
}

// Obtenir les produits vendus
export async function getVenteDetails(id) {
  const [rows] = await pool.execute(
    `SELECT vd.*, p.nom 
     FROM vente_details vd
     JOIN produit p ON p.id_produit = vd.produit_id
     WHERE vente_id = ?`,
    [id]
  );
  return rows;
}

// Obtenir les paiements
export async function getPaiements(id) {
  const [rows] = await pool.execute(
    "SELECT * FROM paiement WHERE vente_id = ? ORDER BY date_paiement ASC",
    [id]
  );
  return rows;
}

// --- NOUVEAU : Obtenir toutes les ventes ---
export async function getAllVentes(filters = {}) {
  try {
    let query = `
      SELECT 
        v.id_vente,
        v.date_vente,
        v.total_ht,
        v.tax,
        v.total_ttc,
        v.montant_paye,
        v.reste,
        c.nom as client_nom
      FROM vente v
      LEFT JOIN client c ON v.client_id = c.id_client
      WHERE 1=1
    `;

    const params = [];

    // Filtre par client
    if (filters.client) {
      query += ` AND c.nom LIKE ?`;
      params.push(`%${filters.client}%`);
    }

    query += ` ORDER BY v.id_vente DESC`;

    console.log("=== DEBUG getAllVentes ===");
    console.log("Query:", query);
    console.log("Params:", params);

    const [ventes] = await pool.execute(query, params);
    
    console.log("Résultats récupérés:", ventes);
    
    return ventes;
  } catch (err) {
    console.error("Erreur getAllVentes:", err);
    throw err;
  }
}

// --- NOUVEAU : Supprimer une vente ---
export async function deleteVente(id) {
  // On supprime les détails de la vente et les paiements avant de supprimer la vente elle-même
  await pool.execute("DELETE FROM vente_details WHERE vente_id = ?", [id]);
  await pool.execute("DELETE FROM paiement WHERE vente_id = ?", [id]);
  
  const [result] = await pool.execute("DELETE FROM vente WHERE id_vente = ?", [id]);
  return result.affectedRows > 0;
}