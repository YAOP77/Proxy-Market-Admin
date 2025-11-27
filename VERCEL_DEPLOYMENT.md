# Guide de Déploiement sur Vercel - Proxy Market Dashboard

## 📋 Prérequis

1. Compte Vercel créé
2. Repository Git (GitHub, GitLab, ou Bitbucket)
3. Variables d'environnement configurées

## 🚀 Étapes de Déploiement

### 1. Configuration des Variables d'Environnement

Dans le tableau de bord Vercel, allez dans **Settings > Environment Variables** et ajoutez :

#### Variables Requises

```
VITE_API_BASE_URL=http://admin-api.proxymarketapp.com/api
```

#### Variables Optionnelles

```
VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_google_maps
```

**Important :**
- Les variables doivent être préfixées par `VITE_` pour être accessibles dans le code
- Ne pas mettre de guillemets autour des valeurs
- Ne pas mettre de point-virgule à la fin

### 2. Configuration du Projet

Le fichier `vercel.json` est déjà configuré avec :
- ✅ Build command : `npm run build`
- ✅ Output directory : `dist`
- ✅ Framework : `vite`
- ✅ Rewrites pour SPA (toutes les routes pointent vers `/index.html`)
- ✅ Cache headers pour les assets statiques

### 3. Déploiement

#### Option A : Via l'Interface Vercel

1. Connectez votre repository Git à Vercel
2. Vercel détectera automatiquement le framework Vite
3. Configurez les variables d'environnement
4. Cliquez sur **Deploy**

#### Option B : Via Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Se connecter
vercel login

# Déployer
vercel

# Pour la production
vercel --prod
```

## 🔧 Configuration Technique

### Build Configuration

- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`
- **Node Version** : Vercel utilise automatiquement la version compatible

### Routing (SPA)

Le fichier `vercel.json` configure les rewrites pour que toutes les routes pointent vers `index.html`, permettant au routage côté client (React Router) de fonctionner correctement.

### Cache Strategy

- **Assets statiques** (`/assets/*`) : Cache de 1 an (immutable)
- **Pages HTML** : Pas de cache (toujours frais)

## ⚠️ Points d'Attention

### 1. Variables d'Environnement

Assurez-vous que toutes les variables d'environnement sont configurées dans Vercel avant le déploiement. Sans `VITE_API_BASE_URL`, l'application ne pourra pas se connecter à l'API.

### 2. CORS

Si vous rencontrez des erreurs CORS, vérifiez que votre API backend autorise les requêtes depuis le domaine Vercel (ex: `https://votre-projet.vercel.app`).

### 3. Authentification

Les tokens d'authentification sont stockés dans `localStorage`. Assurez-vous que votre API backend gère correctement les tokens et les CORS.

### 4. Google Maps

Si vous utilisez Google Maps, configurez la variable `VITE_GOOGLE_MAPS_API_KEY` et ajoutez votre domaine Vercel dans les restrictions de l'API Google Maps.

## 🐛 Dépannage

### Erreur : "Cannot find module"

Vérifiez que toutes les dépendances sont dans `package.json` et que `node_modules` n'est pas commité.

### Erreur : "VITE_API_BASE_URL is not defined"

Vérifiez que la variable d'environnement est bien configurée dans Vercel avec le préfixe `VITE_`.

### Erreur : "404 Not Found" sur les routes

Vérifiez que le fichier `vercel.json` contient bien les rewrites pour le routage SPA.

### Build échoue

Vérifiez les logs de build dans Vercel pour identifier l'erreur. Les erreurs TypeScript ou ESLint peuvent bloquer le build.

## 📝 Checklist de Déploiement

- [ ] Variables d'environnement configurées dans Vercel
- [ ] `vercel.json` présent et correct
- [ ] `package.json` contient le script `build`
- [ ] Tous les fichiers nécessaires sont commités
- [ ] Repository connecté à Vercel
- [ ] Build réussi en local (`npm run build`)
- [ ] Tests de linting passés (`npm run lint`)
- [ ] CORS configuré sur l'API backend
- [ ] Google Maps API key configurée (si nécessaire)

## 🔗 Ressources

- [Documentation Vercel](https://vercel.com/docs)
- [Documentation Vite](https://vitejs.dev/)
- [React Router](https://reactrouter.com/)

