# 🔧 Configuration des Variables d'Environnement sur Vercel

## ⚠️ Problème : "Impossible de contacter le serveur"

Si vous voyez cette erreur lors de la connexion, c'est que la variable d'environnement `VITE_API_BASE_URL` n'est pas configurée sur Vercel.

## ✅ Solution : Configurer la Variable d'Environnement

### Étape 1 : Accéder aux Settings Vercel

1. Allez sur [Vercel Dashboard](https://vercel.com/dashboard)
2. Sélectionnez votre projet **Proxy-Market-Admin**
3. Cliquez sur **Settings** dans le menu de gauche
4. Cliquez sur **Environment Variables** dans le sous-menu

### Étape 2 : Ajouter la Variable

1. Cliquez sur **Add New**
2. Remplissez les champs :
   - **Key** : `VITE_API_BASE_URL`
   - **Value** : `https://admin-api.proxymarketapp.com/api` ⚠️ **IMPORTANT : Utilisez HTTPS, pas HTTP**
   - **Environment** : Sélectionnez **Production**, **Preview**, et **Development** (ou au minimum **Production**)

3. Cliquez sur **Save**

### Étape 3 : Redéployer

Après avoir ajouté la variable :

1. Allez dans l'onglet **Deployments**
2. Cliquez sur les **3 points** (⋯) du dernier déploiement
3. Sélectionnez **Redeploy**
4. Vérifiez que la variable est bien sélectionnée dans les options
5. Cliquez sur **Redeploy**

## 📋 Variables d'Environnement Requises

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_API_BASE_URL` | `https://admin-api.proxymarketapp.com/api` ⚠️ **Doit être en HTTPS** | URL de base de l'API backend |

## 📋 Variables d'Environnement Optionnelles

| Variable | Valeur | Description |
|----------|--------|-------------|
| `VITE_GOOGLE_MAPS_API_KEY` | Votre clé API Google Maps | Si vous utilisez les fonctionnalités de carte |

## ⚠️ Important

- **Ne pas mettre de guillemets** autour de la valeur
- **Ne pas mettre de point-virgule** à la fin
- Les variables doivent être préfixées par `VITE_` pour être accessibles dans le code
- Après modification, **redéployez** l'application pour que les changements prennent effet

## 🔍 Vérification

Pour vérifier que la variable est bien configurée :

1. Allez dans **Deployments**
2. Cliquez sur un déploiement
3. Dans les **Build Logs**, cherchez `VITE_API_BASE_URL`
4. La variable devrait apparaître dans les logs (mais pas sa valeur pour des raisons de sécurité)

## 🐛 Dépannage

### L'erreur persiste après configuration

1. Vérifiez que vous avez bien redéployé après avoir ajouté la variable
2. Vérifiez que la variable est bien dans l'environnement **Production**
3. Vérifiez l'orthographe : `VITE_API_BASE_URL` (avec VITE_ au début)
4. Vérifiez que l'URL de l'API backend est correcte et accessible

### L'API backend n'est pas accessible

- Vérifiez que l'API backend est bien en ligne
- ⚠️ **IMPORTANT** : Utilisez **HTTPS** (pas HTTP) car Vercel sert l'application en HTTPS
- Vérifiez les paramètres CORS de l'API backend pour autoriser les requêtes depuis votre domaine Vercel

### Erreur "Mixed Content"

Si vous voyez l'erreur "Mixed Content" dans la console :
- **Cause** : L'application est en HTTPS mais l'API est en HTTP
- **Solution** : Changez `VITE_API_BASE_URL` pour utiliser `https://` au lieu de `http://`
- Exemple : `https://admin-api.proxymarketapp.com/api`

