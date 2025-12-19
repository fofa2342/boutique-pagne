// utils/transactions.js
import pool from '../config/db.js';
import logger from '../config/logger.js';

/**
 * Execute a function within a database transaction
 * @param {Function} callback - Async function that receives the connection
 * @returns {Promise<any>} - Result from the callback
 */
export async function withTransaction(callback) {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    logger.debug('Transaction started');
    
    const result = await callback(connection);
    
    await connection.commit();
    logger.debug('Transaction committed');
    
    return result;
  } catch (error) {
    await connection.rollback();
    logger.error('Transaction rolled back', { error: error.message });
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute stock update with proper transaction handling
 * @param {number} produitId - Product ID
 * @param {number} quantityChange - Positive for entry, negative for exit
 * @param {object} movementData - Movement metadata
 * @returns {Promise<void>}
 */
export async function updateStockWithTransaction(produitId, quantityChange, movementData) {
  return withTransaction(async (connection) => {
    // 1. Get current stock with row lock (FOR UPDATE prevents race conditions)
    const [products] = await connection.execute(
      'SELECT quantite_stock FROM produit WHERE id_produit = ? FOR UPDATE',
      [produitId]
    );

    if (!products || products.length === 0) {
      throw new Error(`Product ${produitId} not found`);
    }

    const currentStock = products[0].quantite_stock;
    const newStock = currentStock + quantityChange;

    // 2. Validate stock availability for exits
    if (newStock < 0) {
      throw new Error(`Insufficient stock. Current: ${currentStock}, Requested: ${Math.abs(quantityChange)}`);
    }

    // 3. Update stock
    await connection.execute(
      'UPDATE produit SET quantite_stock = ? WHERE id_produit = ?',
      [newStock, produitId]
    );

    // 4. Record movement
    if (movementData) {
      const { type, quantite, fournisseur_nom, raison, notes, prix_achat } = movementData;
      await connection.execute(
        `INSERT INTO mouvement_stock 
         (produit_id, type, quantite, fournisseur_nom, raison, notes, prix_achat) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [produitId, type, quantite, fournisseur_nom || 'N/A', raison || '', notes || '', prix_achat || null]
      );
    }

    logger.info(`Stock updated for product ${produitId}: ${currentStock} -> ${newStock}`);
    
    return { oldStock: currentStock, newStock };
  });
}

/**
 * Execute sale with transaction (products + payments + stock updates)
 * @param {object} saleData - Sale data including products and payments
 * @returns {Promise<number>} - Sale ID
 */
export async function processSaleWithTransaction(saleData) {
  return withTransaction(async (connection) => {
    const { clientId, dateVente, products, totalHT, totalTTC, paiements } = saleData;

    // 1. Create sale record
    const [saleResult] = await connection.execute(
      `INSERT INTO vente (client_id, date_vente, total_ht, tax, total_ttc, montant_paye, reste)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [clientId, dateVente, totalHT, 0, totalTTC, 0, totalTTC]
    );

    const venteId = saleResult.insertId;

    // 2. Add sale details and update stock
    for (const product of products) {
      const { produitId, quantite, prixVente, prixAchat, subtotal, marge } = product;

      // Check and update stock with row lock
      const [productRows] = await connection.execute(
        'SELECT quantite_stock FROM produit WHERE id_produit = ? FOR UPDATE',
        [produitId]
      );

      if (!productRows || productRows.length === 0) {
        throw new Error(`Product ${produitId} not found`);
      }

      const currentStock = productRows[0].quantite_stock;
      if (currentStock < quantite) {
        throw new Error(`Insufficient stock for product ${produitId}. Available: ${currentStock}, Requested: ${quantite}`);
      }

      // Update stock
      await connection.execute(
        'UPDATE produit SET quantite_stock = quantite_stock - ? WHERE id_produit = ?',
        [quantite, produitId]
      );

      // Add sale detail
      await connection.execute(
        `INSERT INTO vente_details (vente_id, produit_id, quantite, prix_vente, prix_achat, subtotal, marge)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [venteId, produitId, quantite, prixVente, prixAchat, subtotal, marge]
      );
    }

    // 3. Add payments
    let totalPaid = 0;
    if (paiements && paiements.length > 0) {
      for (const paiement of paiements) {
        const montant = parseFloat(paiement.montant);
        if (montant > 0) {
          await connection.execute(
            `INSERT INTO paiement (vente_id, montant, mode) VALUES (?, ?, ?)`,
            [venteId, montant, paiement.mode || 'cash']
          );
          totalPaid += montant;
        }
      }
    }

    // 4. Update sale with payment info
    const reste = Math.max(0, totalTTC - totalPaid);
    await connection.execute(
      `UPDATE vente SET montant_paye = ?, reste = ? WHERE id_vente = ?`,
      [totalPaid, reste, venteId]
    );

    logger.info(`Sale ${venteId} processed successfully with ${products.length} products and ${paiements.length} payments`);

    return venteId;
  });
}
