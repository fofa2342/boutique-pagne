// routes/fournisseurRoutes.js
import express from "express";
import {
  inscriptionFournisseur,
  listeFournisseurs,
  detailsFournisseur,
  modifierFournisseur,
  supprimerFournisseur
} from "../controllers/fournisseurController.js";
import { validateSupplier, validateId } from '../middleware/validators.js';
import { getAllPays } from "../models/paysModel.js";

const router = express.Router();

// Routes pour les fournisseurs
router.get("/", listeFournisseurs);
router.get("/inscription", async (req, res) => {
  const pays = await getAllPays();
  res.render("inscriptionFournisseur", { pays });
});
router.post("/inscription", validateSupplier, inscriptionFournisseur);
router.get("/:id", validateId, detailsFournisseur);

// ⭐ CORRECTION : Utiliser le même format
router.post("/modifier/:id", validateId, validateSupplier, modifierFournisseur);      // POST /fournisseurs/modifier/123
router.post("/supprimer/:id", validateId, supprimerFournisseur);    // POST /fournisseurs/supprimer/123

export default router;