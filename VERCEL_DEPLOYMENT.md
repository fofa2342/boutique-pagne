# Guide de déploiement Vercel

## 📋 Prérequis

1. Un compte Vercel
2. Une base de données MySQL accessible en ligne (ex: Aiven, PlanetScale, AWS RDS)
3. Les variables d'environnement configurées

## 🚀 Étapes de déploiement

### 1. Préparer votre base de données

Assurez-vous que votre base de données MySQL est accessible depuis Internet et notez :
- Host (DB_HOST)
- User (DB_USER)
- Password (DB_PASS)
- Database name (DB_NAME)
- Port (DB_PORT)

### 2. Générer un SESSION_SECRET

Exécutez cette commande pour générer un secret sécurisé :

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copiez le résultat, vous en aurez besoin.

### 3. Configurer les variables d'environnement dans Vercel

#### Option A : Via l'interface web Vercel

1. Allez sur [vercel.com](https://vercel.com)
2. Sélectionnez votre projet
3. Allez dans **Settings** → **Environment Variables**
4. Ajoutez les variables suivantes :

| Name | Value | Environment |
|------|-------|-------------|
| `DB_HOST` | Votre host MySQL | Production, Preview, Development |
| `DB_USER` | Votre username MySQL | Production, Preview, Development |
| `DB_PASS` | Votre password MySQL | Production, Preview, Development |
| `DB_NAME` | Votre nom de base de données | Production, Preview, Development |
| `DB_PORT` | `3306` (ou votre port) | Production, Preview, Development |
| `SESSION_SECRET` | Le secret généré à l'étape 2 | Production, Preview, Development |
| `NODE_ENV` | `production` | Production |

5. Cliquez sur **Save** pour chaque variable

#### Option B : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Ajouter les variables
vercel env add DB_HOST production
vercel env add DB_USER production
vercel env add DB_PASS production
vercel env add DB_NAME production
vercel env add DB_PORT production
vercel env add SESSION_SECRET production
vercel env add NODE_ENV production
```

### 4. Déployer

#### Via Git (Recommandé)

1. Poussez votre code sur GitHub/GitLab/Bitbucket
2. Connectez votre repository à Vercel
3. Vercel déploiera automatiquement à chaque push

```bash
git add .
git commit -m "Configuration Vercel"
git push origin main
```

#### Via Vercel CLI

```bash
vercel --prod
```

### 5. Vérifier le déploiement

1. Attendez la fin du build
2. Visitez l'URL fournie par Vercel
3. Vérifiez les logs si erreur : `vercel logs`

## 🔧 Configuration avancée

### Fichier vercel.json (optionnel)

Créez un fichier `vercel.json` à la racine :

```json
{
  "version": 2,
  "builds": [
    {
      "src": "app.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "app.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Limitations Vercel

⚠️ **Attention** : Vercel est serverless
- Pas de système de fichiers persistant
- Timeout de 10s par requête (plan gratuit)
- Pas de WebSockets natifs
- Pas de cron jobs natifs

## 📊 Monitoring

### Voir les logs en temps réel

```bash
vercel logs --follow
```

### Voir les logs d'un déploiement spécifique

```bash
vercel logs [deployment-url]
```

## 🐛 Dépannage

### Erreur : "SESSION_SECRET must be set"
→ Ajoutez la variable `SESSION_SECRET` dans Vercel

### Erreur : "Cannot connect to database"
→ Vérifiez que votre DB est accessible publiquement et que les credentials sont corrects

### Erreur : "ENOENT: no such file or directory, mkdir 'logs'"
→ C'est résolu dans le code (logger détecte Vercel automatiquement)

### Timeout errors
→ Optimisez vos requêtes SQL ou passez à un plan Vercel Pro

## 🔄 Redéploiement

Pour forcer un redéploiement :

```bash
vercel --prod --force
```

Ou depuis l'interface Vercel : **Deployments** → **...** → **Redeploy**

## 📝 Checklist de déploiement

- [ ] Base de données MySQL accessible en ligne
- [ ] Variables d'environnement configurées dans Vercel
- [ ] SESSION_SECRET généré et ajouté
- [ ] Code poussé sur Git
- [ ] Build réussi
- [ ] Application accessible
- [ ] Tests de connexion DB
- [ ] Tests d'authentification
- [ ] Logs sans erreur

## 🎉 Déploiement réussi !

Votre application devrait maintenant être en ligne sur Vercel !

URL de production : `https://votre-projet.vercel.app`
