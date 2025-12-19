# Système de Gestion Commerciale - Marché Pagne

Application web complète de gestion d'inventaire et de ventes avec authentification, gestion de stock, clients, fournisseurs et rapports.

## 🚀 Fonctionnalités

- ✅ **Authentification sécurisée** avec gestion des rôles (Admin/User/Superadmin)
- ✅ **Gestion des produits** avec alertes de stock
- ✅ **Gestion des clients** et fournisseurs
- ✅ **Système de ventes** avec paiements partiels
- ✅ **Suivi des mouvements de stock** (entrées/sorties)
- ✅ **Tableau de bord** avec statistiques et graphiques
- ✅ **Validation des données** côté serveur
- ✅ **Protection contre** les attaques XSS, CSRF, et injection SQL
- ✅ **Rate limiting** sur les routes sensibles
- ✅ **Logging structuré** avec Winston

## 🔒 Sécurité

Ce projet implémente les meilleures pratiques de sécurité :

- Helmet.js pour les en-têtes HTTP sécurisés
- CSRF protection
- Rate limiting sur authentification
- Validation stricte des entrées
- Transactions SQL pour éviter les race conditions
- Sessions sécurisées avec MySQL store
- Mots de passe hashés avec bcrypt (12 caractères minimum)
- SSL/TLS avec validation de certificats

## 📋 Prérequis

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm ou yarn

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone <repository-url>
cd pagne-v-final
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration de l'environnement

Copier le fichier d'exemple et configurer vos variables :

```bash
cp .env.example .env
```

Éditer `.env` avec vos paramètres :

```env
DB_HOST=your-database-host
DB_USER=your-database-user
DB_PASS=your-secure-password
DB_NAME=your-database-name
DB_PORT=25881

PORT=2000
NODE_ENV=development

# Générer un secret sécurisé avec :
# node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
SESSION_SECRET=votre-secret-super-long-et-securise

# Optionnel : Chemin vers le certificat SSL CA
# DB_SSL_CA=/path/to/ca-certificate.crt
```

### 4. Créer la base de données

```sql
CREATE DATABASE marche CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Puis importer le schéma (si disponible) ou créer les tables manuellement :

```sql
-- Users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('user', 'admin', 'superadmin') DEFAULT 'user',
  status ENUM('pending', 'active', 'inactive') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE produit (
  id_produit INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  description TEXT,
  prix_achat DECIMAL(10,2) NOT NULL,
  prix_vente DECIMAL(10,2) NOT NULL,
  quantite_stock INT DEFAULT 0,
  seuil_alerte INT DEFAULT 5,
  fournisseur_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fournisseur (fournisseur_id)
);

-- Clients table
CREATE TABLE client (
  id_client INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20) NOT NULL,
  email VARCHAR(100),
  adresse VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers table
CREATE TABLE fournisseur (
  id_fournisseur INT AUTO_INCREMENT PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  telephone VARCHAR(20),
  email VARCHAR(100),
  pays VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements table
CREATE TABLE mouvement_stock (
  id_mouvement INT AUTO_INCREMENT PRIMARY KEY,
  produit_id INT NOT NULL,
  type ENUM('entree', 'sortie') NOT NULL,
  quantite INT NOT NULL,
  fournisseur_nom VARCHAR(100),
  raison VARCHAR(255),
  notes TEXT,
  prix_achat DECIMAL(10,2),
  date_mouvement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_produit (produit_id),
  INDEX idx_date (date_mouvement),
  FOREIGN KEY (produit_id) REFERENCES produit(id_produit) ON DELETE CASCADE
);

-- Sales table
CREATE TABLE vente (
  id_vente INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT,
  date_vente TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_ht DECIMAL(10,2) NOT NULL,
  tax DECIMAL(10,2) DEFAULT 0,
  total_ttc DECIMAL(10,2) NOT NULL,
  montant_paye DECIMAL(10,2) DEFAULT 0,
  reste DECIMAL(10,2) DEFAULT 0,
  INDEX idx_client (client_id),
  INDEX idx_date (date_vente),
  FOREIGN KEY (client_id) REFERENCES client(id_client) ON DELETE SET NULL
);

-- Sale details table
CREATE TABLE vente_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vente_id INT NOT NULL,
  produit_id INT NOT NULL,
  quantite INT NOT NULL,
  prix_vente DECIMAL(10,2) NOT NULL,
  prix_achat DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  marge DECIMAL(10,2) NOT NULL,
  INDEX idx_vente (vente_id),
  INDEX idx_produit (produit_id),
  FOREIGN KEY (vente_id) REFERENCES vente(id_vente) ON DELETE CASCADE,
  FOREIGN KEY (produit_id) REFERENCES produit(id_produit) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE paiement (
  id_paiement INT AUTO_INCREMENT PRIMARY KEY,
  vente_id INT NOT NULL,
  montant DECIMAL(10,2) NOT NULL,
  mode VARCHAR(20) DEFAULT 'cash',
  date_paiement TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_vente (vente_id),
  FOREIGN KEY (vente_id) REFERENCES vente(id_vente) ON DELETE CASCADE
);
```

### 5. Créer un utilisateur super admin

```sql
INSERT INTO users (username, password, role, status) 
VALUES ('admin', '$2a$10$YourHashedPasswordHere', 'superadmin', 'active');
```

Pour générer un mot de passe hashé :

```bash
node -e "const bcrypt = require('bcryptjs'); console.log(bcrypt.hashSync('VotreMotDePasse', 10));"
```

## 🚀 Démarrage

### Mode développement

```bash
npm run dev
```

### Mode production

```bash
npm start
```

L'application sera accessible sur `http://localhost:2000`

## 📁 Structure du projet

```
pagne-v-final/
├── config/
│   ├── db.js              # Configuration base de données
│   └── logger.js          # Configuration Winston logger
├── controllers/           # Logique métier
│   ├── authController.js
│   ├── clientController.js
│   ├── produitController.js
│   └── ...
├── middleware/
│   ├── authMiddleware.js  # Authentification & autorisation
│   └── validators.js      # Validation des entrées
├── models/                # Accès aux données
│   ├── userModel.js
│   ├── produitModel.js
│   └── ...
├── routes/                # Définition des routes
├── utils/
│   ├── escapeHtml.js      # Protection XSS
│   └── transactions.js    # Transactions SQL
├── views/                 # Templates EJS
├── public/
│   └── css/
│       └── styles.css     # Styles CSS
├── logs/                  # Fichiers de logs
├── app.js                 # Point d'entrée
├── .env                   # Configuration (NE PAS COMMITTER)
├── .env.example           # Template de configuration
└── package.json
```

## 🔐 Gestion des utilisateurs

### Rôles

- **user** : Accès de base (ventes)
- **admin** : Gestion complète (produits, clients, fournisseurs)
- **superadmin** : Gestion des utilisateurs + tous les droits

### Routes protégées

- `/dashboard` : Tous les utilisateurs authentifiés
- `/clients`, `/produits`, `/fournisseurs` : Admin uniquement
- `/admin` : Admin uniquement (gestion utilisateurs)
- `/ventes` : Tous les utilisateurs authentifiés

## 📊 API Endpoints

### Santé de l'application

```
GET /health
```

Retourne le statut de l'application :

```json
{
  "status": "ok",
  "timestamp": "2025-12-18T10:30:00.000Z",
  "uptime": 3600,
  "environment": "production"
}
```

## 🔒 Sécurité - Points importants

### ⚠️ AVANT LA PRODUCTION

1. **Générer un SESSION_SECRET sécurisé**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **Configurer SSL/TLS correctement**
   - Obtenir un certificat CA valide
   - Définir `DB_SSL_CA` dans `.env`
   - S'assurer que `NODE_ENV=production`

3. **Changer les mots de passe par défaut**

4. **Configurer un reverse proxy (Nginx)** avec HTTPS

5. **Activer les backups automatiques** de la base de données

6. **Configurer un système de monitoring** (PM2, New Relic, etc.)

### Mots de passe

Politique stricte appliquée :
- Minimum 12 caractères
- Au moins une majuscule
- Au moins une minuscule
- Au moins un chiffre
- Au moins un caractère spécial

## 📝 Logs

Les logs sont stockés dans le dossier `logs/` :
- `combined.log` : Tous les logs
- `error.log` : Erreurs uniquement

Configuration du niveau de log via `LOG_LEVEL` dans `.env` (debug, info, warn, error)

## 🧪 Tests

```bash
# À implémenter
npm test
```

## 🐛 Dépannage

### Erreur de connexion à la base de données

1. Vérifier les credentials dans `.env`
2. Vérifier que MySQL est démarré
3. Vérifier la configuration SSL/TLS

### Erreur "SESSION_SECRET must be set"

Générer et définir un SESSION_SECRET dans `.env`

### Port déjà utilisé

Changer le `PORT` dans `.env`

## 📄 License

Propriétaire

## 👥 Support

Pour toute question ou problème, contactez l'équipe de développement.

## 🔄 Changelog

### Version 2.0.0 (2025-12-18)

#### Améliorations de sécurité
- ✅ Ajout de Helmet.js pour les en-têtes HTTP
- ✅ Implémentation du rate limiting
- ✅ Validation stricte des entrées avec express-validator
- ✅ Protection XSS avec escape HTML
- ✅ Transactions SQL pour éviter les race conditions
- ✅ SSL/TLS configuré correctement
- ✅ Logging structuré avec Winston

#### Améliorations fonctionnelles
- ✅ Endpoint de santé `/health`
- ✅ Gestion d'erreurs centralisée
- ✅ Extraction des styles CSS
- ✅ Documentation complète

#### Corrections de bugs
- ✅ Correction des problèmes de concurrence sur les stocks
- ✅ Amélioration de la gestion des sessions
- ✅ Validation des mots de passe renforcée
