// routes/produits.js - Version complète
import express from "express";
import {
  listeProduits,
  showAjoutProduit,
  ajouterProduit,
  entreeStock,
  traiterEntreeStock,
  entreeStockMultiple,
  traiterEntreeStockMultiple,
  sortieStock,
  traiterSortieStock,
  alertesStock,
  ficheProduit,
  historiqueMouvements,
  historiqueProduit,
  modifierProduit,
  supprimerProduit,
  // Nouveaux imports
  listeEntrees,
  listeSorties,
  showModifierMouvement,
  modifierMouvement,
  supprimerMouvement
} from "../controllers/produitController.js";

const router = express.Router();

/* --- NOUVEAU : Routes pour les mouvements de stock --- */
router.get("/mouvements/entrees", listeEntrees);
router.get("/mouvements/sorties", listeSorties);
router.get("/mouvements/modifier/:id", showModifierMouvement);
router.post("/mouvements/modifier/:id", modifierMouvement);
router.post("/mouvements/supprimer/:id", supprimerMouvement);


// Routes pour les produits
router.get("/", listeProduits);
router.get("/ajout", showAjoutProduit);
router.post("/ajout", ajouterProduit);
router.get("/entree", entreeStock);
router.post("/entree", traiterEntreeStock);
router.get("/entree-multiple", entreeStockMultiple);
router.post("/entree-multiple", traiterEntreeStockMultiple);
router.get("/sortie", sortieStock);
router.post("/sortie", traiterSortieStock);
router.get("/alertes", alertesStock);
router.get("/historique", historiqueMouvements);
router.get("/:id", ficheProduit);
router.get("/:id/historique", historiqueProduit);
router.put("/:id", modifierProduit);
router.delete("/:id", supprimerProduit);
router.post("/modifier/:id", modifierProduit);
router.post("/supprimer/:id", supprimerProduit);
export default router;