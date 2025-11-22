// models/dashboardModel.js
import pool from "../config/db.js";

// Statistiques générales
export async function getDashboardStats() {
  try {
    // Compter les produits
    const [produitsRows] = await pool.execute("SELECT COUNT(*) as total FROM produit");
    const [produitsAlerteRows] = await pool.execute("SELECT COUNT(*) as alertes FROM produit WHERE quantite_stock <= seuil_alerte");
    
    // Compter les clients
    const [clientsRows] = await pool.execute("SELECT COUNT(*) as total FROM client");
    
    // Compter les fournisseurs
    const [fournisseursRows] = await pool.execute("SELECT COUNT(*) as total FROM fournisseur");
    
    // Derniers mouvements de stock
    const [mouvementsRows] = await pool.execute(
      `SELECT m.*, p.nom as produit_nom 
       FROM mouvement_stock m 
       LEFT JOIN produit p ON m.produit_id = p.id_produit 
       ORDER BY m.date_mouvement DESC 
       LIMIT 5`
    );
    
    // --- CORRIGÉ : Produits les plus vendus depuis la table des ventes ---
    const [produitsPopulairesRows] = await pool.execute(
      `SELECT p.nom, SUM(vd.quantite) as total_vendu
       FROM vente_details vd
       JOIN produit p ON vd.produit_id = p.id_produit
       GROUP BY p.id_produit, p.nom
       ORDER BY total_vendu DESC
       LIMIT 5`
    );

    return {
      produits: {
        total: produitsRows[0].total,
        alertes: produitsAlerteRows[0].alertes
      },
      clients: clientsRows[0].total,
      fournisseurs: fournisseursRows[0].total,
      derniersMouvements: mouvementsRows,
      produitsPopulaires: produitsPopulairesRows
    };
  } catch (error) {
    console.error("Erreur récupération stats dashboard:", error);
    return {
      produits: { total: 0, alertes: 0 },
      clients: 0,
      fournisseurs: 0,
      derniersMouvements: [],
      produitsPopulaires: []
    };
  }
}

// --- CORRIGÉ : Statistiques mensuelles robustes pour les graphiques ---
export async function getMonthlyStats() {
  try {
    // 1. Générer les labels pour les 6 derniers mois
    const labels = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      labels.push(`${year}-${month}`);
    }

    // 2. Récupérer les données de ventes des 6 derniers mois
    const [ventesDb] = await pool.execute(
      `SELECT 
        DATE_FORMAT(v.date_vente, '%Y-%m') as mois,
        SUM(vd.quantite) as total_ventes
       FROM vente_details vd
       JOIN vente v ON vd.vente_id = v.id_vente
       WHERE v.date_vente >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY mois`
    );

    // 3. Récupérer les données d'entrées des 6 derniers mois
    const [entreesDb] = await pool.execute(
      `SELECT 
        DATE_FORMAT(date_mouvement, '%Y-%m') as mois,
        SUM(quantite) as total_entrees
       FROM mouvement_stock 
       WHERE type = 'entree' AND date_mouvement >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY mois`
    );

    // 4. Mapper les données sur les labels pour garantir l'alignement
    const ventesMap = new Map(ventesDb.map(item => [item.mois, item.total_ventes]));
    const entreesMap = new Map(entreesDb.map(item => [item.mois, item.total_entrees]));

    const ventesData = labels.map(label => ventesMap.get(label) || 0);
    const entreesData = labels.map(label => entreesMap.get(label) || 0);

    // Formatter les labels pour l'affichage (MM/YYYY)
    const chartLabels = labels.map(label => {
      const [year, month] = label.split('-');
      return `${month}/${year.slice(2)}`;
    });

    return {
      labels: chartLabels,
      ventes: ventesData,
      entrees: entreesData
    };
  } catch (error) {
    console.error("Erreur récupération stats mensuelles:", error);
    return { labels: [], ventes: [], entrees: [] };
  }
}