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
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Normaliser l'URL : forcer HTTPS si HTTP est détecté (pour éviter les erreurs CORS de redirection)
if (API_BASE_URL && typeof API_BASE_URL === "string") {
  // Si l'URL commence par http://, la remplacer par https://
  if (API_BASE_URL.startsWith("http://")) {
    API_BASE_URL = API_BASE_URL.replace("http://", "https://");
    if (import.meta.env.DEV) {
      console.warn("[AxiosConfig] URL HTTP détectée, conversion automatique en HTTPS pour éviter les erreurs CORS");
    }
  }
  // S'assurer que l'URL se termine par /api si elle ne contient pas déjà /api
  if (!API_BASE_URL.includes("/api")) {
    API_BASE_URL = API_BASE_URL.endsWith("/") ? API_BASE_URL + "api" : API_BASE_URL + "/api";
  }
}

// Debug en développement : Afficher uniquement si l'URL est configurée (sans exposer l'URL complète)
if (import.meta.env.DEV) {
  if (API_BASE_URL) {
    // Ne logger que l'information que l'URL est configurée, pas l'URL complète
    console.log("[AxiosConfig] URL API configurée");
  } else {
    console.warn("[AxiosConfig] URL API non configurée");
  }
}

// Vérifier que la variable est définie
if (!API_BASE_URL) {
  const errorMessage = import.meta.env.PROD
    ? "Configuration API manquante. Veuillez contacter l'administrateur."
    : "VITE_API_BASE_URL n'est pas définie dans les variables d'environnement.\n" +
      "Veuillez créer un fichier .env à la racine du projet avec:\n" +
      "VITE_API_BASE_URL=https://admin-api.proxymarketapp.com/api\n\n" +
      "IMPORTANT: Utilisez HTTPS (pas HTTP) pour éviter les erreurs CORS\n" +
      "IMPORTANT: Pas de guillemets, pas de point-virgule dans le fichier .env\n" +
      "IMPORTANT: Redémarrez le serveur de développement après la création/modification du fichier .env";
  
  console.error("Erreur de configuration API:", errorMessage);
  
  // En production, on ne bloque pas l'application mais on affiche un message d'erreur
  if (import.meta.env.PROD) {
    console.error("Pour corriger: Configurez VITE_API_BASE_URL dans Vercel Dashboard > Settings > Environment Variables");
  }
}

/**
 * Instance axios configurée pour l'application
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL || "", // Utiliser une chaîne vide si non définie pour éviter les erreurs
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
      // Vérifier si c'est dû à une URL manquante
      if (!API_BASE_URL) {
        if (import.meta.env.PROD) {
          console.error("VITE_API_BASE_URL n'est pas configurée sur Vercel");
          console.error("Solution: Vercel Dashboard > Settings > Environment Variables > Ajouter VITE_API_BASE_URL");
        }
      }
      
      // Détecter les erreurs CORS
      const errorMessage = error.message || "";
      const isCORSError = 
        errorMessage.includes("CORS") ||
        errorMessage.includes("cors") ||
        errorMessage.includes("preflight") ||
        errorMessage.includes("Access-Control") ||
        errorMessage.includes("blocked") ||
        errorMessage.includes("origin");
      
      // Détecter les erreurs SSL/TLS
      const isSSLError = 
        errorMessage.includes("ERR_CERT") ||
        errorMessage.includes("CERT") ||
        errorMessage.includes("SSL") ||
        errorMessage.includes("TLS") ||
        errorMessage.includes("certificate") ||
        errorMessage.includes("common name");
      
      if (isCORSError) {
        const corsErrorMessage = import.meta.env.PROD
          ? "Erreur CORS: Le serveur API bloque les requêtes depuis cette origine. Veuillez contacter l'administrateur."
          : "Erreur CORS détectée: Le serveur redirige probablement HTTP vers HTTPS lors de la requête preflight";
        
        console.error(corsErrorMessage);
        
        if (import.meta.env.DEV) {
          console.error("Erreur CORS détectée");
          console.error("Solutions possibles:");
          console.error("1. Vérifier que VITE_API_BASE_URL utilise HTTPS (pas HTTP)");
          console.error("2. Le serveur pourrait rediriger HTTP vers HTTPS, ce qui cause l'erreur CORS");
          console.error("3. Vérifier la configuration CORS du serveur backend");
          console.error("4. S'assurer que l'URL de base se termine par /api");
        }
      } else if (isSSLError) {
        const sslErrorMessage = import.meta.env.PROD
          ? "Erreur SSL: Le certificat du serveur API est invalide. Veuillez contacter l'administrateur."
          : "Erreur SSL détectée: Le certificat SSL du serveur ne correspond pas au domaine";
        
        console.error(sslErrorMessage);
        
        if (import.meta.env.DEV) {
          console.error("Erreur SSL détectée");
          console.error("Solutions possibles:");
          console.error("1. Vérifier que le certificat SSL est valide pour le domaine");
          console.error("2. Le certificat pourrait être valide pour un autre domaine");
          console.error("3. En local, vous avez peut-être accepté une exception de sécurité - cela ne fonctionne pas en production");
          console.error("4. Contacter l'administrateur du serveur pour corriger le certificat SSL");
        }
      }
      
      // Ne pas logger error.request pour éviter d'exposer des informations sensibles
      if (import.meta.env.DEV) {
        console.error("Erreur réseau: Aucune réponse du serveur", !API_BASE_URL ? "(URL API non configurée)" : isCORSError ? "(Erreur CORS)" : isSSLError ? "(Erreur SSL)" : "");
      }
    } else {
      // Une erreur s'est produite lors de la configuration de la requête
      const errorMessage = error.message || "";
      
      // Détecter les erreurs CORS
      const isCORSError = 
        errorMessage.includes("CORS") ||
        errorMessage.includes("cors") ||
        errorMessage.includes("preflight") ||
        errorMessage.includes("Access-Control") ||
        errorMessage.includes("blocked") ||
        errorMessage.includes("origin");
      
      // Détecter les erreurs SSL dans le message d'erreur
      const isSSLError = 
        errorMessage.includes("ERR_CERT") ||
        errorMessage.includes("CERT") ||
        errorMessage.includes("SSL") ||
        errorMessage.includes("TLS") ||
        errorMessage.includes("certificate") ||
        errorMessage.includes("common name");
      
      if (isCORSError) {
        if (import.meta.env.DEV) {
          console.error("Erreur CORS détectée dans la configuration de la requête");
          console.error("Le serveur bloque probablement les requêtes preflight ou redirige HTTP vers HTTPS");
          console.error("Solution: Vérifier que VITE_API_BASE_URL utilise HTTPS");
        }
      } else if (isSSLError) {
        if (import.meta.env.DEV) {
          console.error("Erreur SSL détectée dans la configuration de la requête");
          console.error("Le certificat SSL du serveur ne correspond pas au domaine utilisé");
        }
      }
      
      // Ne pas logger error.message pour éviter d'exposer des informations sensibles
      if (import.meta.env.DEV) {
        console.error("Erreur de configuration de la requête", !API_BASE_URL ? "(URL API non configurée)" : isCORSError ? "(Erreur CORS)" : isSSLError ? "(Erreur SSL)" : "");
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
