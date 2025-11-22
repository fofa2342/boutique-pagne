import express from "express";
import {
  pageVente,
  traiterVente,
  detailsVente,
  ajouterPaiement,
  listeVentes,
  deleteVenteController
} from "../controllers/ventesController.js";

const router = express.Router();

// CORRIGÉ : La racine affiche la liste des ventes
router.get("/", listeVentes);

// CORRIGÉ : /nouveau affiche le formulaire de création
router.get("/nouveau", pageVente);

router.post('/traiter', traiterVente);
router.get("/:id", detailsVente);
router.post("/:id/paiement", ajouterPaiement);

// NOUVEAU : Supprimer une vente
router.post("/:id/delete", deleteVenteController);

export default router;
