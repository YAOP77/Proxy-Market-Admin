/**
 * Configuration Axios pour Proxy Market Dashboard
 * 
 * Ce fichier configure une instance axios avec :
 * - Base URL de l'API (depuis les variables d'environnement)
 * - Intercepteurs pour les requêtes/réponses
 * - Gestion automatique des tokens
 * - Gestion des erreurs centralisée
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";

// Configuration de l'API depuis les variables d'environnement
// Pour Vite, les variables doivent être préfixées par VITE_
// Note: Les fichiers .env ne doivent PAS avoir de guillemets ni de point-virgule
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Vérifier que la variable est définie
// if (!API_BASE_URL) {
//   throw new Error(
//     "VITE_API_BASE_URL n'est pas définie dans les variables d'environnement.\n" +
//     "Veuillez créer un fichier .env à la racine du projet avec:\n" +
//     "VITE_API_BASE_URL=http://admin-api.proxymarketapp.com/api\n\n" +
//     "IMPORTANT: Pas de guillemets, pas de point-virgule dans le fichier .env\n" +
//     "IMPORTANT: Redémarrez le serveur de développement après la création/modification du fichier .env"
//   );
// }

/**
 * Instance axios configurée pour l'application
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 secondes
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

/**
 * Intercepteur de requête : Ajoute le token d'authentification si disponible
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Récupérer le token depuis localStorage
    const authToken = localStorage.getItem("proxy_market_auth");
    
    if (authToken) {
      try {
        const tokenData = JSON.parse(authToken);
        if (tokenData.token) {
          // Ajouter le token dans les headers
          config.headers.Authorization = `Bearer ${tokenData.token}`;
        }
      } catch (error) {
        // Ne pas logger l'erreur pour éviter d'exposer des informations sensibles
        // Le token sera simplement ignoré si invalide
      }
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Intercepteur de réponse : Gère les erreurs globales
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Gestion des erreurs HTTP
    if (error.response) {
      const status = error.response.status;
      
      // Erreur 401 : Non autorisé (token invalide ou expiré)
      if (status === 401) {
        // Nettoyer le localStorage et rediriger vers la page de connexion
        localStorage.removeItem("proxy_market_auth");
        localStorage.removeItem("proxy_market_user");
        
        // Rediriger vers la page de connexion si on n'y est pas déjà
        if (window.location.pathname !== "/signin") {
          window.location.href = "/signin";
        }
      }
      
      // Erreur 403 : Accès interdit
      if (status === 403) {
        // Ne pas logger pour éviter d'exposer des informations sensibles
      }
      
      // Erreur 500 : Erreur serveur
      if (status >= 500) {
        // Ne pas logger error.response.data pour éviter d'exposer des informations sensibles
        if (import.meta.env.DEV) {
          console.error("Erreur serveur (code:", status + ")");
        }
      }
    } else if (error.request) {
      // La requête a été faite mais aucune réponse n'a été reçue
      // Ne pas logger error.request pour éviter d'exposer des informations sensibles
      if (import.meta.env.DEV) {
        console.error("Erreur réseau: Aucune réponse du serveur");
      }
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      // Ne pas logger error.message pour éviter d'exposer des informations sensibles
      if (import.meta.env.DEV) {
        console.error("Erreur de configuration de la requête");
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
