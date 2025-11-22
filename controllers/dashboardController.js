// controllers/dashboardController.js
import { getDashboardStats, getMonthlyStats } from "../models/dashboardModel.js";

// Page principale du tableau de bord
export async function showDashboard(req, res) {
  try {
    const stats = await getDashboardStats();
    const monthlyStats = await getMonthlyStats();
    
    res.render("dashboard", {
      stats,
      monthlyStats,
      title: "Tableau de Bord"
    });
  } catch (error) {
    console.error("Erreur dashboard:", error);
    res.status(500).render("erreur", {
      message: "Erreur lors du chargement du tableau de bord",
      title: "Erreur"
    });
  }
}

// API pour données graphiques (AJAX)
// Route pour la page HTML du dashboard
export async function renderDashboardPage(req, res) {
  try {
    const stats = await getDashboardStats();
    const monthlyStats = await getMonthlyStats();
    
    // Rendre le template EJS avec les données
    res.render('dashboard', {
      title: 'Tableau de Bord',
      stats: stats,
      monthlyStats: monthlyStats
    });
  } catch (error) {
    console.error("Erreur rendu dashboard:", error);
    res.status(500).render('error', { 
      message: "Erreur lors du chargement du tableau de bord" 
    });
  }
}

// Route API pour les données JSON (gardez votre fonction existante)
export async function getDashboardData(req, res) {
  try {
    const stats = await getDashboardStats();
    const monthlyStats = await getMonthlyStats();
    
    res.json({
      success: true,
      stats,
      monthlyStats
    });
  } catch (error) {
    console.error("Erreur API dashboard:", error);
    res.json({
      success: false,
      error: "Erreur lors de la récupération des données"
    });
  }
}