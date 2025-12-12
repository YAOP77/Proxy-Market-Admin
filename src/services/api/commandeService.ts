/**
 * Service API pour la gestion des commandes
 *
 * Gère les opérations liées aux commandes :
 * - Récupération de la liste des commandes avec pagination et recherche
 */

import apiClient from "./axiosConfig";

/**
 * Interface pour le client d'une commande
 */
export interface CommandeClient {
  id: string;
  nom: string | null;
  prenoms: string | null;
  email: string | null;
  contact1: string | null;
  contact2: string | null;
  status: number;
  latitude: string | null;
  longitude: string | null;
  adresse: string | null;
  location_name: string | null;
}

/**
 * Interface pour le livreur d'une commande
 */
export interface CommandeLivreur {
  id: string;
  nom: string | null;
  prenoms: string | null;
  email: string | null;
  contact1: string | null;
  contact2: string | null;
  status: number;
  latitude: string | null;
  longitude: string | null;
  adresse: string | null;
  location_name: string | null;
}

/**
 * Interface pour l'adresse de livraison
 */
export interface CommandeAdresseLivraison {
  id: string;
  latitude: string | null;
  longitude: string | null;
  adresse: string | null;
  location_name: string | null;
  adresse_detail: string | null;
  commune_id: string | null;
  commune: string | null;
  contact1: string | null;
  contact2: string | null;
}

/**
 * Interface pour le produit principal
 */
export interface CommandeProduit {
  id: string;
  libelle: string;
  photo_prymary: string | null;
}

/**
 * Interface pour un produit dans une commande détaillée
 */
export interface CommandeProduitDetail {
  id: string;
  libelle: string;
  valeur_poids?: string;
  unite_poids?: string;
  prix: string;
  prix_or?: number;
  quantite: number;
  total_prix: string;
  description?: string | null;
  categorie?: string | null;
  photo: string | null;
  photo_prymary?: string | null;
}

/**
 * Interface pour une commande - Structure réelle de l'API (liste)
 */
export interface Commande {
  id: string;
  numero: string;
  quantite: number;
  total: string; // Format: "1 100 FCFA"
  status: number;
  status_text: string;
  status_bg: string; // "primary" | "warning" | "success" | "danger"
  client: CommandeClient;
  livreur: CommandeLivreur | null;
  adresse_livraison: CommandeAdresseLivraison;
  primary_produit: CommandeProduit;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface pour les détails d'une commande - Structure réelle de l'API
 */
export interface CommandeDetail {
  id: string;
  numero: string;
  quantite: number;
  status: number;
  status_text: string;
  status_bg: string;
  frais_livraison?: string;
  frais_livraison_or?: number;
  soustotal?: string;
  soustotal_or?: number;
  total: string;
  total_or?: number;
  client: CommandeClient;
  livreur: CommandeLivreur | null;
  adresse_livraison: CommandeAdresseLivraison;
  modepaiement?: string | null;
  datecommande?: string;
  commande_details: CommandeProduitDetail[];
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown; // Pour gérer les champs supplémentaires
}

/**
 * Interface pour la réponse paginée des commandes - Structure réelle de l'API
 */
export interface CommandesResponse {
  data: Commande[];
  links: {
    first: string | null;
    last: string | null;
    prev: string | null;
    next: string | null;
  };
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

/**
 * Interface pour la réponse normalisée utilisée par les composants
 */
export interface NormalizedCommandesResponse {
  data: Commande[];
  meta: {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  };
}

/**
 * Récupère la liste des commandes avec pagination et recherche
 * @param page - Numéro de page (par défaut: 1)
 * @param search - Terme de recherche optionnel
 * @returns Promise avec les données paginées
 */
async function getCommandes(page: number = 1, search?: string): Promise<NormalizedCommandesResponse> {
  try {
    const params = new URLSearchParams();
    params.append("page", String(page));
    if (search && search.trim()) {
      params.append("search", search.trim());
    }

    const response = await apiClient.get<CommandesResponse | string>(`/commandes-index?${params.toString()}`);

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

    const apiResponse = response.data as CommandesResponse;

    // Normaliser la réponse au format attendu par les composants
    // L'API retourne { data, links, meta }
    return {
      data: Array.isArray(apiResponse.data) ? apiResponse.data : [],
      meta: {
        current_page: apiResponse.meta?.current_page || page,
        from: apiResponse.meta?.from || 0,
        last_page: apiResponse.meta?.last_page || 1,
        per_page: apiResponse.meta?.per_page || 0,
        to: apiResponse.meta?.to || 0,
        total: apiResponse.meta?.total || 0,
      },
    };
  } catch (error: unknown) {

    if (error instanceof Error) {
      throw new Error(error.message || "Erreur lors de la récupération des commandes");
    }

    throw new Error("Erreur lors de la récupération des commandes");
  }
}

/**
 * Récupère les détails d'une commande
 * @param commandeId - ID de la commande
 * @returns Promise avec les détails de la commande
 */
async function getCommandeDetail(commandeId: string): Promise<CommandeDetail> {
  try {
    const response = await apiClient.get<CommandeDetail | { data: CommandeDetail } | string>(`/commande-detail/${commandeId}`);

    // Vérifier si la réponse est une chaîne d'erreur
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

    // Vérifier que response.data existe
    if (!response.data || typeof response.data !== "object") {
      throw new Error("Structure de réponse inattendue de l'API");
    }

    // Gérer les différents formats de réponse
    const responseData = response.data as CommandeDetail | { data: CommandeDetail };
    
    // Si la réponse est wrappée dans { data: ... }
    if ("data" in responseData && responseData.data && typeof responseData.data === "object") {
      return responseData.data as CommandeDetail;
    }

    // Sinon, retourner directement
    return responseData as CommandeDetail;
  } catch (error: unknown) {

    if (error instanceof Error) {
      throw new Error(error.message || "Erreur lors de la récupération des détails de la commande");
    }

    throw new Error("Erreur lors de la récupération des détails de la commande");
  }
}

const commandeService = {
  getCommandes,
  getCommandeDetail,
};

export default commandeService;

