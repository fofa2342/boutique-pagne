// routes/clients.js
import express from "express";
import { 
  inscriptionClient, 
  listeClients,
  showEditClientForm,
  updateClientController,
  deleteClientController
} from "../controllers/clientController.js";
import { validateClient, validateId } from '../middleware/validators.js';

const router = express.Router();

// Formulaire inscription
router.get("/inscription", (req, res) => {
  res.render("inscription");
});

// Traitement inscription
router.post("/inscription", validateClient, inscriptionClient);

// Liste des clients
router.get("/", listeClients);

// Afficher le formulaire de modification
router.get("/modifier/:id", validateId, showEditClientForm);

// Traiter la mise à jour d'un client
router.post("/modifier/:id", validateId, validateClient, updateClientController);

// Supprimer un client
router.delete("/supprimer/:id", validateId, deleteClientController);

export default router;
