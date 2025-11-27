# ✅ Checklist de Vérification pour Déploiement Vercel

## 📋 Configuration Fichiers

### ✅ Fichiers Créés/Configurés

- [x] **vercel.json** - Configuration SPA avec rewrites pour React Router
- [x] **VERCEL_DEPLOYMENT.md** - Documentation complète du déploiement
- [x] **package.json** - Scripts de build correctement configurés

### ✅ Configuration Build

- [x] Script `build` : `tsc -b && vite build` ✅
- [x] Script `lint` : `eslint .` ✅
- [x] TypeScript configuré correctement ✅
- [x] Vite configuré correctement ✅

## 🔐 Variables d'Environnement

### Variables Requises

- [ ] **VITE_API_BASE_URL** - URL de base de l'API backend
  - Valeur attendue : `http://admin-api.proxymarketapp.com/api` ou `https://admin-api.proxymarketapp.com/api`
  - **⚠️ IMPORTANT** : À configurer dans Vercel Dashboard > Settings > Environment Variables

### Variables Optionnelles

- [ ] **VITE_GOOGLE_MAPS_API_KEY** - Clé API Google Maps (si fonctionnalités cartes utilisées)
  - **⚠️ IMPORTANT** : Si utilisée, ajouter le domaine Vercel dans les restrictions Google Maps

## 🚀 Configuration Vercel

### Settings à Vérifier

- [ ] Framework détecté : `Vite`
- [ ] Build Command : `npm run build` (auto-détecté)
- [ ] Output Directory : `dist` (auto-détecté)
- [ ] Install Command : `npm install` (auto-détecté)
- [ ] Node Version : Compatible (Vercel gère automatiquement)

### Routing

- [x] **vercel.json** configure les rewrites pour SPA ✅
- [x] Toutes les routes pointent vers `/index.html` ✅
- [x] React Router fonctionnera correctement ✅

## 🔍 Vérifications Code

### ✅ Points Vérifiés

- [x] Pas d'erreurs TypeScript critiques
- [x] Pas d'erreurs ESLint bloquantes
- [x] Variables d'environnement utilisent `import.meta.env.VITE_*`
- [x] Gestion d'erreurs API centralisée
- [x] Logs de développement protégés par `import.meta.env.DEV`

### ⚠️ Points d'Attention

1. **API_BASE_URL peut être undefined**
   - Le code gère ce cas (pas de throw en production)
   - **Action requise** : Configurer `VITE_API_BASE_URL` dans Vercel

2. **Google Maps API Key**
   - Si utilisée, doit être configurée dans Vercel
   - Ajouter le domaine Vercel dans les restrictions Google

3. **CORS**
   - Vérifier que l'API backend autorise les requêtes depuis le domaine Vercel
   - Format attendu : `https://votre-projet.vercel.app`

## 📝 Checklist Pré-Déploiement

### Avant le Déploiement

- [ ] Build local réussi : `npm run build`
- [ ] Lint local réussi : `npm run lint`
- [ ] Variables d'environnement configurées dans Vercel
- [ ] Repository Git connecté à Vercel
- [ ] CORS configuré sur l'API backend
- [ ] Google Maps API key configurée (si nécessaire)

### Après le Déploiement

- [ ] Application accessible sur l'URL Vercel
- [ ] Connexion API fonctionnelle
- [ ] Authentification fonctionnelle
- [ ] Routes React Router fonctionnent (pas de 404)
- [ ] Assets statiques chargés correctement
- [ ] Pas d'erreurs dans la console du navigateur

## 🐛 Dépannage Rapide

### Erreur : "Cannot find module"
```bash
# Vérifier les dépendances
npm install
npm run build
```

### Erreur : "VITE_API_BASE_URL is not defined"
- Aller dans Vercel Dashboard > Settings > Environment Variables
- Ajouter `VITE_API_BASE_URL` avec la valeur de l'API

### Erreur : "404 Not Found" sur les routes
- Vérifier que `vercel.json` contient les rewrites
- Redéployer l'application

### Erreur CORS
- Vérifier que l'API backend autorise le domaine Vercel
- Ajouter le domaine dans les headers CORS de l'API

## 📚 Documentation

- **VERCEL_DEPLOYMENT.md** - Guide complet de déploiement
- **BEST_PRACTICES.md** - Bonnes pratiques du projet
- **README.md** - Documentation générale

## ✅ Statut Final

- [x] Configuration Vercel prête
- [x] Documentation complète
- [x] Code vérifié
- [ ] Variables d'environnement à configurer dans Vercel
- [ ] CORS à vérifier sur l'API backend
- [ ] Déploiement à effectuer

---

**Note** : Cette checklist doit être complétée avant chaque déploiement en production.

