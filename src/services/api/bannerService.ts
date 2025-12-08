/**
 * Service API pour la gestion des bannières
 *
 * Gère les opérations liées aux bannières :
 * - Récupération des catégories de produits
 * - Création de bannières
 */

import apiClient from "./axiosConfig";

/**
 * Interface pour une catégorie de produit
 */
export interface Category {
  id: string;
  libelle: string;
  slug?: string;
  status?: number;
  created_at?: string;
  updated_at?: string;
}

/**
 * Interface pour les données de création d'une bannière
 */
export interface CreateBannerData {
  categorie: string; // ID de la catégorie
  titre1: string;
  btn_action: string;
  ordre: string | number;
  photo: File;
}

/**
 * Interface pour une bannière
 */
export interface Banner {
  id: string;
  titre1: string;
  titre2?: string;
  description1?: string;
  description2?: string;
  btn_action: string;
  ordre: string;
  slug: string;
  produit_id?: string;
  categorie_id: string;
  status: string;
  created_by: string;
  photo: string;
  created_at: string;
  updated_at: string;
}

/**
 * Interface pour la réponse de création de bannière (format complet avec msg, cls, retour)
 */
export interface CreateBannerResponse {
  msg?: string;
  cls?: string;
  retour?: number;
  banner: Banner;
}

/**
 * Récupère la liste des catégories de produits
 */
async function getCategories(): Promise<Category[]> {
  try {
    const response = await apiClient.get<Category[] | { data: Category[] }>("/get-categories");

    // Gérer les différents formats de réponse
    if (Array.isArray(response.data)) {
      return response.data;
    }

    if (response.data && Array.isArray((response.data as { data: Category[] }).data)) {
      return (response.data as { data: Category[] }).data;
    }

    return [];
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error("[BannerService] Erreur lors de la récupération des catégories");
    }

    if (error instanceof Error) {
      throw new Error(error.message || "Erreur lors de la récupération des catégories");
    }

    throw new Error("Erreur lors de la récupération des catégories");
  }
}

/**
 * Interface pour la reponse API (succes ou erreur)
 */
interface ApiResponse {
  msg?: string;
  cls?: string;
  retour?: number;
  banner?: Banner;
  error?: Record<string, string[]>;
}

/**
 * Cree une nouvelle banniere
 */
async function createBanner(data: CreateBannerData): Promise<CreateBannerResponse> {
  try {
    // Utiliser FormData pour l'upload de fichier
    const formData = new FormData();
    formData.append("categorie", data.categorie);
    formData.append("titre1", data.titre1);
    formData.append("btn_action", data.btn_action);
    formData.append("ordre", String(data.ordre));
    formData.append("photo", data.photo);
    
    // Ajouter les champs optionnels avec valeurs par defaut
    formData.append("titre2", "");
    formData.append("description1", "");
    formData.append("description2", "");
    formData.append("status", "1");

    const response = await apiClient.post<ApiResponse>("/banners", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Le backend peut retourner deux formats :
    // 1. Format complet : { msg, cls, retour, banner }
    // 2. Format simple : { banner }
    
    // Si la reponse contient une banniere, c'est un succes
    if (response.data.banner) {
      return {
        msg: response.data.msg || "Banniere creee avec succes",
        cls: response.data.cls || "success",
        retour: response.data.retour ?? 1,
        banner: response.data.banner,
      };
    }

    // Verifier si le backend indique une erreur logique (retour === 0)
    if (response.data.retour === 0) {
      const errorMessage = response.data.msg || "Erreur lors de la creation de la banniere";
      throw new Error(errorMessage);
    }

    // Si aucune banniere n'est retournee, c'est une erreur
    throw new Error(response.data.msg || "Erreur lors de la creation de la banniere");
  } catch (error: unknown) {
    // Gerer les erreurs de validation (422)
    if (
      typeof error === "object" &&
      error !== null &&
      "response" in error
    ) {
      const axiosError = error as { response?: { status?: number; data?: ApiResponse } };
      
      // Erreur de validation 422
      if (axiosError.response?.status === 422 && axiosError.response?.data?.error) {
        const validationErrors = axiosError.response.data.error;
        const firstErrorKey = Object.keys(validationErrors)[0];
        const firstErrorMessage = validationErrors[firstErrorKey]?.[0];
        
        if (firstErrorMessage) {
          throw new Error(firstErrorMessage);
        }
      }
      
      // Erreur logique du backend (retour === 0 avec code HTTP 200)
      if (axiosError.response?.data?.retour === 0) {
        throw new Error(axiosError.response.data.msg || "Erreur lors de la creation de la banniere");
      }
      
      // Si le backend retourne une erreur avec un message
      if (axiosError.response?.data?.msg) {
        throw new Error(axiosError.response.data.msg);
      }
    }

    // Si c'est deja une Error avec un message, la relancer
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Erreur lors de la creation de la banniere");
  }
}

/**
 * Interface pour la reponse paginee des bannieres
 */
export interface BannersResponse {
  data: Banner[];
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
 * Recupere la liste des bannieres avec pagination et recherche
 */
async function getBanners(page: number = 1, search?: string): Promise<BannersResponse> {
  try {
    const params = new URLSearchParams();
    params.append("page", String(page));
    if (search && search.trim()) {
      params.append("search", search.trim());
    }

    const response = await apiClient.get<BannersResponse | { data: Banner[]; meta?: BannersResponse["meta"] } | Banner[]>(`/banners?${params.toString()}`);

    // Gerer differents formats de reponse
    const responseData = response.data;

    // Si c'est deja le format attendu
    if (responseData && typeof responseData === "object" && "data" in responseData && "meta" in responseData) {
      return responseData as BannersResponse;
    }

    // Si c'est un tableau simple
    if (Array.isArray(responseData)) {
      return {
        data: responseData,
        meta: {
          current_page: page,
          from: 1,
          last_page: 1,
          per_page: responseData.length,
          to: responseData.length,
          total: responseData.length,
        },
      };
    }

    // Si c'est un objet avec data mais sans meta
    if (responseData && typeof responseData === "object" && "data" in responseData) {
      const dataArray = (responseData as { data: Banner[] }).data;
      return {
        data: Array.isArray(dataArray) ? dataArray : [],
        meta: (responseData as { meta?: BannersResponse["meta"] }).meta || {
          current_page: page,
          from: 1,
          last_page: 1,
          per_page: Array.isArray(dataArray) ? dataArray.length : 0,
          to: Array.isArray(dataArray) ? dataArray.length : 0,
          total: Array.isArray(dataArray) ? dataArray.length : 0,
        },
      };
    }

    // Format inattendu, retourner une structure vide
    return {
      data: [],
      meta: {
        current_page: page,
        from: 0,
        last_page: 1,
        per_page: 0,
        to: 0,
        total: 0,
      },
    };
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.error("[BannerService] Erreur lors de la recuperation des bannieres");
    }

    if (error instanceof Error) {
      throw new Error(error.message || "Erreur lors de la recuperation des bannieres");
    }

    throw new Error("Erreur lors de la recuperation des bannieres");
  }
}

const bannerService = {
  getCategories,
  createBanner,
  getBanners,
};

export default bannerService;

