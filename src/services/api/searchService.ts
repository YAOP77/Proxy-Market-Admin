/**
 * Service de recherche globale - Proxy Market Dashboard
 * 
 * Ce service gère la recherche dans tous les types de ressources :
 * - Produits
 * - Boutiques
 * - Franchisés (BoutiqueUsers)
 * - Admins
 */

import apiClient from "./axiosConfig";
import productService, { Product } from "./productService";
import franchiseService, { Boutique } from "./franchiseService";
import boutiqueUserService, { BoutiqueUser } from "./boutiqueUserService";
import { Admin } from "./adminService";

/**
 * Interface pour un résultat de recherche
 */
export interface SearchResult {
  id: string;
  type: "product" | "boutique" | "franchise" | "admin";
  title: string;
  subtitle?: string;
  description?: string;
  url: string;
  metadata?: Record<string, unknown>;
}

/**
 * Interface pour les résultats de recherche groupés par type
 */
export interface GroupedSearchResults {
  products: SearchResult[];
  boutiques: SearchResult[];
  franchises: SearchResult[];
  admins: SearchResult[];
  total: number;
}

/**
 * Normalise une chaîne de caractères pour la recherche
 * - Trim les espaces
 * - Convertit en minuscules
 * - Supprime les accents (diacritiques)
 * @param str - Chaîne à normaliser
 * @returns Chaîne normalisée
 */
const normalizeSearchString = (str: string): string => {
  if (!str || typeof str !== "string") {
    return "";
  }
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD") // Décompose les caractères accentués
    .replace(/[\u0300-\u036f]/g, ""); // Supprime les diacritiques (accents)
};

/**
 * Vérifie si un texte contient un terme de recherche (insensible à la casse et aux accents)
 * @param text - Texte dans lequel chercher
 * @param searchTerm - Terme de recherche normalisé
 * @returns true si le texte contient le terme de recherche
 */
const textContainsSearchTerm = (text: string | null | undefined, searchTerm: string): boolean => {
  if (!text || !searchTerm) {
    return false;
  }
  const normalizedText = normalizeSearchString(text);
  return normalizedText.includes(searchTerm);
};

/**
 * Service de recherche globale
 */
const searchService = {
  /**
   * Recherche globale dans tous les types de ressources
   * @param query - Terme de recherche
   * @returns Promise avec les résultats groupés par type
   */
  async globalSearch(query: string): Promise<GroupedSearchResults> {
    if (!query || query.trim().length === 0) {
      return {
        products: [],
        boutiques: [],
        franchises: [],
        admins: [],
        total: 0,
      };
    }

    // Normaliser le terme de recherche une seule fois (minuscules + suppression accents)
    const normalizedSearchTerm = normalizeSearchString(query);
    const results: GroupedSearchResults = {
      products: [],
      boutiques: [],
      franchises: [],
      admins: [],
      total: 0,
    };

    // Recherche en parallèle dans tous les types
    const [productsResults, boutiquesResults, franchisesResults, adminsResults] = await Promise.allSettled([
      this.searchProducts(normalizedSearchTerm),
      this.searchBoutiques(normalizedSearchTerm),
      this.searchFranchises(normalizedSearchTerm),
      this.searchAdmins(normalizedSearchTerm),
    ]);

    // Traiter les résultats des produits
    if (productsResults.status === "fulfilled") {
      results.products = productsResults.value;
    } else if (import.meta.env.DEV) {
      console.error("Erreur recherche produits:", productsResults.reason);
    }

    // Traiter les résultats des boutiques
    if (boutiquesResults.status === "fulfilled") {
      results.boutiques = boutiquesResults.value;
    } else if (import.meta.env.DEV) {
      console.error("Erreur recherche boutiques:", boutiquesResults.reason);
    }

    // Traiter les résultats des franchisés
    if (franchisesResults.status === "fulfilled") {
      results.franchises = franchisesResults.value;
    } else if (import.meta.env.DEV) {
      console.error("Erreur recherche franchisés:", franchisesResults.reason);
    }

    // Traiter les résultats des admins
    if (adminsResults.status === "fulfilled") {
      results.admins = adminsResults.value;
    } else if (import.meta.env.DEV) {
      console.error("Erreur recherche admins:", adminsResults.reason);
    }

    results.total = results.products.length + results.boutiques.length + results.franchises.length + results.admins.length;

    return results;
  },

  /**
   * Recherche dans les produits
   * @param searchTerm - Terme de recherche normalisé (déjà en minuscules, sans accents)
   * @returns Promise avec les résultats de recherche de produits
   */
  async searchProducts(searchTerm: string): Promise<SearchResult[]> {
    try {
      // Le searchTerm est déjà normalisé, mais on l'envoie aussi normalisé à l'API
      const url = `/produits?page=1&search=${encodeURIComponent(searchTerm)}`;
      const response = await apiClient.get<unknown>(url);

      if (!response.data) {
        // Si l'API ne retourne rien, utiliser directement le fallback
        return this.searchProductsFallback(searchTerm);
      }

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
        // Si l'API retourne une chaîne d'erreur, utiliser le fallback
        return this.searchProductsFallback(searchTerm);
      }

      // L'API retourne les données dans différentes structures
      const responseData = response.data as Record<string, unknown>;

      // Si la réponse est paginée avec structure { data: [...], meta: {...} }
      let products: Product[] = [];
      if (responseData.data && Array.isArray(responseData.data)) {
        products = responseData.data as Product[];
      } else if (Array.isArray(responseData)) {
        products = responseData as Product[];
      }

      // Filtrer les produits côté client pour s'assurer qu'ils correspondent vraiment au terme de recherche
      const filteredProducts = products.filter((product) => {
        return (
          textContainsSearchTerm(product.libelle, searchTerm) ||
          textContainsSearchTerm(product.description, searchTerm) ||
          textContainsSearchTerm(product.categorie_name, searchTerm)
        );
      });

      // Si aucun résultat après filtrage, utiliser le fallback pour une recherche plus exhaustive
      if (filteredProducts.length === 0) {
        return this.searchProductsFallback(searchTerm);
      }

      // Convertir en résultats de recherche (limiter à 10 résultats)
      return filteredProducts.slice(0, 10).map((product) => ({
        id: String(product.id),
        type: "product" as const,
        title: product.libelle || "Produit sans nom",
        subtitle: product.categorie_name || undefined,
        description: product.description || undefined,
        url: `/products/${product.id}`,
        metadata: {
          prix_vente_normale: product.prix_vente_normale,
          status: product.status,
        },
      }));
    } catch (error: unknown) {
      // En cas d'erreur, utiliser le fallback
      if (import.meta.env.DEV) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la recherche de produits via API:", errorMessage);
      }
      return this.searchProductsFallback(searchTerm);
    }
  },

  /**
   * Fallback pour la recherche de produits (filtrage côté client)
   * Récupère plusieurs pages de produits et filtre côté client
   * @param searchTerm - Terme de recherche normalisé (déjà en minuscules, sans accents)
   * @returns Promise avec les résultats de recherche de produits
   */
  async searchProductsFallback(searchTerm: string): Promise<SearchResult[]> {
    try {
      const allProducts: Product[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxPages = 10; // Récupérer jusqu'à 10 pages pour une recherche exhaustive

      // Récupérer plusieurs pages de produits
      while (hasMorePages && currentPage <= maxPages) {
        try {
          const response = await productService.getProducts(currentPage);
          allProducts.push(...response.data);

          if (response.meta.current_page >= response.meta.last_page) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        } catch (pageError: unknown) {
          // En cas d'erreur sur une page, arrêter la récupération
          if (import.meta.env.DEV) {
            const errorMessage = pageError instanceof Error ? pageError.message : "Erreur inconnue";
            console.error(`Erreur lors de la récupération de la page ${currentPage}:`, errorMessage);
          }
          hasMorePages = false;
        }
      }

      // Filtrer les produits qui correspondent au terme de recherche
      const filtered = allProducts.filter((product) => {
        return (
          textContainsSearchTerm(product.libelle, searchTerm) ||
          textContainsSearchTerm(product.description, searchTerm) ||
          textContainsSearchTerm(product.categorie_name, searchTerm)
        );
      });

      // Convertir en résultats de recherche (limiter à 10 résultats)
      return filtered.slice(0, 10).map((product) => ({
        id: String(product.id),
        type: "product" as const,
        title: product.libelle || "Produit sans nom",
        subtitle: product.categorie_name || undefined,
        description: product.description || undefined,
        url: `/products/${product.id}`,
        metadata: {
          prix_vente_normale: product.prix_vente_normale,
          status: product.status,
        },
      }));
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la recherche de produits (fallback):", errorMessage);
      }
      return [];
    }
  },

  /**
   * Recherche dans les boutiques
   * @param searchTerm - Terme de recherche
   * @returns Promise avec les résultats de recherche de boutiques
   */
  async searchBoutiques(searchTerm: string): Promise<SearchResult[]> {
    try {
      // Essayer d'utiliser l'endpoint avec le paramètre search
      const url = `/boutiques?page=1&search=${encodeURIComponent(searchTerm)}&per_page=10`;
      const response = await apiClient.get<unknown>(url);

      if (!response.data) {
        return [];
      }

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
        // Si l'endpoint ne supporte pas search, fallback sur getAllBoutiques
        return this.searchBoutiquesFallback(searchTerm);
      }

      // L'API retourne les données dans différentes structures
      const responseData = response.data as Record<string, unknown>;

      // Si la réponse est paginée avec structure { data: [...], meta: {...} }
      let boutiques: Boutique[] = [];
      if (responseData.data && Array.isArray(responseData.data)) {
        boutiques = responseData.data as Boutique[];
      } else if (Array.isArray(responseData)) {
        boutiques = responseData as Boutique[];
      }

      // Convertir en résultats de recherche
      return boutiques.slice(0, 10).map((boutique) => ({
        id: boutique.id,
        type: "boutique" as const,
        title: boutique.name || "Boutique sans nom",
        subtitle: boutique.email || undefined,
        description: boutique.adresse || undefined,
        url: `/boutiques/${boutique.id}`,
        metadata: {
          status: boutique.status,
          commune_id: boutique.commune_id,
        },
      }));
    } catch (error: unknown) {
      // En cas d'erreur, utiliser le fallback
      return this.searchBoutiquesFallback(searchTerm);
    }
  },

  /**
   * Fallback pour la recherche de boutiques (filtrage côté client)
   * @param searchTerm - Terme de recherche
   * @returns Promise avec les résultats de recherche de boutiques
   */
  async searchBoutiquesFallback(searchTerm: string): Promise<SearchResult[]> {
    try {
      // Récupérer toutes les boutiques et filtrer côté client
      const allBoutiques = await franchiseService.getAllBoutiques();

      // Filtrer les boutiques qui correspondent au terme de recherche
      const filtered = allBoutiques.filter((boutique) => {
        const name = (boutique.name || "").toLowerCase();
        const email = (boutique.email || "").toLowerCase();
        const adresse = (boutique.adresse || "").toLowerCase();
        return name.includes(searchTerm) || email.includes(searchTerm) || adresse.includes(searchTerm);
      });

      // Convertir en résultats de recherche
      return filtered.slice(0, 10).map((boutique) => ({
        id: boutique.id,
        type: "boutique" as const,
        title: boutique.name || "Boutique sans nom",
        subtitle: boutique.email || undefined,
        description: boutique.adresse || undefined,
        url: `/boutiques/${boutique.id}`,
        metadata: {
          status: boutique.status,
          commune_id: boutique.commune_id,
        },
      }));
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        // Logger uniquement le message, pas l'objet complet pour éviter d'exposer des informations sensibles
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la recherche de boutiques (fallback):", errorMessage);
      }
      return [];
    }
  },

  /**
   * Recherche dans les franchisés
   * @param searchTerm - Terme de recherche
   * @returns Promise avec les résultats de recherche de franchisés
   */
  async searchFranchises(searchTerm: string): Promise<SearchResult[]> {
    try {
      // Récupérer toutes les boutiques pour obtenir leurs franchisés
      const allBoutiques = await franchiseService.getAllBoutiques();
      const allFranchises: Array<BoutiqueUser & { boutiqueId: string }> = [];

      // Récupérer les franchisés de chaque boutique et garder trace de la boutique_id
      for (const boutique of allBoutiques.slice(0, 20)) {
        try {
          const response = await boutiqueUserService.getBoutiqueUsers(boutique.id, 1);
          // Ajouter boutiqueId à chaque franchisé
          const franchisesWithBoutiqueId = response.data.map((franchise) => ({
            ...franchise,
            boutiqueId: boutique.id,
          }));
          allFranchises.push(...franchisesWithBoutiqueId);
        } catch {
          // Ignorer les erreurs pour une boutique spécifique
        }
      }

      // Filtrer les franchisés qui correspondent au terme de recherche
      const filtered = allFranchises.filter((franchise) => {
        return (
          textContainsSearchTerm(franchise.nom, searchTerm) ||
          textContainsSearchTerm(franchise.prenoms, searchTerm) ||
          textContainsSearchTerm(`${franchise.prenoms || ""} ${franchise.nom || ""}`, searchTerm) ||
          textContainsSearchTerm(franchise.email, searchTerm) ||
          textContainsSearchTerm(franchise.contact_1, searchTerm) ||
          textContainsSearchTerm(franchise.contact_2, searchTerm)
        );
      });

      // Convertir en résultats de recherche avec boutique_id dans l'URL
      return filtered.slice(0, 10).map((franchise) => {
        const boutiqueId = franchise.boutiqueId || "";
        const url = boutiqueId
          ? `/boutique-user/${franchise.id}?boutique_id=${encodeURIComponent(boutiqueId)}`
          : `/boutique-user/${franchise.id}`;

        return {
          id: String(franchise.id),
          type: "franchise" as const,
          title: `${franchise.prenoms || ""} ${franchise.nom || ""}`.trim() || "Franchisé sans nom",
          subtitle: franchise.email || franchise.contact_1 || undefined,
          description: undefined,
          url,
          metadata: {
            status: franchise.status,
            boutique_id: boutiqueId,
          },
        };
      });
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        // Logger uniquement le message, pas l'objet complet pour éviter d'exposer des informations sensibles
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la recherche de franchisés:", errorMessage);
      }
      return [];
    }
  },

  /**
   * Recherche dans les admins
   * @param searchTerm - Terme de recherche
   * @returns Promise avec les résultats de recherche d'admins
   */
  async searchAdmins(searchTerm: string): Promise<SearchResult[]> {
    try {
      // Utiliser l'endpoint de recherche de l'API
      const url = `/admins?page=1&search=${encodeURIComponent(searchTerm)}&per_page=10`;
      const response = await apiClient.get<unknown>(url);

      if (!response.data) {
        return [];
      }

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
        return [];
      }

      // L'API retourne les données dans différentes structures
      const responseData = response.data as Record<string, unknown>;

      // Si la réponse est paginée avec structure { data: [...], meta: {...} }
      let admins: Admin[] = [];
      if (responseData.data && Array.isArray(responseData.data)) {
        admins = responseData.data as Admin[];
      } else if (Array.isArray(responseData)) {
        admins = responseData as Admin[];
      }

      // Convertir en résultats de recherche
      return admins.slice(0, 10).map((admin) => ({
        id: String(admin.id),
        type: "admin" as const,
        title: `${admin.prenoms || ""} ${admin.nom || ""}`.trim() || "Admin sans nom",
        subtitle: admin.email || undefined,
        description: admin.role || undefined,
        url: `/admins/${admin.id}`,
        metadata: {
          role: admin.role,
          status: admin.status,
        },
      }));
    } catch (error: unknown) {
      if (import.meta.env.DEV) {
        // Logger uniquement le message, pas l'objet complet pour éviter d'exposer des informations sensibles
        const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
        console.error("Erreur lors de la recherche d'admins:", errorMessage);
      }
      return [];
    }
  },
};

export default searchService;

