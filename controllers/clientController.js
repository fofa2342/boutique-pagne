// controllers/clientController.js
import { 
  createClient, 
  getAllClients,
  getClientById,
  updateClient,
  deleteClient 
} from "../models/clientModel.js";

// Inscription
export async function inscriptionClient(req, res) {
  try {
    const { nom, telephone, email, adresse } = req.body;
    if (!nom || !telephone) {
      return res.status(400).send("Nom et téléphone obligatoires !");
    }

    const clientId = await createClient({ nom, telephone, email, adresse });
    res.render("success", { message: `Client inscrit avec succès ! ID: ${clientId}` });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de l'inscription du client");
  }
}

// Liste des clients
export async function listeClients(req, res) {
  try {
    const clients = await getAllClients();
    res.render("clients", { clients });
  } catch (error) {
    console.error(error);
    res.status(500).send("Erreur lors de la récupération des clients");
  }
}

// Afficher le formulaire de modification
export async function showEditClientForm(req, res) {
  try {
    const { id } = req.params;
    const client = await getClientById(id);
    if (!client) {
      return res.status(404).send("Client non trouvé");
    }
    res.render("editClient", { client });
  } catch (error) {
    console.error("Erreur affichage formulaire modification:", error);
    res.status(500).send("Erreur lors de la récupération du client");
  }
}

// Mettre à jour un client
export async function updateClientController(req, res) {
  try {
    const { id } = req.params;
    const { nom, telephone, email, adresse } = req.body;

    if (!nom || !telephone) {
      return res.status(400).send("Nom et téléphone sont obligatoires.");
    }

    await updateClient(id, { nom, telephone, email, adresse });
    res.redirect("/clients");
  } catch (error) {
    console.error("Erreur modification client:", error);
    res.status(500).send("Erreur lors de la mise à jour du client");
  }
}

// Supprimer un client
export async function deleteClientController(req, res) {
  try {
    const { id } = req.params;
    await deleteClient(id);
    res.redirect("/clients");
  } catch (error) {
    console.error("Erreur suppression client:", error);
    res.status(500).send("Erreur lors de la suppression du client");
  }
}
