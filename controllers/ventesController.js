import logger from '../config/logger.js';
import {
  createVente,
  addVenteDetail,
  addPaiement,
  getVenteById,
  getVenteDetails,
  getPaiements,
  getAllVentes,
  deleteVente
} from "../models/venteModel.js";

import { getAllProduits, getProduitById, updateStock } from "../models/produitModel.js";
import { getAllClients } from "../models/clientModel.js";
import { processSaleWithTransaction, withTransaction } from '../utils/transactions.js';

const DEBUG = process.env.NODE_ENV !== 'production';

/* ------------------------------------------------------------
   PAGE : LISTE DES VENTES
------------------------------------------------------------ */
export async function listeVentes(req, res) {
  try {
    const { client } = req.query;
    const ventes = await getAllVentes({ client });

    if (DEBUG) {
      logger.info('DEBUG listeVentes', { count: ventes.length, firstVente: ventes[0] });
    }

    //  CORRECTION : Convertir les strings en nombres
    const ventesFormatted = ventes.map(v => ({
      id_vente: v.id_vente,
      date_vente: v.date_vente,
      client_nom: v.client_nom || 'Non spécifié',
      total_ht: parseFloat(v.total_ht) || 0,
      tax: parseFloat(v.tax) || 0,
      total_ttc: parseFloat(v.total_ttc) || 0,
      montant_paye: parseFloat(v.montant_paye) || 0,
      reste: parseFloat(v.reste) || 0
    }));

    const totalRestes = ventesFormatted.reduce((sum, v) => {
      return sum + v.reste;
    }, 0);

    res.render("listeventes", {
      ventes: ventesFormatted, //  Utiliser les données formatées
      totalRestes,
      filterName: client || ''
    });
  } catch (err) {
    logger.error("Erreur listeVentes:", err);
    res.status(500).send("Erreur chargement liste des ventes");
  }
}

/* ------------------------------------------------------------
   PAGE : FORMULAIRE DE VENTE
------------------------------------------------------------ */
export async function pageVente(req, res) {
  try {
    const produits = await getAllProduits();
    const clients = await getAllClients();

    res.render("vente", {
      produits: produits || [],
      clients: clients || []
    });
  } catch (err) {
    logger.error("Erreur pageVente:", err);
    res.status(500).send("Erreur chargement page de vente");
  }
}

/* ------------------------------------------------------------
   TRAITER UNE VENTE
------------------------------------------------------------ */
export async function traiterVente(req, res) {
  let clientId = null;
  
  try {
    let { client_id, date_vente, produits, montant_paye, montant_donne, mode_paiement } = req.body;

    if (DEBUG) {
      logger.info('Received sale data', { body: req.body });
    }

    // Validation des données requises
    if (!produits) {
      req.flash('error_msg', 'Aucun produit sélectionné');
      return res.redirect('/ventes/nouveau');
    }

    // Gérer le format des produits (peut être un tableau ou une string)
    let produitsArray = produits;
    if (typeof produits === 'string') {
      try {
        produitsArray = JSON.parse(produits);
      } catch (e) {
        produitsArray = [produits];
      }
    }

    if (!Array.isArray(produitsArray) || produitsArray.length === 0) {
      req.flash('error_msg', 'Format des produits invalide');
      return res.redirect('/ventes/nouveau');
    }

    // Convertir client_id en number ou null
    clientId = client_id ? parseInt(client_id) : null;

    // Définitions par défaut
    date_vente = date_vente || new Date().toISOString().slice(0, 16);

    // --- GESTION DES PAIEMENTS (NOUVEAU) ---
    // Vérifier s'il y a une liste de paiements (cas paiements multiples)
    let listePaiements = [];
    if (req.body.paiements) {
      try {
        listePaiements = typeof req.body.paiements === 'string' 
          ? JSON.parse(req.body.paiements) 
          : req.body.paiements;
      } catch (e) {
        logger.error("Erreur parsing paiements:", e);
        listePaiements = [];
      }
    }

    // Build and validate products array BEFORE starting any DB writes
    const products = [];
    let total_ht = 0;
    let total_marge = 0;

    // FIRST: Validate ALL products before starting any database operations
    for (const p of produitsArray) {
      const produitId = p.produit_id || p.id;
      if (!produitId) continue;

      const produit = await getProduitById(produitId);
      if (!produit) {
        if (DEBUG) logger.warn(`Produit non trouvé: ${produitId}`);
        req.flash('error_msg', `Produit #${produitId} non trouvé`);
        return res.redirect('/ventes/nouveau');
      }

      const qty = parseInt(p.quantite) || 1;
      const prixVente = parseFloat(p.prix_vente) || parseFloat(produit.prix_vente) || 0;
      const prixAchat = parseFloat(produit.prix_achat) || 0;

      // Validation du stock
      if (qty > produit.quantite_stock) {
        req.flash('error_msg', `Stock insuffisant pour ${produit.nom}. Stock disponible: ${produit.quantite_stock}`);
        return res.redirect('/ventes/nouveau');
      }

      const subtotal = qty * prixVente;
      const marge = (prixVente - prixAchat) * qty;

      total_ht += subtotal;
      total_marge += marge;

      products.push({
        produitId,
        quantite: qty,
        prixVente,
        prixAchat,
        subtotal,
        marge
      });
    }

    if (total_ht === 0) {
      req.flash('error_msg', 'Aucun produit valide dans la vente');
      return res.redirect('/ventes/nouveau');
    }

    // SUPPRIMER LE CALCUL DE TAXE - TOTAL TTC = TOTAL HT
    const total_ttc = total_ht; // Pas de taxe

    // Normalize payments array
    const paiements = [];
    
    if (listePaiements.length > 0) {
      // Cas : Liste de paiements explicite
      for (const p of listePaiements) {
        const montantP = parseFloat(p.amount || p.montant || 0);
        if (montantP > 0) {
          paiements.push({
            montant: montantP,
            mode: p.mode || 'cash'
          });
        }
      }
    } else {
      // Cas : Paiement simple via le formulaire standard
      const montantPaye = parseFloat(montant_paye) || 0;
      if (montantPaye > 0) {
        paiements.push({
          montant: montantPaye,
          mode: mode_paiement || 'cash'
        });
      }
    }

    const montantDonne = parseFloat(montant_donne) || 0;
    const montantTotalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
    const monnaieRendue = Math.max(0, montantDonne - montantTotalPaye);
    const reste = Math.max(0, total_ttc - montantTotalPaye);

    if (DEBUG) {
      logger.info("Processing sale with transaction", {
        client_id: clientId,
        total_ht,
        total_ttc,
        montant_paye: montantTotalPaye,
        reste,
        paymentsCount: paiements.length
      });
    }

    // USE TRANSACTION FOR ATOMIC OPERATIONS
    const vente_id = await processSaleWithTransaction({
      clientId,
      dateVente: new Date(date_vente),
      products,
      totalHT: total_ht,
      totalTTC: total_ttc,
      paiements
    });

    logger.info('Sale created successfully with transaction', { saleId: vente_id });

    res.render("successVente", {
      message: `Vente enregistrée avec succès ! Code : ${vente_id}`,
      vente_id,
      montant_total: total_ttc,
      montant_donne: montantDonne,
      montant_paye: montantTotalPaye,
      monnaie_rendue: monnaieRendue,
      reste_a_payer: reste
    });

  } catch (err) {
    logger.error("Erreur traiterVente:", err);
    req.flash('error_msg', `Erreur lors de la création de la vente: ${err.message}`);
    return res.redirect('/ventes/nouveau');
  }
}

/* ------------------------------------------------------------
   PAGE : DÉTAILS D'UNE VENTE
------------------------------------------------------------ */
export async function detailsVente(req, res) {
  try {
    const id = req.params.id;

    const vente = await getVenteById(id);
    if (!vente) {
      return res.status(404).render("error", {
        message: "Vente non trouvée"
      });
    }

    const details = await getVenteDetails(id);
    const paiements = await getPaiements(id);

    // Formater les données pour la vue
    const venteFormatted = {
      id_vente: vente.id_vente || vente.id,
      client_nom: vente.client_nom || vente.nom || 'Non spécifié',
      date_vente: vente.date_vente,
      total_ht: parseFloat(vente.total_ht) || 0,
      tax: parseFloat(vente.tax) || 0,
      total_ttc: parseFloat(vente.total_ttc) || 0,
      montant_paye: parseFloat(vente.montant_paye) || 0,
      reste: parseFloat(vente.reste) || 0
    };

    const detailsFormatted = (details || []).map(d => ({
      nom: d.nom || d.produit_nom || 'Produit inconnu',
      prix_vente: parseFloat(d.prix_vente) || 0,
      quantite: parseInt(d.quantite) || 0,
      subtotal: parseFloat(d.subtotal) || 0
    }));

    const paiementsFormatted = (paiements || []).map(p => ({
      date_paiement: p.date_paiement,
      mode: p.mode || 'Non spécifié',
      montant: parseFloat(p.montant) || 0
    }));

    res.render("detailsVente", {
      vente: venteFormatted,
      details: detailsFormatted,
      paiements: paiementsFormatted
    });

  } catch (err) {
    logger.error("Erreur detailsVente:", err);
    res.status(500).render("error", {
      message: "Erreur récupération détails vente",
      error: err.message
    });
  }
}

/* ------------------------------------------------------------
   AJOUTER UN PAIEMENT PARTIEL
------------------------------------------------------------ */
export async function ajouterPaiement(req, res) {
  try {
    const { id } = req.params; // Changé de vente_id à id pour correspondre à la route
    const { montant, mode } = req.body;

    if (!montant || isNaN(montant) || parseFloat(montant) <= 0) {
      req.flash('error_msg', 'Montant invalide');
      return res.redirect(`/ventes/${id}`);
    }

    const montantFloat = parseFloat(montant);

    // Use transaction with row locking to prevent race conditions
    await withTransaction(async (connection) => {
      // Lock the vente row for update
      const [ventes] = await connection.execute(
        'SELECT id_vente, total_ttc, montant_paye, reste FROM vente WHERE id_vente = ? FOR UPDATE',
        [id]
      );

      if (!ventes || ventes.length === 0) {
        throw new Error('Vente non trouvée');
      }

      const vente = ventes[0];
      const resteActuel = parseFloat(vente.reste);

      // Verify payment doesn't exceed remaining amount
      if (montantFloat > resteActuel + 0.01) { // Small tolerance for floating point
        throw new Error(`Le montant (${montantFloat.toFixed(2)}) dépasse le reste à payer (${resteActuel.toFixed(2)})`);
      }

      // Insert payment
      await connection.execute(
        'INSERT INTO paiement (vente_id, montant, mode) VALUES (?, ?, ?)',
        [id, montantFloat, mode || 'cash']
      );

      // Recalculate totals from database
      const [payments] = await connection.execute(
        'SELECT SUM(montant) as total_paye FROM paiement WHERE vente_id = ?',
        [id]
      );
      
      const totalPaye = parseFloat(payments[0].total_paye) || 0;
      const totalTTC = parseFloat(vente.total_ttc);
      const nouveauMontantPaye = Math.min(totalTTC, totalPaye);
      const nouveauReste = Math.max(0, totalTTC - nouveauMontantPaye);

      // Update vente with new totals
      await connection.execute(
        'UPDATE vente SET montant_paye = ?, reste = ? WHERE id_vente = ?',
        [nouveauMontantPaye, nouveauReste, id]
      );
    });

    logger.info('Payment added successfully', { venteId: id, montant: montantFloat });
    req.flash('success_msg', 'Paiement ajouté avec succès');
    res.redirect(`/ventes/${id}`);

  } catch (err) {
    logger.error("Erreur ajouterPaiement:", err);
    req.flash('error_msg', err.message || 'Erreur ajout paiement');
    res.redirect('/ventes');
  }
}

/* ------------------------------------------------------------
   SUPPRIMER UNE VENTE
------------------------------------------------------------ */
export async function deleteVenteController(req, res) {
  try {
    const { id } = req.params;
    
    // Use transaction to restore stock atomically before deleting
    await withTransaction(async (connection) => {
      // Get sale details to restore stock
      const [details] = await connection.execute(
        'SELECT produit_id, quantite FROM vente_details WHERE vente_id = ?',
        [id]
      );

      // Restore stock for each product
      for (const detail of details) {
        await connection.execute(
          'UPDATE produit SET quantite_stock = quantite_stock + ? WHERE id_produit = ?',
          [detail.quantite, detail.produit_id]
        );
      }

      // Delete payments
      await connection.execute('DELETE FROM paiement WHERE vente_id = ?', [id]);
      
      // Delete sale details
      await connection.execute('DELETE FROM vente_details WHERE vente_id = ?', [id]);
      
      // Delete sale
      const [result] = await connection.execute('DELETE FROM vente WHERE id_vente = ?', [id]);
      
      if (result.affectedRows === 0) {
        throw new Error('Vente non trouvée');
      }
    });
    
    logger.info('Sale deleted and stock restored', { venteId: id });
    req.flash('success_msg', 'Vente supprimée avec succès et stock restauré');
    res.redirect("/ventes");
  } catch (err) {
    logger.error("Erreur suppression vente:", err);
    req.flash('error_msg', err.message || 'Erreur suppression vente');
    res.redirect("/ventes");
  }
}