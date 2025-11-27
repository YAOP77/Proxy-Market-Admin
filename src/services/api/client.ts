/**
 * Client API pour Proxy Market Dashboard
 * 
 * Ce fichier prépare la structure pour l'intégration des API REST.
 * Le client sera implémenté lors de l'intégration des APIs.
 */

import { API_CONFIG } from "../../config/constants";
import type { ApiResponse, ApiError } from "../../types";

/**
 * Configuration du client API
 */
class ApiClient {
  constructor() {
    // Configuration pour utilisation future
    // Ces variables seront utilisées lors de l'implémentation complète du client API
    const _baseURL = API_CONFIG.baseURL;
    const _timeout = API_CONFIG.timeout;
    
    // Utilisation minimale pour éviter l'erreur TS6133
    void _baseURL;
    void _timeout;
  }

  /**
   * Méthode générique pour les requêtes GET
   * @param endpoint - Chemin de l'endpoint API
   * @param options - Options supplémentaires pour la requête
   */
  async get<T>(_endpoint: string, _options?: RequestInit): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes POST
   * @param endpoint - Chemin de l'endpoint API
   * @param data - Données à envoyer
   * @param options - Options supplémentaires pour la requête
   */
  async post<T>(
    _endpoint: string,
    _data?: unknown,
    _options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes PUT
   * @param endpoint - Chemin de l'endpoint API
   * @param data - Données à envoyer
   * @param options - Options supplémentaires pour la requête
   */
  async put<T>(
    _endpoint: string,
    _data?: unknown,
    _options?: RequestInit
  ): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Méthode générique pour les requêtes DELETE
   * @param endpoint - Chemin de l'endpoint API
   * @param options - Options supplémentaires pour la requête
   */
  async delete<T>(_endpoint: string, _options?: RequestInit): Promise<ApiResponse<T>> {
    // TODO: Implémenter lors de l'intégration des APIs
    throw new Error("API client not implemented yet");
  }

  /**
   * Gestion des erreurs API
   * @param error - Erreur à traiter
   * @private
   */
  // @ts-expect-error - Méthode réservée pour utilisation future
  private handleError(_error: unknown): ApiError {
    // TODO: Implémenter la gestion d'erreurs lors de l'intégration
    return {
      message: "Une erreur est survenue",
      status: 500,
    };
  }
}

/**
 * Instance singleton du client API
 */
export const apiClient = new ApiClient();

/**
 * Services API spécialisés (à créer selon les besoins)
 * Exemple:
 * export const userService = {
 *   getUsers: () => apiClient.get<User[]>('/users'),
 *   getUserById: (id: string) => apiClient.get<User>(`/users/${id}`),
 *   createUser: (user: Partial<User>) => apiClient.post<User>('/users', user),
 * };
 */
