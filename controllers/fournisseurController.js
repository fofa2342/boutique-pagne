// controllers/fournisseurController.js
import { 
  createFournisseur, 
  getAllFournisseurs, 
  getFournisseurById, 
  updateFournisseur, 
  deleteFournisseur 
} from "../models/fournisseurModel.js";

// Inscription d'un fournisseur
export async function inscriptionFournisseur(req, res) {
  try {
    const { nom, telephone, email, pays } = req.body;
    
    // Validation des champs obligatoires
    if (!nom || !telephone || !pays) {
      return res.status(400).send("Nom, téléphone et pays obligatoires !");
    }

    // Création du fournisseur
    const fournisseurId = await createFournisseur({ nom, telephone, email, pays });
    
    // Redirection vers la page de succès
    res.render("successFournisseur", { 
      message: `Fournisseur inscrit avec succès ! ID: ${fournisseurId}` 
    });
  } catch (error) {
    console.error("Erreur inscription:", error);
    res.status(500).send("Erreur lors de l'inscription du fournisseur: " + error.message);
  }
}

// Liste des fournisseurs
export async function listeFournisseurs(req, res) {
  try {
    const fournisseurs = await getAllFournisseurs();
    res.render("fournisseurs", { fournisseurs });
  } catch (error) {
    console.error("Erreur liste:", error);
    res.status(500).send("Erreur lors de la récupération des fournisseurs: " + error.message);
  }
}

// Détails d'un fournisseur
export async function detailsFournisseur(req, res) {
  try {
    const { id } = req.params;
    const fournisseur = await getFournisseurById(id);
    
    if (!fournisseur) {
      return res.status(404).send("Fournisseur non trouvé");
    }
    
    res.render("detailsFournisseur", { fournisseur });
  } catch (error) {
    console.error("Erreur détails:", error);
    res.status(500).send("Erreur lors de la récupération du fournisseur: " + error.message);
  }
}

// Modification d'un fournisseur - VERSION AVEC DEBUG
export async function modifierFournisseur(req, res) {
  try {
    console.log("🔍 MODIFICATION - Headers:", req.headers['content-type']);
    console.log("📦 MODIFICATION - Body:", req.body);
    console.log("🆔 MODIFICATION - ID:", req.params.id);
    
    const { id } = req.params;
    const { nom, telephone, email, pays } = req.body;
    
    // Validation
    if (!nom || !telephone || !pays) {
      console.log("❌ Données manquantes");
      return res.status(400).send("Nom, téléphone et pays obligatoires !");
    }

    console.log("✅ Données valides, appel au modèle...");
    
    await updateFournisseur(id, { nom, telephone, email, pays });
    
    console.log("✅ Fournisseur modifié avec succès");
    
    // Redirection vers la liste après modification
    res.redirect("/fournisseurs");
  } catch (error) {
    console.error("❌ Erreur modification:", error);
    res.status(500).send("Erreur lors de la modification du fournisseur: " + error.message);
  }
}

// Suppression d'un fournisseur - VERSION CORRIGÉE
export async function supprimerFournisseur(req, res) {
  try {
    const { id } = req.params;
    await deleteFournisseur(id);
    
    // Redirection vers la liste après suppression
    res.redirect("/fournisseurs");
  } catch (error) {
    console.error("Erreur suppression:", error);
    res.status(500).send("Erreur lors de la suppression du fournisseur: " + error.message);
  }
}