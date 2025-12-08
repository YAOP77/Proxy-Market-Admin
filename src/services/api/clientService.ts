/**
 * Service API pour la gestion des clients (utilisateurs)
 *
 * Gère les opérations liées aux clients :
 * - Récupération de la liste des clients avec pagination et recherche
 */

import apiClient from "./axiosConfig";

/**
 * Interface pour un client (utilisateur) - Structure réelle de l'API
 */
export interface Client {
  id: string;
  nom: string | null;
  prenoms: string | null;
  email: string | null;
  role: string;
  commune_id: string | null;
  photo: string | null;
  status: number;
  contact1: string | null;
  contact2: string | null;
  email_verified_at: string | null;
  condition_terme_utilisation: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
  latitude: string | null;
  longitude: string | null;
  adresse: string | null;
  location_name: string | null;
  location: string | null;
  boutique_id: string | null;
  created_by: string | null;
  etat: string | null;
}

/**
 * Interface pour la réponse paginée des clients - Structure réelle de l'API
 */
export interface ClientsResponse {
  current_page: number;
  data: Client[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * Récupère la liste des clients avec pagination et recherche
 * @param page - Numéro de page (par défaut: 1)
 * @param search - Terme de recherche optionnel
 * @returns Promise avec les données paginées
 */
/**
 * Interface pour la réponse normalisée utilisée par les composants
 */
export interface NormalizedClientsResponse {
  data: Client[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

async function getClients(page: number = 1, search?: string): Promise<NormalizedClientsResponse> {
  try {
    const params = new URLSearchParams();
    params.append("page", String(page));
    if (search && search.trim()) {
      params.append("search", search.trim());
    }

    const response = await apiClient.get<ClientsResponse | string>(`/clients?${params.toString()}`);

    // Vérifier si la réponse est une chaîne d'erreur (ex: "vous êtes pas connecté")
    if (typeof response.data === "string") {
      const responseString: string = response.data;
      const lowerResponse = responseString.toLowerCase();
      if (
        lowerResponse.includes("connecté") ||
        lowerResponse.includes("connecte") ||
        lowerResponse.includes("authentification") ||
        lowerResponse.includes("unauthorized")
      ) {
        throw new Error("Non authentifié. Veuillez vous reconnecter.");
      }
      throw new Error("Réponse inattendue de l'API");
    }

    // Vérifier que response.data existe et est un objet
    if (!response.data || typeof response.data !== "object") {
      throw new Error("Structure de réponse inattendue de l'API");
    }

    const apiResponse = response.data as ClientsResponse;

    // Normaliser la réponse au format attendu par les composants
    return {
      data: Array.isArray(apiResponse.data) ? apiResponse.data : [],
      meta: {
        current_page: apiResponse.current_page || page,
        from: apiResponse.from || 0,
        last_page: apiResponse.last_page || 1,
        per_page: apiResponse.per_page || 0,
        to: apiResponse.to || 0,
        total: apiResponse.total || 0,
      },
    };
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error("[ClientService] Erreur lors de la récupération des clients");
    }

    if (error instanceof Error) {
      throw new Error(error.message || "Erreur lors de la récupération des clients");
    }

    throw new Error("Erreur lors de la récupération des clients");
  }
}

const clientService = {
  getClients,
};

export default clientService;

