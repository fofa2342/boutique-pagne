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

/* ------------------------------------------------------------
   PAGE : LISTE DES VENTES
------------------------------------------------------------ */
export async function listeVentes(req, res) {
  try {
    const { client } = req.query;
    const ventes = await getAllVentes({ client });
    
    console.log("=== DEBUG listeVentes ===");
    console.log("Nombre de ventes:", ventes.length);

    // ✅ CORRECTION : Convertir les strings en nombres
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

    console.log("Première vente formatée:", ventesFormatted[0]);

    const totalRestes = ventesFormatted.reduce((sum, v) => {
      return sum + v.reste;
    }, 0);

    res.render("listeventes", {
      ventes: ventesFormatted, // ✅ Utiliser les données formatées
      totalRestes,
      filterName: client || ''
    });
  } catch (err) {
    console.error("Erreur listeVentes:", err);
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
    console.error("Erreur pageVente:", err);
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
    
    console.log("Données reçues:", req.body); // Debug

    // Validation des données requises
    if (!produits) {
      return res.status(400).send("Aucun produit sélectionné !");
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
      return res.status(400).send("Format des produits invalide !");
    }

    // Convertir client_id en number ou null
    clientId = client_id ? parseInt(client_id) : null;

    // Définitions par défaut - SUPPRIMER LA TAXE
    const montantDonne = parseFloat(montant_donne) || 0;
    const montantPaye = parseFloat(montant_paye) || 0;
    date_vente = date_vente || new Date().toISOString().slice(0, 16);

    let total_ht = 0;
    let total_marge = 0;
    const detailsVente = [];

    // Calcul des totaux et validation des produits
    for (const p of produitsArray) {
      const produitId = p.produit_id || p.id;
      if (!produitId) continue;

      const produit = await getProduitById(produitId);
      if (!produit) {
        console.warn(`Produit non trouvé: ${produitId}`);
        continue;
      }

      const qty = parseInt(p.quantite) || 1;
      const prixVente = parseFloat(p.prix_vente) || parseFloat(produit.prix_vente) || 0;
      const prixAchat = parseFloat(produit.prix_achat) || 0;

      // Validation du stock
      if (qty > produit.quantite_stock) {
        return res.status(400).send(`Stock insuffisant pour ${produit.nom}. Stock disponible: ${produit.quantite_stock}`);
      }

      const subtotal = qty * prixVente;
      const marge = (prixVente - prixAchat) * qty;

      total_ht += subtotal;
      total_marge += marge;

      detailsVente.push({
        produit_id: produitId,
        quantite: qty,
        prix_vente: prixVente,
        prix_achat: prixAchat,
        subtotal,
        marge
      });
    }

    if (total_ht === 0) {
      return res.status(400).send("Aucun produit valide dans la vente !");
    }

    // SUPPRIMER LE CALCUL DE TAXE - TOTAL TTC = TOTAL HT
    const total_ttc = total_ht; // Pas de taxe
    const tax = 0; // Taxe toujours à 0
    
    // Calculs corrigés
    const monnaieRendue = Math.max(0, montantDonne - montantPaye);
    const reste = total_ttc - montantPaye;

    console.log("Création vente avec:", { // Debug
      client_id: clientId,
      total_ht,
      tax, // Toujours 0
      total_ttc, // Égal à total_ht
      montant_donne: montantDonne,
      montant_paye: montantPaye,
      monnaie_rendue: monnaieRendue,
      reste
    });

    // 1️⃣ Créer la vente
    const vente_id = await createVente({
      client_id: clientId,
      date_vente,
      total_ht,
      tax: 0, // Taxe forcée à 0
      total_ttc: total_ht, // Total TTC = Total HT
      montant_paye: montantPaye,
      reste
    });

    if (!vente_id) {
      throw new Error("Échec de la création de la vente");
    }

    // 2️⃣ Ajouter les produits à la vente
    for (const detail of detailsVente) {
      await addVenteDetail({
        vente_id,
        produit_id: detail.produit_id,
        quantite: detail.quantite,
        prix_vente: detail.prix_vente,
        prix_achat: detail.prix_achat,
        subtotal: detail.subtotal,
        marge: detail.marge
      });

      // Mettre à jour le stock
      const produit = await getProduitById(detail.produit_id);
      const newStock = produit.quantite_stock - detail.quantite;
      await updateStock(detail.produit_id, newStock);
    }

    // 3️⃣ Paiement initial
    if (montantPaye > 0) {
      await addPaiement({
        vente_id,
        montant: montantPaye,
        mode: mode_paiement || "cash",
        date_paiement: new Date()
      });
    }

    res.render("successVente", {
      message: `Vente enregistrée avec succès ! Code : ${vente_id}`,
      vente_id,
      montant_total: total_ttc,
      montant_donne: montantDonne,
      montant_paye: montantPaye,
      monnaie_rendue: monnaieRendue,
      reste_a_payer: reste
    });

  } catch (err) {
    console.error("Erreur traiterVente:", err);
    res.status(500).render("error", {
      message: "Erreur lors de l'enregistrement de la vente",
      error: err.message
    });
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
    console.error("Erreur detailsVente:", err);
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
      return res.status(400).send("Montant invalide");
    }

    const vente = await getVenteById(id);
    if (!vente) {
      return res.status(404).send("Vente non trouvée");
    }

    await addPaiement({
      vente_id: id,
      montant: parseFloat(montant),
      mode: mode || "cash",
      date_paiement: new Date()
    });

    res.redirect(`/ventes/${id}`);

  } catch (err) {
    console.error("Erreur ajouterPaiement:", err);
    res.status(500).send("Erreur ajout paiement");
  }
}

/* ------------------------------------------------------------
   SUPPRIMER UNE VENTE
------------------------------------------------------------ */
export async function deleteVenteController(req, res) {
  try {
    const { id } = req.params;
    const result = await deleteVente(id);
    
    if (!result) {
      return res.status(404).send("Vente non trouvée");
    }
    
    res.redirect("/ventes");
  } catch (err) {
    console.error("Erreur suppression vente:", err);
    res.status(500).send("Erreur suppression vente");
  }
}