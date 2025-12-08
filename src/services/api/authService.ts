/**
 * Service d'authentification - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées à l'authentification :
 * - Connexion (login)
 * - Déconnexion (logout)
 * - Vérification du token
 */

import apiClient from "./axiosConfig";

/**
 * Interface pour les données de connexion
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Interface pour la réponse de connexion
 */
export interface LoginResponse {
  success: boolean;
  message?: string;
  data?: {
    token: string;
    user: {
      id: string;
      name: string;
      email: string;
      role?: string;
    };
    expiresIn?: number; // Durée de validité en secondes
  };
}

/**
 * Interface pour la réponse d'erreur de l'API
 */
export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Extrait le message d'erreur d'une réponse API de manière sécurisée
 * @param apiError - L'objet d'erreur de l'API
 * @returns Le message d'erreur sous forme de chaîne, ou une chaîne vide
 */
const extractErrorMessage = (apiError: any): string => {
  if (!apiError) {
    return "";
  }

  // Si c'est déjà une chaîne, la retourner directement
  if (typeof apiError === "string") {
    return apiError;
  }

  // Si c'est un objet, essayer d'extraire le message
  if (typeof apiError === "object") {
    // Essayer différentes propriétés communes pour les messages d'erreur
    if (apiError.message && typeof apiError.message === "string") {
      return apiError.message;
    }
    if (apiError.error && typeof apiError.error === "string") {
      return apiError.error;
    }
    if (apiError.msg && typeof apiError.msg === "string") {
      return apiError.msg;
    }
    // Si le message est un objet, essayer d'extraire un message récursivement
    if (apiError.message && typeof apiError.message === "object") {
      return extractErrorMessage(apiError.message);
    }
    if (apiError.error && typeof apiError.error === "object") {
      return extractErrorMessage(apiError.error);
    }
  }

  return "";
};

/**
 * Service d'authentification
 */
export const authService = {
  /**
   * Connexion d'un utilisateur
   * @param credentials - Email et mot de passe
   * @returns Promise<LoginResponse> - Réponse de l'API avec le token et les données utilisateur
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      const response = await apiClient.post<any>("/auth/login", credentials);
      
      // Adapter selon la structure de réponse de l'API
      // Si l'API retourne directement les données sans wrapper
      if (response.data.token) {
        const apiRole =
          response.data.user?.role ||
          response.data.role ||
          response.data.user?.type ||
          "guest";

        const formattedResponse = {
          success: true,
          data: {
            token: response.data.token,
            user: response.data.user || {
              id: response.data.id || response.data.userId,
              name: response.data.name || response.data.userName,
              email: credentials.email,
              role: apiRole,
            },
            expiresIn: response.data.expiresIn || response.data.expires_in,
          },
        };
        return formattedResponse;
      }
      
      // Si l'API retourne une structure avec success
      if (response.data.success && response.data.data) {
        return response.data;
      }
      
      // Si l'API retourne directement les données dans response.data
      if (response.data && typeof response.data === 'object') {
        return {
          success: true,
          data: response.data,
        };
      }
      
      // Structure par défaut
      return response.data;
    } catch (error: any) {
      // Gérer les erreurs de l'API avec des messages spécifiques
      if (error.response) {
        const apiError = error.response.data;
        const status = error.response.status;

        // Analyser les erreurs spécifiques pour déterminer si c'est l'email ou le mot de passe
        // Vérifier d'abord les erreurs de validation spécifiques
        if (apiError?.errors) {
          // Erreur spécifique pour l'email
          if (apiError.errors.email && Array.isArray(apiError.errors.email) && apiError.errors.email.length > 0) {
            throw new Error(apiError.errors.email[0]);
          }
          // Erreur spécifique pour le mot de passe
          if (apiError.errors.password && Array.isArray(apiError.errors.password) && apiError.errors.password.length > 0) {
            throw new Error(apiError.errors.password[0]);
          }
        }

        // Pour les erreurs 401/403, on ne peut pas déterminer si c'est l'email ou le mot de passe
        // On utilise un message générique mais informatif
        if (status === 401 || status === 403) {
          throw new Error("Email ou mot de passe incorrect");
        }

        // Analyser le message d'erreur pour déterminer le type d'erreur
        // Extraire le message de manière sécurisée pour éviter les erreurs
        const errorMessage = extractErrorMessage(apiError);
        const lowerErrorMessage = errorMessage.toLowerCase();

        // Vérifier si le message indique explicitement un problème avec l'email
        if (
          lowerErrorMessage.includes("email") ||
          lowerErrorMessage.includes("utilisateur") ||
          lowerErrorMessage.includes("user") ||
          lowerErrorMessage.includes("compte") ||
          lowerErrorMessage.includes("account") ||
          lowerErrorMessage.includes("not found") ||
          lowerErrorMessage.includes("introuvable") ||
          status === 404
        ) {
          throw new Error("Email incorrect");
        }

        // Vérifier si le message indique explicitement un problème avec le mot de passe
        if (
          lowerErrorMessage.includes("password") ||
          lowerErrorMessage.includes("mot de passe") ||
          lowerErrorMessage.includes("pwd")
        ) {
          throw new Error("Mot de passe incorrect");
        }

        // Si aucun pattern spécifique n'est trouvé, utiliser le message de l'API ou un message par défaut
        const finalMessage = errorMessage.trim() || `Erreur ${status}: ${error.response.statusText}` || "Erreur lors de la connexion";
        throw new Error(finalMessage);
      } else if (error.request) {
        // Vérifier si l'URL de l'API est configurée
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
        if (!apiBaseUrl) {
          throw new Error("Configuration API manquante. Veuillez contacter l'administrateur.");
        }
        
        const errorMessage = error.message || "";
        
        // Détecter les erreurs CORS en premier (priorité)
        const isCORSError = 
          errorMessage.includes("CORS") ||
          errorMessage.includes("cors") ||
          errorMessage.includes("preflight") ||
          errorMessage.includes("Access-Control") ||
          errorMessage.includes("blocked") ||
          errorMessage.includes("origin") ||
          errorMessage.includes("Redirect is not allowed");
        
        // Détecter les erreurs SSL/TLS
        const isSSLError = 
          errorMessage.includes("ERR_CERT") ||
          errorMessage.includes("CERT") ||
          errorMessage.includes("SSL") ||
          errorMessage.includes("TLS") ||
          errorMessage.includes("certificate") ||
          errorMessage.includes("common name");
        
        if (isCORSError) {
          const corsErrorMsg = import.meta.env.PROD
            ? "Erreur CORS: Le serveur API bloque les requêtes depuis cette origine. Cela peut être dû à une redirection HTTP vers HTTPS lors de la requête preflight. Veuillez contacter l'administrateur du serveur pour corriger la configuration CORS."
            : "Erreur CORS: Le serveur redirige probablement HTTP vers HTTPS lors de la requête preflight. Vérifiez que VITE_API_BASE_URL utilise HTTPS (pas HTTP) dans votre fichier .env.";
          throw new Error(corsErrorMsg);
        } else if (isSSLError) {
          const sslErrorMsg = import.meta.env.PROD
            ? "Erreur de certificat SSL: Le certificat du serveur API est invalide. Cela fonctionnait peut-être en local car vous aviez accepté une exception de sécurité, mais en production (HTTPS), le navigateur bloque automatiquement les certificats invalides. Veuillez contacter l'administrateur du serveur pour corriger le certificat SSL."
            : "Erreur de certificat SSL: Le certificat du serveur ne correspond pas au domaine. Veuillez contacter l'administrateur pour corriger le certificat SSL.";
          throw new Error(sslErrorMsg);
        }
        
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        // Détecter les erreurs CORS et SSL dans le message d'erreur
        const errorMessage = error.message || "";
        
        const isCORSError = 
          errorMessage.includes("CORS") ||
          errorMessage.includes("cors") ||
          errorMessage.includes("preflight") ||
          errorMessage.includes("Access-Control") ||
          errorMessage.includes("blocked") ||
          errorMessage.includes("origin") ||
          errorMessage.includes("Redirect is not allowed");
        
        const isSSLError = 
          errorMessage.includes("ERR_CERT") ||
          errorMessage.includes("CERT") ||
          errorMessage.includes("SSL") ||
          errorMessage.includes("TLS") ||
          errorMessage.includes("certificate") ||
          errorMessage.includes("common name");
        
        if (isCORSError) {
          const corsErrorMsg = import.meta.env.PROD
            ? "Erreur CORS: Le serveur API bloque les requêtes depuis cette origine. Cela peut être dû à une redirection HTTP vers HTTPS lors de la requête preflight. Veuillez contacter l'administrateur du serveur pour corriger la configuration CORS."
            : "Erreur CORS: Le serveur redirige probablement HTTP vers HTTPS lors de la requête preflight. Vérifiez que VITE_API_BASE_URL utilise HTTPS (pas HTTP) dans votre fichier .env.";
          throw new Error(corsErrorMsg);
        } else if (isSSLError) {
          const sslErrorMsg = import.meta.env.PROD
            ? "Erreur de certificat SSL: Le certificat du serveur API est invalide. Cela fonctionnait peut-être en local car vous aviez accepté une exception de sécurité, mais en production (HTTPS), le navigateur bloque automatiquement les certificats invalides. Veuillez contacter l'administrateur du serveur pour corriger le certificat SSL."
            : "Erreur de certificat SSL: Le certificat du serveur ne correspond pas au domaine. Veuillez contacter l'administrateur pour corriger le certificat SSL.";
          throw new Error(sslErrorMsg);
        }
        
        throw new Error(error.message || "Une erreur est survenue lors de la connexion");
      }
    }
  },

  /**
   * Déconnexion d'un utilisateur
   * @returns Promise<void>
   */
  async logout(): Promise<void> {
    try {
      // Appeler l'endpoint de déconnexion
      // Note: L'endpoint utilise un tiret, pas un slash (/auth-logout et non /auth/logout)
      await apiClient.post("/auth-logout");
    } catch (error) {
      // Même en cas d'erreur API (réseau, serveur, etc.), 
      // on continue le processus de déconnexion côté client
      // Ne pas logger les erreurs pour éviter d'exposer des informations sensibles
    }
  },

  /**
   * Vérifier la validité du token
   * @returns Promise<boolean> - true si le token est valide
   */
  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiClient.get("/auth/verify");
      return response.data.success === true;
    } catch (error) {
      return false;
    }
  },
};

export default authService;

