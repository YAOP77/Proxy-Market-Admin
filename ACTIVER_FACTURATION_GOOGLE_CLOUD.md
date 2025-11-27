# Guide : Activer la Facturation sur Google Cloud

## ⚠️ Important
**La facturation est OBLIGATOIRE pour utiliser Google Maps API**, même si vous utilisez le quota gratuit (200$ par mois). Google ne vous facturera rien tant que vous restez dans les limites du quota gratuit.

## 📋 Étapes pour Activer la Facturation

### Étape 1 : Accéder à la Console Google Cloud
1. Allez sur : https://console.cloud.google.com/
2. Connectez-vous avec votre compte Google
3. Sélectionnez votre projet (ou créez-en un nouveau si nécessaire)

### Étape 2 : Accéder à la Section Facturation
1. Dans le menu de gauche, cliquez sur **"Facturation"** (Billing)
   - Si vous ne voyez pas "Facturation", cherchez l'icône ☰ (menu hamburger) en haut à gauche
   - Le menu peut être en anglais : cherchez **"Billing"**

### Étape 3 : Créer un Compte de Facturation
1. Si vous n'avez pas encore de compte de facturation, vous verrez un message comme :
   - "Vous n'avez aucun compte de facturation"
   - "No billing accounts"
2. Cliquez sur **"Créer un compte de facturation"** ou **"Create billing account"**
3. Remplissez le formulaire :
   - **Nom du compte** : Donnez un nom (ex: "Mon Projet Proxy Market")
   - **Pays/Région** : Sélectionnez votre pays
   - **Type de compte** : Sélectionnez "Individuel" (Individual) ou "Entreprise" (Business)
   - **Informations de facturation** :
     - Adresse
     - Ville
     - Code postal
     - Téléphone

### Étape 4 : Ajouter une Méthode de Paiement
1. Vous devrez ajouter une **carte de crédit** ou **carte de débit**
2. **Important** : 
   - Google ne prélever aucune somme tant que vous restez dans le quota gratuit
   - Le quota gratuit est de **200$ par mois** pour les APIs Maps
   - Vous pouvez définir des alertes de budget pour être notifié avant d'être facturé
   - Vous pouvez désactiver la facturation à tout moment

### Étape 5 : Lier le Compte de Facturation au Projet
1. Après avoir créé le compte de facturation, vous devrez le lier à votre projet
2. Sélectionnez votre projet dans le sélecteur de projet
3. Allez dans **"Facturation"** > **"Lier un compte de facturation"**
4. Sélectionnez le compte de facturation que vous venez de créer
5. Cliquez sur **"Lier"**

### Étape 6 : Vérifier que la Facturation est Activée
1. Dans la section **"Facturation"**, vous devriez voir :
   - Votre compte de facturation listé
   - Le statut "Actif" ou "Active"
   - Les informations de paiement

### Étape 7 : Activer l'API Maps JavaScript
1. Allez dans **"APIs & Services"** > **"Library"**
2. Recherchez **"Maps JavaScript API"**
3. Cliquez sur **"Enable"** (Activer)
4. Attendez quelques secondes que l'API soit activée

### Étape 8 : Vérifier les Restrictions de la Clé API
1. Allez dans **"APIs & Services"** > **"Credentials"**
2. Cliquez sur votre clé API
3. Vérifiez les restrictions :
   - **API restrictions** : "Maps JavaScript API" doit être dans la liste
   - **Application restrictions** : 
     - Si "HTTP referrers" est activé, ajoutez :
       - `http://localhost:5173/*`
       - `http://127.0.0.1:5173/*`
     - Ou définissez sur "None" pour tester

## 💡 Conseils de Sécurité

### Définir des Alertes de Budget
1. Allez dans **"Facturation"** > **"Budgets & alerts"**
2. Cliquez sur **"Create budget"**
3. Définissez un budget (ex: 1$ par mois)
4. Configurez les alertes pour être notifié avant d'atteindre le budget

### Limiter les APIs Activées
- N'activez que les APIs dont vous avez besoin
- Désactivez les APIs que vous n'utilisez plus

### Restreindre la Clé API
- Utilisez des restrictions HTTP referrers en production
- Limitez les APIs accessibles avec cette clé

## 🔄 Après Activation

1. **Rechargez la page** `/add-franchise` dans votre application
2. La carte Google Maps devrait maintenant se charger correctement
3. Si vous voyez encore une erreur, vérifiez :
   - Que l'API "Maps JavaScript API" est activée
   - Que les restrictions de la clé API permettent l'accès depuis localhost
   - Que le serveur de développement a été redémarré après modification du .env

## ❓ Questions Fréquentes

### Dois-je payer pour utiliser Google Maps ?
Non, vous avez un **quota gratuit de 200$ par mois**. Tant que vous restez dans cette limite, vous ne serez pas facturé.

### Que se passe-t-il si je dépasse le quota gratuit ?
Google vous facturera uniquement les requêtes au-delà du quota gratuit. Vous pouvez définir des alertes pour être notifié avant.

### Puis-je annuler la facturation plus tard ?
Oui, vous pouvez désactiver la facturation à tout moment dans Google Cloud Console. Cependant, les APIs Maps ne fonctionneront plus sans facturation active.

### Ma carte sera-t-elle débitée automatiquement ?
Non, Google vous enverra d'abord des alertes avant de vous facturer. Vous pouvez également définir des limites de budget.

## 📞 Support

Si vous rencontrez des problèmes :
1. Consultez la documentation Google Cloud : https://cloud.google.com/billing/docs
2. Contactez le support Google Cloud si nécessaire
3. Vérifiez la console du navigateur (F12) pour les messages d'erreur détaillés


