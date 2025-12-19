import express from "express";
import {
  pageVente,
  traiterVente,
  detailsVente,
  ajouterPaiement,
  listeVentes,
  deleteVenteController
} from "../controllers/ventesController.js";
import { validateSale, validatePayment, validateId } from '../middleware/validators.js';

const router = express.Router();

// CORRIGÉ : La racine affiche la liste des ventes
router.get("/", listeVentes);

// CORRIGÉ : /nouveau affiche le formulaire de création
router.get("/nouveau", pageVente);

router.post('/traiter', validateSale, traiterVente);
router.get("/:id", validateId, detailsVente);
router.post("/:id/paiement", validateId, validatePayment, ajouterPaiement);

// NOUVEAU : Supprimer une vente
router.post("/:id/delete", validateId, deleteVenteController);

export default router;
