// models/paysModel.js
import pool from "../config/db.js";
import logger from '../config/logger.js';

// Get all countries
export async function getAllPays() {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nom, code_iso, drapeau FROM pays ORDER BY nom"
    );
    return rows;
  } catch (error) {
    logger.error("Error fetching countries:", error);
    return [];
  }
}

// Get country by ID
export async function getPaysById(id) {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nom, code_iso, drapeau FROM pays WHERE id = ?",
      [id]
    );
    return rows[0];
  } catch (error) {
    logger.error("Error fetching country by ID:", error);
    return null;
  }
}

// Get country by name
export async function getPaysByNom(nom) {
  try {
    const [rows] = await pool.execute(
      "SELECT id, nom, code_iso, drapeau FROM pays WHERE nom = ?",
      [nom]
    );
    return rows[0];
  } catch (error) {
    logger.error("Error fetching country by name:", error);
    return null;
  }
}

// Create the pays table and seed with data (run once)
export async function initPaysTable() {
  try {
    // Create table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS pays (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nom VARCHAR(100) NOT NULL UNIQUE,
        code_iso VARCHAR(3),
        drapeau VARCHAR(10) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    // Check if table is empty
    const [rows] = await pool.execute("SELECT COUNT(*) as count FROM pays");
    
    if (rows[0].count === 0) {
      // Seed with countries
      const countries = [
        // Africa
        ['Afrique du Sud', 'ZA', '🇿🇦'],
        ['Algérie', 'DZ', '🇩🇿'],
        ['Angola', 'AO', '🇦🇴'],
        ['Bénin', 'BJ', '🇧🇯'],
        ['Botswana', 'BW', '🇧🇼'],
        ['Burkina Faso', 'BF', '🇧🇫'],
        ['Burundi', 'BI', '🇧🇮'],
        ['Cameroun', 'CM', '🇨🇲'],
        ['Cap-Vert', 'CV', '🇨🇻'],
        ['Centrafrique', 'CF', '🇨🇫'],
        ['Comores', 'KM', '🇰🇲'],
        ['Congo', 'CG', '🇨🇬'],
        ['Congo (RDC)', 'CD', '🇨🇩'],
        ['Côte d\'Ivoire', 'CI', '🇨🇮'],
        ['Djibouti', 'DJ', '🇩🇯'],
        ['Égypte', 'EG', '🇪🇬'],
        ['Érythrée', 'ER', '🇪🇷'],
        ['Éthiopie', 'ET', '🇪🇹'],
        ['Gabon', 'GA', '🇬🇦'],
        ['Gambie', 'GM', '🇬🇲'],
        ['Ghana', 'GH', '🇬🇭'],
        ['Guinée', 'GN', '🇬🇳'],
        ['Guinée équatoriale', 'GQ', '🇬🇶'],
        ['Guinée-Bissau', 'GW', '🇬🇼'],
        ['Kenya', 'KE', '🇰🇪'],
        ['Lesotho', 'LS', '🇱🇸'],
        ['Liberia', 'LR', '🇱🇷'],
        ['Libye', 'LY', '🇱🇾'],
        ['Madagascar', 'MG', '🇲🇬'],
        ['Malawi', 'MW', '🇲🇼'],
        ['Mali', 'ML', '🇲🇱'],
        ['Maroc', 'MA', '🇲🇦'],
        ['Maurice', 'MU', '🇲🇺'],
        ['Mauritanie', 'MR', '🇲🇷'],
        ['Mozambique', 'MZ', '🇲🇿'],
        ['Namibie', 'NA', '🇳🇦'],
        ['Niger', 'NE', '🇳🇪'],
        ['Nigeria', 'NG', '🇳🇬'],
        ['Ouganda', 'UG', '🇺🇬'],
        ['Rwanda', 'RW', '🇷🇼'],
        ['São Tomé-et-Príncipe', 'ST', '🇸🇹'],
        ['Sénégal', 'SN', '🇸🇳'],
        ['Seychelles', 'SC', '🇸🇨'],
        ['Sierra Leone', 'SL', '🇸🇱'],
        ['Somalie', 'SO', '🇸🇴'],
        ['Soudan', 'SD', '🇸🇩'],
        ['Soudan du Sud', 'SS', '🇸🇸'],
        ['Tanzanie', 'TZ', '🇹🇿'],
        ['Tchad', 'TD', '🇹🇩'],
        ['Togo', 'TG', '🇹🇬'],
        ['Tunisie', 'TN', '🇹🇳'],
        ['Zambie', 'ZM', '🇿🇲'],
        ['Zimbabwe', 'ZW', '🇿🇼'],
        
        // Europe
        ['Allemagne', 'DE', '🇩🇪'],
        ['Autriche', 'AT', '🇦🇹'],
        ['Belgique', 'BE', '🇧🇪'],
        ['Bulgarie', 'BG', '🇧🇬'],
        ['Croatie', 'HR', '🇭🇷'],
        ['Danemark', 'DK', '🇩🇰'],
        ['Espagne', 'ES', '🇪🇸'],
        ['Estonie', 'EE', '🇪🇪'],
        ['Finlande', 'FI', '🇫🇮'],
        ['France', 'FR', '🇫🇷'],
        ['Grèce', 'GR', '🇬🇷'],
        ['Hongrie', 'HU', '🇭🇺'],
        ['Irlande', 'IE', '🇮🇪'],
        ['Italie', 'IT', '🇮🇹'],
        ['Lettonie', 'LV', '🇱🇻'],
        ['Lituanie', 'LT', '🇱🇹'],
        ['Luxembourg', 'LU', '🇱🇺'],
        ['Norvège', 'NO', '🇳🇴'],
        ['Pays-Bas', 'NL', '🇳🇱'],
        ['Pologne', 'PL', '🇵🇱'],
        ['Portugal', 'PT', '🇵🇹'],
        ['République tchèque', 'CZ', '🇨🇿'],
        ['Roumanie', 'RO', '🇷🇴'],
        ['Royaume-Uni', 'GB', '🇬🇧'],
        ['Russie', 'RU', '🇷🇺'],
        ['Slovaquie', 'SK', '🇸🇰'],
        ['Slovénie', 'SI', '🇸🇮'],
        ['Suède', 'SE', '🇸🇪'],
        ['Suisse', 'CH', '🇨🇭'],
        ['Ukraine', 'UA', '🇺🇦'],
        
        // Americas
        ['Argentine', 'AR', '🇦🇷'],
        ['Brésil', 'BR', '🇧🇷'],
        ['Canada', 'CA', '🇨🇦'],
        ['Chili', 'CL', '🇨🇱'],
        ['Colombie', 'CO', '🇨🇴'],
        ['Cuba', 'CU', '🇨🇺'],
        ['États-Unis', 'US', '🇺🇸'],
        ['Haïti', 'HT', '🇭🇹'],
        ['Mexique', 'MX', '🇲🇽'],
        ['Pérou', 'PE', '🇵🇪'],
        ['Venezuela', 'VE', '🇻🇪'],
        
        // Asia
        ['Arabie saoudite', 'SA', '🇸🇦'],
        ['Chine', 'CN', '🇨🇳'],
        ['Corée du Sud', 'KR', '🇰🇷'],
        ['Émirats arabes unis', 'AE', '🇦🇪'],
        ['Inde', 'IN', '🇮🇳'],
        ['Indonésie', 'ID', '🇮🇩'],
        ['Israël', 'IL', '🇮🇱'],
        ['Japon', 'JP', '🇯🇵'],
        ['Liban', 'LB', '🇱🇧'],
        ['Malaisie', 'MY', '🇲🇾'],
        ['Pakistan', 'PK', '🇵🇰'],
        ['Philippines', 'PH', '🇵🇭'],
        ['Singapour', 'SG', '🇸🇬'],
        ['Thaïlande', 'TH', '🇹🇭'],
        ['Turquie', 'TR', '🇹🇷'],
        ['Vietnam', 'VN', '🇻🇳'],
        
        // Oceania
        ['Australie', 'AU', '🇦🇺'],
        ['Nouvelle-Zélande', 'NZ', '🇳🇿'],
        
        // Other
        ['Autre', null, '🌍']
      ];
      
      for (const [nom, code_iso, drapeau] of countries) {
        await pool.execute(
          "INSERT INTO pays (nom, code_iso, drapeau) VALUES (?, ?, ?)",
          [nom, code_iso, drapeau]
        );
      }
      
      logger.info(`Pays table seeded with ${countries.length} countries`);
    }
    
    return true;
  } catch (error) {
    logger.error("Error initializing pays table:", error);
    throw error;
  }
}
