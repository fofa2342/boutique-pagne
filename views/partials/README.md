# Guide d'utilisation de la Sidebar standardisée

## Fichiers créés
- `views/partials/sidebar.ejs` - Sidebar navigation complète
- `views/partials/sidebarStyles.ejs` - Styles CSS pour la sidebar

## Comment utiliser dans vos pages

### 1. Inclure les styles dans le `<head>` de votre page :

```html
<head>
  <!-- Vos autres balises head -->
  <%- include('partials/sidebarStyles') %>
</head>
```

### 2. Inclure la sidebar dans le `<body>` :

```html
<body>
  <%- include('partials/sidebar', { currentPage: 'dashboard', user: user }) %>
  
  <div class="main-content">
    <!-- Votre contenu principal ici -->
  </div>
</body>
```

### 3. Valeurs pour `currentPage` :

- `'dashboard'` - Tableau de Bord
- `'clients'` - Gestion Clients
- `'fournisseurs'` - Gestion Fournisseurs
- `'produits'` - Produits
- `'entreeStock'` - Entrée Stock
- `'listeMouvements'` - Liste des Entrées
- `'alertesStock'` - Alertes Stock
- `'vente'` - Nouvelle Vente
- `'listeventes'` - Liste des Ventes
- `'inscriptionClient'` - Nouveau Client
- `'inscriptionFournisseur'` - Nouveau Fournisseur
- `'ajoutProduit'` - Nouveau Produit
- `'users'` - Utilisateurs (admin)
- `'stats'` - Statistiques (admin)

### 4. Exemple complet :

```html
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ma Page</title>
  <%- include('partials/sidebarStyles') %>
  <style>
    /* Vos styles spécifiques à la page */
  </style>
</head>
<body>
  <%- include('partials/sidebar', { currentPage: 'dashboard', user: user }) %>
  
  <div class="main-content">
    <h1>Mon Contenu</h1>
    <!-- Votre contenu ici -->
  </div>
</body>
</html>
```

## Avantages
✅ Navigation cohérente sur toutes les pages
✅ Maintenance facilitée (un seul fichier à modifier)
✅ Gestion automatique des liens actifs
✅ Affichage conditionnel (admin)
✅ Responsive design
✅ Styles optimisés pour l'impression
