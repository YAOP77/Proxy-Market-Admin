# Guide de Configuration Google Maps API

## Problème : "Impossible de charger Google Maps correctement sur cette page"

Ce message d'erreur apparaît généralement pour les raisons suivantes :

### 1. ✅ Vérifier que la clé API est bien configurée

Votre fichier `.env` doit contenir :
```env
VITE_GOOGLE_MAPS_API_KEY=AIzaSyDhoBAAbW5Q53EkxL6JCrIq5mBo_Ak5uLI
```

**Important :**
- Pas de guillemets autour de la clé
- Pas de point-virgule à la fin
- Pas d'espaces avant ou après le signe `=`
- Redémarrer le serveur après modification du `.env`

### 2. ✅ Activer la facturation sur Google Cloud

**Obligatoire depuis 2018**, même pour les quotas gratuits :
1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionner votre projet
3. Aller dans **Facturation** (Billing)
4. Activer la facturation (une carte de crédit peut être demandée, mais vous ne serez pas facturé dans les limites du quota gratuit)

### 3. ✅ Activer l'API Maps JavaScript API

1. Aller sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionner votre projet
3. Aller dans **APIs & Services** > **Library**
4. Rechercher "Maps JavaScript API"
5. Cliquer sur **Enable** (Activer)

### 4. ✅ Vérifier les restrictions de la clé API

1. Aller dans **APIs & Services** > **Credentials**
2. Cliquer sur votre clé API
3. Vérifier la section **API restrictions** :
   - S'assurer que "Maps JavaScript API" est dans la liste des APIs autorisées
4. Vérifier la section **Application restrictions** :
   - Si "HTTP referrers (web sites)" est sélectionné, ajouter :
     - `http://localhost:5173/*`
     - `http://127.0.0.1:5173/*`
   - Ou temporairement définir sur "None" pour tester

### 5. ✅ Tester la clé API

**Méthode 1 : Test dans le navigateur**
Ouvrir cette URL dans votre navigateur (remplacer `YOUR_API_KEY` par votre clé) :
```
https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap
```

Si vous voyez du JavaScript, la clé fonctionne.
Si vous voyez une erreur, vérifier les étapes ci-dessus.

**Méthode 2 : Test avec curl**
```bash
curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"
```

### 6. ✅ Vérifier la console du navigateur

1. Ouvrir la page avec la carte
2. Appuyer sur **F12** pour ouvrir les outils de développement
3. Aller dans l'onglet **Console**
4. Chercher les erreurs liées à :
   - `maps.googleapis.com`
   - `Google Maps API`
   - `API key`
   - `billing`

### 7. ✅ Messages d'erreur courants

| Message d'erreur | Solution |
|-----------------|----------|
| "This API key is not authorized" | Activer "Maps JavaScript API" dans Google Cloud Console |
| "RefererNotAllowedMapError" | Ajouter `http://localhost:5173/*` dans les restrictions HTTP referrers |
| "BillingNotEnabledMapError" | Activer la facturation sur Google Cloud |
| "ApiNotActivatedMapError" | Activer "Maps JavaScript API" |
| "InvalidKeyMapError" | Vérifier que la clé API est correcte dans le fichier .env |

### 8. ✅ Vérifier les quotas

1. Aller dans **APIs & Services** > **Dashboard**
2. Vérifier que "Maps JavaScript API" est listée
3. Vérifier les quotas et limites

### 9. ✅ Redémarrer le serveur de développement

Après toute modification dans Google Cloud Console ou dans le fichier `.env` :
1. Arrêter le serveur (Ctrl+C)
2. Redémarrer avec `npm run dev`

### 10. ✅ Vérifier que la clé est bien chargée

Ajouter temporairement ce code dans `GoogleMapPicker.tsx` pour vérifier :
```typescript
console.log('Clé API chargée:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 'Oui' : 'Non');
```

## Résolution rapide

1. ✅ Vérifier que le fichier `.env` contient la clé API
2. ✅ Redémarrer le serveur de développement
3. ✅ Activer la facturation sur Google Cloud
4. ✅ Activer "Maps JavaScript API"
5. ✅ Vérifier les restrictions de la clé API (ajouter localhost si nécessaire)
6. ✅ Vérifier la console du navigateur (F12) pour les erreurs détaillées

## Support

Si le problème persiste après avoir vérifié tous les points ci-dessus :
1. Consulter la [documentation officielle Google Maps](https://developers.google.com/maps/documentation/javascript/error-messages)
2. Vérifier les [erreurs courantes](https://developers.google.com/maps/documentation/javascript/error-messages#common-errors)
3. Contacter le support Google Cloud si nécessaire


