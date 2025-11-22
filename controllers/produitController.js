// controllers/produitController.js
import { getAllFournisseurs } from "../models/fournisseurModel.js";
import { 
  createProduit, 
  getAllProduits, 
  getProduitById, 
  updateProduit, 
  deleteProduit,
  getProduitsAlerte,
  updateStock,
  createMouvementStock,
  getMouvementsByProduit,
  getMouvementsStock,
  getMouvementById,
  updateMouvement,
  deleteMouvement,
  getMouvementsFiltered
} from "../models/produitModel.js";


// Page principale produits
export async function listeProduits(req, res) {
  try {
    const produits = await getAllProduits();
    res.render("produits", { produits });
  } catch (error) {
    console.error("Erreur liste produits:", error);
    res.status(500).send("Erreur lors de la récupération des produits");
  }
}

// Page d'ajout produit
export async function showAjoutProduit(req, res) {
  res.render("ajoutProduit");
}

// Création produit
export async function ajouterProduit(req, res) {
  try {
    const { nom, description, prix_achat, prix_vente, quantite_stock, seuil_alerte } = req.body;
    
    if (!nom || !prix_achat || !prix_vente) {
      return res.status(400).send("Nom, prix d'achat et prix de vente obligatoires !");
    }

    const produitId = await createProduit({
      nom, 
      description, 
      prix_achat, 
      prix_vente, 
      quantite_stock: quantite_stock || 0,
      seuil_alerte: seuil_alerte || 5
    });
    
    res.render("successProduit", { 
      message: `Produit créé avec succès ! ID: ${produitId}` 
    });
  } catch (error) {
    console.error("Erreur ajout produit:", error);
    res.status(500).send("Erreur lors de la création du produit");
  }
}

// Entrée de stock - Version améliorée
export async function entreeStock(req, res) {
  try {
    const produits = await getAllProduits();
    const fournisseurs = await getAllFournisseurs(); // 🔹 ajout

    res.render("entreeStock", { 
      produits,
      fournisseurs, // 🔹 ajout
      message: req.query.message || null
    });
  } catch (error) {
    console.error("Erreur entrée stock:", error);
    res.status(500).send("Erreur lors de la récupération des produits");
  }
}


// Traitement entrée stock - Version améliorée
export async function traiterEntreeStock(req, res) {
  try {
    const { produit_id, quantite, fournisseur_nom, raison, notes, prix_achat } = req.body;
    
    if (!produit_id || !quantite || !fournisseur_nom) {
      return res.status(400).send("Produit, quantité et fournisseur obligatoires !");
    }

    const produit = await getProduitById(produit_id);
    if (!produit) {
      return res.status(404).send("Produit non trouvé");
    }

    const ancienStock = produit.quantite_stock;
    const nouvelleQuantite = ancienStock + parseInt(quantite);
    
    // Mettre à jour le stock
    await updateStock(produit_id, nouvelleQuantite);
    
    // Enregistrer le mouvement
    await createMouvementStock({
      produit_id,
      type: 'entree',
      quantite,
      fournisseur_nom,
      raison,
      notes,
      prix_achat: prix_achat || produit.prix_achat
    });

    res.render("successProduit", { 
      message: `✅ Entrée de stock réussie !<br><br>
                <strong>${quantite}</strong> unités ajoutées à <strong>${produit.nom}</strong><br>
                📊 Stock avant: <strong>${ancienStock}</strong> → Stock après: <strong>${nouvelleQuantite}</strong><br>
                🏭 Fournisseur: <strong>${fournisseur_nom}</strong><br>
                📝 Raison: <strong>${raison || 'Non spécifiée'}</strong>`
    });
  } catch (error) {
    console.error("Erreur traitement entrée:", error);
    res.status(500).send("Erreur lors de l'entrée de stock: " + error.message);
  }
}

// Entrée multiple de stock
export async function entreeStockMultiple(req, res) {
  try {
    const produits = await getAllProduits();
    res.render("entreeStockMultiple", { produits });
  } catch (error) {
    console.error("Erreur entrée multiple:", error);
    res.status(500).send("Erreur lors de la récupération des produits");
  }
}

// Traitement entrée multiple
export async function traiterEntreeStockMultiple(req, res) {
  try {
    const { fournisseur_nom, raison, notes, produits } = req.body;
    
    if (!fournisseur_nom) {
      return res.status(400).send("Nom du fournisseur obligatoire !");
    }

    let mouvementsReussis = 0;
    let message = "✅ Entrées de stock effectuées :<br><br><ul style='text-align: left;'>";
    
    // Si produits est un tableau
    if (Array.isArray(produits)) {
      for (const produitData of produits) {
        if (produitData.produit_id && produitData.quantite && parseInt(produitData.quantite) > 0) {
          const produit = await getProduitById(produitData.produit_id);
          if (produit) {
            const ancienStock = produit.quantite_stock;
            const nouvelleQuantite = ancienStock + parseInt(produitData.quantite);
            
            await updateStock(produitData.produit_id, nouvelleQuantite);
            await createMouvementStock({
              produit_id: produitData.produit_id,
              type: 'entree',
              quantite: produitData.quantite,
              fournisseur_nom,
              raison,
              notes
            });
            
            message += `<li>📦 <strong>${produitData.quantite}</strong> unités de <strong>${produit.nom}</strong> (Stock: ${ancienStock} → ${nouvelleQuantite})</li>`;
            mouvementsReussis++;
          }
        }
      }
    }
    
    message += `</ul><br>🏭 Fournisseur: <strong>${fournisseur_nom}</strong><br>`;
    message += `📊 Total: <strong>${mouvementsReussis}</strong> produit(s) mis à jour`;
    
    if (mouvementsReussis === 0) {
      return res.status(400).send("Aucun produit valide sélectionné !");
    }
    
    res.render("successProduit", { message });
  } catch (error) {
    console.error("Erreur traitement entrée multiple:", error);
    res.status(500).send("Erreur lors des entrées de stock: " + error.message);
  }
}

// Sortie de stock - Version améliorée
export async function sortieStock(req, res) {
  try {
    const produits = await getAllProduits();
    res.render("sortieStock", { produits });
  } catch (error) {
    console.error("Erreur sortie stock:", error);
    res.status(500).send("Erreur lors de la récupération des produits");
  }
}

// Traitement sortie stock - Version améliorée
export async function traiterSortieStock(req, res) {
  try {
    const { produit_id, quantite, raison, notes } = req.body;
    
    if (!produit_id || !quantite) {
      return res.status(400).send("Produit et quantité obligatoires !");
    }

    const produit = await getProduitById(produit_id);
    
    if (produit.quantite_stock < parseInt(quantite)) {
      return res.status(400).send(`Stock insuffisant ! Stock actuel: ${produit.quantite_stock}, Quantité demandée: ${quantite}`);
    }
    
    const ancienStock = produit.quantite_stock;
    const nouvelleQuantite = ancienStock - parseInt(quantite);
    
    await updateStock(produit_id, nouvelleQuantite);
    
    // Enregistrer le mouvement de sortie
    await createMouvementStock({
      produit_id,
      type: 'sortie',
      quantite,
      fournisseur_nom: 'N/A',
      raison,
      notes
    });
    
    res.render("successProduit", { 
      message: `✅ Sortie de stock effectuée !<br><br>
                <strong>${quantite}</strong> unités retirées de <strong>${produit.nom}</strong><br>
                📊 Stock avant: <strong>${ancienStock}</strong> → Stock après: <strong>${nouvelleQuantite}</strong><br>
                📝 Raison: <strong>${raison || 'Non spécifiée'}</strong>`
    });
  } catch (error) {
    console.error("Erreur traitement sortie:", error);
    res.status(500).send("Erreur lors de la sortie de stock: " + error.message);
  }
}

// Historique des mouvements
export async function historiqueMouvements(req, res) {
  try {
    const mouvements = await getMouvementsStock();
    
    // Enrichir les mouvements avec les noms des produits
    const mouvementsAvecDetails = await Promise.all(
      mouvements.map(async (mouvement) => {
        const produit = await getProduitById(mouvement.produit_id);
        return {
          ...mouvement,
          produit_nom: produit ? produit.nom : 'Produit inconnu'
        };
      })
    );
    
    // Trier par date décroissante
    mouvementsAvecDetails.sort((a, b) => new Date(b.date_mouvement) - new Date(a.date_mouvement));
    
    res.render("historiqueMouvements", { mouvements: mouvementsAvecDetails });
  } catch (error) {
    console.error("Erreur historique:", error);
    res.status(500).send("Erreur lors de la récupération de l'historique");
  }
}

// Historique d'un produit spécifique
export async function historiqueProduit(req, res) {
  try {
    const { id } = req.params;
    const produit = await getProduitById(id);
    
    if (!produit) {
      return res.status(404).send("Produit non trouvé");
    }
    
    const mouvements = await getMouvementsByProduit(id);
    
    // Trier par date décroissante
    mouvements.sort((a, b) => new Date(b.date_mouvement) - new Date(a.date_mouvement));
    
    res.render("historiqueProduit", { 
      produit,
      mouvements 
    });
  } catch (error) {
    console.error("Erreur historique produit:", error);
    res.status(500).send("Erreur lors de la récupération de l'historique du produit");
  }
}

// Alertes stock
export async function alertesStock(req, res) {
  try {
    const produitsAlerte = await getProduitsAlerte();
    res.render("alertesStock", { produits: produitsAlerte });
  } catch (error) {
    console.error("Erreur alertes:", error);
    res.status(500).send("Erreur lors de la récupération des alertes");
  }
}

// Fiche produit
export async function ficheProduit(req, res) {
  try {
    const { id } = req.params;
    const produit = await getProduitById(id);
    
    if (!produit) {
      return res.status(404).send("Produit non trouvé");
    }
    
    // Récupérer les derniers mouvements pour ce produit
    const derniersMouvements = await getMouvementsByProduit(id);
    derniersMouvements.sort((a, b) => new Date(b.date_mouvement) - new Date(a.date_mouvement));
    const derniersMouvementsLimites = derniersMouvements.slice(0, 5); // 5 derniers mouvements
    
    res.render("ficheProduit", { 
      produit,
      derniersMouvements: derniersMouvementsLimites
    });
  } catch (error) {
    console.error("Erreur fiche produit:", error);
    res.status(500).send("Erreur lors de la récupération du produit");
  }
}

// Modification produit - VERSION CORRIGÉE
export async function modifierProduit(req, res) {
  try {
    const { id } = req.params;
    const { nom, description, prix_achat, prix_vente, quantite_stock, seuil_alerte } = req.body;
    
    console.log("📝 Données reçues pour modification:", req.body); // Debug
    
    // Validation basique
    if (!nom || !prix_achat || !prix_vente) {
      return res.status(400).send("Nom, prix d'achat et prix de vente sont obligatoires");
    }
    
    await updateProduit(id, { 
      nom: nom.trim(),
      description: description?.trim() || '',
      prix_achat: parseFloat(prix_achat),
      prix_vente: parseFloat(prix_vente),
      quantite_stock: parseInt(quantite_stock) || 0,
      seuil_alerte: parseInt(seuil_alerte) || 5
    });
    
    console.log("✅ Produit modifié avec succès, ID:", id);
    
    // Redirection vers la fiche produit mise à jour
    res.redirect(`/produits/${id}`);
  } catch (error) {
    console.error("❌ Erreur modification produit:", error);
    res.status(500).render("error", {
      message: "Erreur lors de la modification du produit: " + error.message
    });
  }
}

// Suppression produit

export async function supprimerProduit(req, res) {

  try {

    const { id } = req.params;

    await deleteProduit(id);

    

    res.render("successProduit", { 

      message: `Produit ${id} supprimé avec succès !` 

    });

  } catch (error) {

    console.error("Erreur suppression produit:", error);

    res.status(500).send("Erreur lors de la suppression du produit");

  }

}



/* --- NOUVEAU : GESTION DES LISTES DE MOUVEMENTS --- */



// Afficher la liste des entrées

export async function listeEntrees(req, res) {

  try {

    const { produit_id, date_start, date_end } = req.query;

    const mouvements = await getMouvementsFiltered({ 

      type: 'entree', 

      produit_id, 

      date_start, 

      date_end 

    });

    const produits = await getAllProduits();

    res.render('listeMouvements', {

      mouvements,

      produits,

      title: "Liste des Entrées de Stock",

      type: 'entree',

      filters: req.query

    });

  } catch (error) {

    console.error("Erreur liste entrées:", error);

    res.status(500).send("Erreur lors de la récupération des entrées");

  }

}



// Afficher la liste des sorties

export async function listeSorties(req, res) {

  try {

    const { produit_id, date_start, date_end } = req.query;

    const mouvements = await getMouvementsFiltered({ 

      type: 'sortie', 

      produit_id, 

      date_start, 

      date_end 

    });

    const produits = await getAllProduits();

    res.render('listeMouvements', {

      mouvements,

      produits,

      title: "Liste des Sorties de Stock",

      type: 'sortie',

      filters: req.query

    });

  } catch (error) {

    console.error("Erreur liste sorties:", error);

    res.status(500).send("Erreur lors de la récupération des sorties");

  }

}



// Afficher le formulaire de modification d'un mouvement

export async function showModifierMouvement(req, res) {

  try {

    const { id } = req.params;

    const mouvement = await getMouvementById(id);

    if (!mouvement) {

      return res.status(404).send("Mouvement non trouvé");

    }

    res.render('editMouvement', { mouvement, title: "Modifier un Mouvement" });

  } catch (error) {

    console.error("Erreur affichage modif mouvement:", error);

    res.status(500).send("Erreur lors de l'affichage du formulaire");

  }

}



// Traiter la modification d'un mouvement

export async function modifierMouvement(req, res) {

  try {

    const { id } = req.params;

    const { quantite, raison, notes } = req.body;



    const oldMouvement = await updateMouvement(id, { quantite, raison, notes });

    const produit = await getProduitById(oldMouvement.produit_id);



    const quantiteDiff = parseInt(quantite) - oldMouvement.quantite;

    

    let nouveauStock;

    if (oldMouvement.type === 'entree') {

      nouveauStock = produit.quantite_stock + quantiteDiff;

    } else { // 'sortie'

      nouveauStock = produit.quantite_stock - quantiteDiff;

    }



    await updateStock(oldMouvement.produit_id, nouveauStock);



    res.redirect(`/produits/mouvements/${oldMouvement.type}s`);

  } catch (error) {

    console.error("Erreur modif mouvement:", error);

    res.status(500).send("Erreur lors de la modification du mouvement");

  }

}



// Supprimer un mouvement

export async function supprimerMouvement(req, res) {

  try {

    const { id } = req.params;

    const mouvementSupprime = await deleteMouvement(id);

    

    const produit = await getProduitById(mouvementSupprime.produit_id);

    

    let nouveauStock;

    if (mouvementSupprime.type === 'entree') {

      nouveauStock = produit.quantite_stock - mouvementSupprime.quantite;

    } else { // 'sortie'

      nouveauStock = produit.quantite_stock + mouvementSupprime.quantite;

    }



    await updateStock(mouvementSupprime.produit_id, nouveauStock);



    res.redirect(`/produits/mouvements/${mouvementSupprime.type}s`);

  } catch (error) {

    console.error("Erreur suppression mouvement:", error);

    res.status(500).send("Erreur lors de la suppression du mouvement");

  }

}
