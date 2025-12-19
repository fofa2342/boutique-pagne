import express from "express";
import { getDashboardStats, getMonthlyStats } from "../models/dashboardModel.js"; // Importez les deux fonctions

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // Récupérer les deux jeux de données
    const stats = await getDashboardStats();
    const monthlyStats = await getMonthlyStats();
    
    res.render("dashboard", {
      title: "Tableau de Bord",
      stats: stats,
      monthlyStats: monthlyStats // ← AJOUT IMPORTANT
    });
  } catch (error) {
    console.error("Erreur dashboard:", error);
    res.status(500).render("error", {
      message: "Erreur lors du chargement du tableau de bord"
    });
  }
});

// API endpoint used by the dashboard page to refresh data
router.get("/api/data", async (req, res) => {
  try {
    const stats = await getDashboardStats();
    const monthlyStats = await getMonthlyStats();
    res.json({
      success: true,
      stats,
      monthlyStats,
    });
  } catch (error) {
    console.error("Erreur API dashboard:", error);
    res.status(500).json({
      success: false,
      error: "Erreur lors de la récupération des données",
    });
  }
});

export default router;