# Bonnes Pratiques de Développement - Proxy Market Dashboard

## 📋 Principes Fondamentaux

Ce document énumère les bonnes pratiques de développement à respecter **TOUJOURS** dans ce projet.

---

## 🔒 Sécurité

### 1. **Gestion des Variables d'Environnement**
- ✅ Utiliser des variables d'environnement pour les URLs d'API
- ✅ Préfixer les variables Vite avec `VITE_`
- ✅ Ne JAMAIS commiter les fichiers `.env` avec des secrets
- ✅ Ne JAMAIS hardcoder les endpoints API dans le code
- ✅ Utiliser `import.meta.env.VITE_*` pour accéder aux variables

### 2. **Gestion des Tokens et Authentification**
- ✅ Stocker les tokens dans `localStorage` de manière sécurisée
- ✅ Nettoyer les tokens lors de la déconnexion
- ✅ Utiliser les intercepteurs Axios pour gérer l'authentification
- ✅ Ne JAMAIS logger les tokens, mots de passe ou données sensibles
- ✅ Gérer les erreurs 401/403 proprement

### 3. **Logs et Debugging**
- ❌ **NE JAMAIS mettre d'émojis dans les console.log**
- ✅ Utiliser `console.log`, `console.warn`, `console.error` de manière appropriée
- ✅ Ne logger que les informations non sensibles
- ✅ Utiliser `import.meta.env.DEV` pour les logs de développement uniquement
- ✅ Nettoyer les logs de debug avant la production
- ✅ Ne jamais logger les mots de passe, tokens, ou données utilisateur sensibles

---

## 🏗️ Architecture et Structure

### 1. **Séparation des Responsabilités**
- ✅ **Services API** : Toute la logique d'appel API dans `src/services/api/`
- ✅ **Composants UI** : Logique d'affichage uniquement dans les composants
- ✅ **Utils** : Fonctions utilitaires réutilisables dans `src/utils/`
- ✅ **Types/Interfaces** : Définir les types TypeScript dans les fichiers de service

### 2. **Services API**
- ✅ Un service par domaine (ex: `authService.ts`, `productService.ts`, `adminService.ts`)
- ✅ Utiliser `apiClient` (instance Axios configurée) pour tous les appels API
- ✅ Gérer les erreurs de manière centralisée
- ✅ Retourner des types TypeScript stricts
- ✅ Documenter les fonctions avec JSDoc

### 3. **Composants React**
- ✅ Utiliser des composants fonctionnels avec hooks
- ✅ Séparer la logique métier de la logique d'affichage
- ✅ Utiliser `useMemo` et `useCallback` pour optimiser les performances
- ✅ Gérer les états de chargement, erreur et succès
- ✅ Utiliser TypeScript pour tous les composants

---

## 🎨 Code Quality

### 1. **TypeScript**
- ✅ Utiliser TypeScript strictement
- ✅ Définir des interfaces pour tous les objets
- ✅ Éviter `any` sauf cas exceptionnels
- ✅ Utiliser des types génériques quand approprié
- ✅ Documenter les types complexes

### 2. **Gestion des Erreurs**
- ✅ Gérer tous les cas d'erreur (404, 401, 422, 500, réseau)
- ✅ Afficher des messages d'erreur clairs pour l'utilisateur
- ✅ Logger les erreurs en développement uniquement
- ✅ Ne jamais exposer les détails techniques des erreurs à l'utilisateur
- ✅ Utiliser des messages d'erreur en français

### 3. **Performance**
- ✅ Utiliser `useMemo` pour les calculs coûteux
- ✅ Utiliser `useCallback` pour les fonctions passées en props
- ✅ Éviter les re-renders inutiles
- ✅ Implémenter la pagination côté client quand nécessaire
- ✅ Optimiser les requêtes API (pagination, cache)

### 4. **Réutilisabilité**
- ✅ Extraire les fonctions utilitaires dans `src/utils/`
- ✅ Créer des composants réutilisables
- ✅ Éviter la duplication de code (DRY)
- ✅ Utiliser des hooks personnalisés pour la logique réutilisable

---

## 🔄 Gestion des États

### 1. **États Locaux**
- ✅ Utiliser `useState` pour les états locaux simples
- ✅ Gérer les états de chargement (`isLoading`)
- ✅ Gérer les états d'erreur (`error`)
- ✅ Gérer les états vides (`isEmpty`)

### 2. **États Globaux**
- ✅ Utiliser Context API pour l'authentification
- ✅ Stocker les données utilisateur dans le contexte
- ✅ Éviter le prop drilling excessif

---

## 🌐 API et Requêtes

### 1. **Structure des Requêtes**
- ✅ Utiliser `apiClient` (instance Axios configurée)
- ✅ Gérer les headers d'authentification via intercepteurs
- ✅ Utiliser les méthodes HTTP appropriées (GET, POST, PUT, DELETE)
- ✅ Gérer les timeouts
- ✅ Gérer les erreurs réseau

### 2. **Format des Données**
- ✅ Utiliser `FormData` pour les uploads de fichiers
- ✅ Valider les données avant envoi
- ✅ Formater les données selon les exigences de l'API
- ✅ Gérer les réponses paginées correctement

### 3. **Gestion des Réponses**
- ✅ Vérifier la structure de la réponse API
- ✅ Gérer les différents formats de réponse
- ✅ Normaliser les données si nécessaire
- ✅ Valider les données reçues

---

## 🎯 UI/UX

### 1. **Feedback Utilisateur**
- ✅ Afficher des états de chargement
- ✅ Afficher des messages d'erreur clairs
- ✅ Afficher des messages de succès
- ✅ Utiliser des alertes pour les actions importantes
- ✅ Utiliser des modals pour les confirmations

### 2. **Accessibilité**
- ✅ Ajouter des attributs `alt` sur les images
- ✅ Utiliser des labels pour les formulaires
- ✅ Gérer le focus clavier
- ✅ Utiliser des couleurs contrastées

### 3. **Responsive Design**
- ✅ Utiliser Tailwind CSS pour le responsive
- ✅ Tester sur différents appareils
- ✅ Adapter l'UI pour mobile et desktop

---

## 🧪 Tests et Validation

### 1. **Validation des Données**
- ✅ Valider les données avant envoi à l'API
- ✅ Valider les données reçues de l'API
- ✅ Afficher des messages de validation clairs
- ✅ Utiliser des regex pour la validation

### 2. **Gestion des Erreurs de Validation**
- ✅ Gérer les erreurs 422 (validation)
- ✅ Afficher les erreurs de validation dans le formulaire
- ✅ Formater les messages d'erreur de l'API

---

## 📝 Documentation

### 1. **Commentaires**
- ✅ Documenter les fonctions complexes avec JSDoc
- ✅ Expliquer la logique métier importante
- ✅ Documenter les paramètres et retours de fonctions
- ✅ Utiliser des commentaires en français

### 2. **Code Self-Documenting**
- ✅ Utiliser des noms de variables et fonctions explicites
- ✅ Éviter les abréviations non évidentes
- ✅ Utiliser des noms en français pour l'UI
- ✅ Utiliser des noms en anglais pour le code

---

## 🚫 À ÉVITER

### 1. **Sécurité**
- ❌ Ne JAMAIS hardcoder les endpoints API
- ❌ Ne JAMAIS logger les tokens ou mots de passe
- ❌ Ne JAMAIS exposer les données sensibles dans les logs
- ❌ Ne JAMAIS commiter les fichiers `.env`

### 2. **Code**
- ❌ Ne JAMAIS mettre d'émojis dans les console.log
- ❌ Ne JAMAIS utiliser `any` sans justification
- ❌ Ne JAMAIS dupliquer le code
- ❌ Ne JAMAIS ignorer les erreurs silencieusement
- ❌ Ne JAMAIS laisser de code commenté non utilisé

### 3. **Performance**
- ❌ Ne JAMAIS charger toutes les données d'un coup
- ❌ Ne JAMAIS faire des requêtes API dans les boucles
- ❌ Ne JAMAIS oublier de nettoyer les effets (useEffect)
- ❌ Ne JAMAIS créer des fonctions dans le render

---

## 📌 Checklist avant chaque Implémentation

- [ ] Variables d'environnement utilisées pour les URLs API
- [ ] Service API créé avec gestion d'erreurs complète
- [ ] Types TypeScript définis pour toutes les données
- [ ] États de chargement, erreur et succès gérés
- [ ] Messages d'erreur en français et clairs
- [ ] Aucun log de données sensibles
- [ ] Aucun émoji dans les console.log
- [ ] Code réutilisable et DRY
- [ ] Performance optimisée (useMemo, useCallback)
- [ ] Documentation JSDoc pour les fonctions complexes
- [ ] Validation des données avant envoi
- [ ] Gestion des erreurs API complète
- [ ] UI responsive et accessible

---

## 🎯 Exemples de Bonnes Pratiques

### ✅ Bon Exemple - Service API
```typescript
/**
 * Récupérer un produit par son identifiant
 * @param productId - ID du produit
 * @returns Promise<Product> - Données du produit
 */
async getProductById(productId: string | number): Promise<Product> {
  if (!productId) {
    throw new Error("Identifiant produit manquant");
  }
  try {
    const response = await apiClient.get(`/produits/${productId}`);
    // Validation et traitement de la réponse
    return response.data;
  } catch (error: unknown) {
    // Gestion d'erreur appropriée
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Une erreur est survenue");
  }
}
```

### ✅ Bon Exemple - Composant React
```typescript
const [isLoading, setIsLoading] = useState<boolean>(true);
const [error, setError] = useState<string>("");
const [data, setData] = useState<Product | null>(null);

useEffect(() => {
  loadData();
}, [productId]);

const loadData = async () => {
  try {
    setIsLoading(true);
    setError("");
    const product = await productService.getProductById(productId);
    setData(product);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erreur inconnue";
    setError(message);
  } finally {
    setIsLoading(false);
  }
};
```

### ✅ Bon Exemple - Console Log (SANS émojis)
```typescript
if (import.meta.env.DEV) {
  console.log("Product loaded:", { id: product.id, libelle: product.libelle });
  console.warn("Validation error:", errorMessage);
  console.error("API error:", error);
}
```

### ❌ Mauvais Exemple - À ÉVITER
```typescript
// ❌ Hardcodé
const API_URL = "http://admin-api.proxymarketapp.com/api";

// ❌ Log avec émojis
console.log("📦 Product loaded:", product);

// ❌ Log de données sensibles
console.log("User password:", password);

// ❌ any partout
const data: any = await api.get("/data");

// ❌ Erreur ignorée
try {
  await api.get("/data");
} catch (error) {
  // Rien
}
```

---

## 📚 Ressources

- **Documentation TypeScript** : https://www.typescriptlang.org/docs/
- **Documentation React** : https://react.dev/
- **Documentation Axios** : https://axios-http.com/docs/intro
- **Documentation Tailwind CSS** : https://tailwindcss.com/docs

---

**Date de dernière mise à jour** : $(date)
**Version** : 1.0.0

---

## ⚠️ RAPPEL IMPORTANT

**NE JAMAIS OUBLIER** :
1. ✅ Toujours utiliser les bonnes pratiques énumérées
2. ❌ **NE JAMAIS mettre d'émojis dans les console.log**
3. ✅ Toujours valider et sécuriser le code
4. ✅ Toujours gérer les erreurs proprement
5. ✅ Toujours documenter le code complexe

