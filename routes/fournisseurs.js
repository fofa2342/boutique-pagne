// routes/fournisseurRoutes.js
import express from "express";
import {
  inscriptionFournisseur,
  listeFournisseurs,
  detailsFournisseur,
  modifierFournisseur,
  supprimerFournisseur
} from "../controllers/fournisseurController.js";

const router = express.Router();

// Routes pour les fournisseurs
router.get("/", listeFournisseurs);
router.get("/inscription", (req, res) => {
  res.render("inscriptionFournisseur");
});
router.post("/inscription", inscriptionFournisseur);
router.get("/:id", detailsFournisseur);

// ⭐ CORRECTION : Utiliser le même format
router.post("/modifier/:id", modifierFournisseur);      // POST /fournisseurs/modifier/123
router.post("/supprimer/:id", supprimerFournisseur);    // POST /fournisseurs/supprimer/123

export default router;