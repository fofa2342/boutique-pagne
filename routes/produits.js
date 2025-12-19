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
  listeEntrees,
  listeSorties,
  showModifierMouvement,
  modifierMouvement,
  supprimerMouvement
} from "../controllers/produitController.js";
import { validateProduct, validateStockEntry, validateId } from '../middleware/validators.js';

const router = express.Router();

// Routes pour les mouvements de stock
router.get("/mouvements/entrees", listeEntrees);
router.get("/mouvements/sorties", listeSorties);
router.get("/mouvements/modifier/:id", showModifierMouvement);
router.post("/mouvements/modifier/:id", modifierMouvement);
router.post("/mouvements/supprimer/:id", supprimerMouvement);


// Routes pour les produits
router.get("/", listeProduits);
router.get("/ajout", showAjoutProduit);
router.post("/ajout", validateProduct, ajouterProduit);
router.get("/entree", entreeStock);
router.post("/entree", validateStockEntry, traiterEntreeStock);
router.get("/entree-multiple", entreeStockMultiple);
router.post("/entree-multiple", traiterEntreeStockMultiple);
router.get("/sortie", sortieStock);
router.post("/sortie", traiterSortieStock);
router.get("/alertes", alertesStock);
router.get("/historique", historiqueMouvements);
router.get("/:id", ficheProduit);
router.get("/:id/historique", historiqueProduit);
router.put("/:id", validateId, validateProduct, modifierProduit);
router.post("/modifier/:id", validateId, validateProduct, modifierProduit);
router.post("/supprimer/:id", validateId, supprimerProduit);
export default router;