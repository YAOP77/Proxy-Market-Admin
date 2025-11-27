/**
 * Service de gestion des produits vivriers - Proxy Market Dashboard
 * 
 * Ce service gère toutes les opérations liées aux produits vivriers :
 * - Création d'un produit vivrier
 * - Récupération de la liste des produits
 */

import apiClient from "./axiosConfig";
import { formatApiErrorMessage } from "../../utils/apiErrorUtils";

/**
 * Interface pour les données de création de produit vivrier
 */
export interface CreateProductData {
  libelle: string;
  unite_poids: string;
  valeur_poids: number;
  categorie: string;
  prix_achat: number;
  prix_vente_normale: number;
  prix_vente_reduit: number;
  description: string;
  status: string;
  photos: File[]; // Tableau de fichiers images
}

/**
 * Interface pour les données de modification de produit vivrier
 */
export interface ExistingProductPhotoPayload {
  id: string;
  is_primary: 0 | 1;
}

export interface UpdateProductData {
  libelle: string;
  unite_poids: string;
  valeur_poids: number;
  categorie_id: string;
  prix_achat: number;
  prix_vente_normale: number;
  prix_vente_reduit: number;
  description: string;
  status: string;
  photos?: File[]; // Tableau de fichiers images (optionnel pour la modification)
  existingPhotos?: ExistingProductPhotoPayload[];
}

/**
 * Interface pour la réponse de création de produit
 */
export interface CreateProductResponse {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

/**
 * Interface pour une catégorie de produit
 */
export interface Category {
  id: string | number;
  libelle: string;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Interface pour un produit vivrier
 */
export interface Product {
  id: string | number;
  libelle: string;
  unite_poids: string;
  valeur_poids: number | string;
  categorie_id?: string | number;
  categorie?: string | Category;
  categorie_name?: string; // Nom de la catégorie retourné par l'API
  prix_achat: number | string;
  prix_vente_normale: number | string;
  prix_vente_reduit: number | string;
  description?: string;
  status: number | string;
  status_text?: string;
  photo_prymary?: string; // Photo principale (ancienne structure)
  all_photos?: Array<{
    id?: string | number;
    photo?: string;
    url?: string;
    is_primary?: number | string;
    [key: string]: any;
  }>; // Tableau de toutes les photos retourné par l'API
  photos?: Array<{
    id?: string | number;
    photo?: string;
    url?: string;
    path?: string;
    image?: string;
    is_primary?: number | string;
    [key: string]: any; // Pour permettre d'autres propriétés de l'API
  }>;
  created_at?: string;
  updated_at?: string;
  [key: string]: any; // Pour permettre d'autres propriétés de l'API
}

/**
 * Interface pour une réponse paginée de l'API
 */
export interface PaginatedResponse<T> {
  data: T[];
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
    path: string;
    per_page: number;
    to: number;
    total: number;
  };
}

/**
 * Service de gestion des produits vivriers
 */
const productService = {

  /**
   * Récupérer la liste des catégories
   * @returns Promise<Category[]> - Liste des catégories
   */
  async getCategories(): Promise<Category[]> {
    try {
      const response = await apiClient.get<any>("/get-categories");
      
      // L'API retourne directement un tableau d'objets avec id et libelle
      if (Array.isArray(response.data)) {
        return response.data;
      }
      
      // Si l'API retourne les données dans un wrapper
      if (response.data.data && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      
      // Retourner un tableau vide si la structure n'est pas reconnue
      return [];
    } catch (error: any) {
      // En cas d'erreur, retourner un tableau vide pour ne pas bloquer le formulaire
      // Les catégories pourront être ajoutées manuellement si nécessaire
      return [];
    }
  },
  /**
   * Créer un nouveau produit vivrier
   * 
   * @param productData - Données du produit à créer
   * @returns Promise avec la réponse de l'API
   */
  async createProduct(productData: CreateProductData): Promise<CreateProductResponse> {
    try {
      // Validation des données avant l'envoi
      if (!productData.photos || productData.photos.length === 0) {
        throw new Error("Au moins une image est requise pour créer un produit");
      }

      // Valider que chaque photo est bien un File valide
      const validPhotos = productData.photos.filter((photo) => photo instanceof File);
      if (validPhotos.length !== productData.photos.length) {
        throw new Error("Une ou plusieurs images ne sont pas valides");
      }

      if (validPhotos.length === 0) {
        throw new Error("Aucune image valide n'a été fournie");
      }

      // Créer un FormData pour envoyer les fichiers
      const formData = new FormData();
      
      // Ajouter les champs texte
      formData.append("libelle", productData.libelle);
      formData.append("unite_poids", productData.unite_poids);
      formData.append("valeur_poids", productData.valeur_poids.toString());
      formData.append("categorie", productData.categorie);
      formData.append("prix_achat", productData.prix_achat.toString());
      formData.append("prix_vente_normale", productData.prix_vente_normale.toString());
      formData.append("prix_vente_reduit", productData.prix_vente_reduit.toString());
      formData.append("description", productData.description);
      formData.append("status", productData.status);
      
      // Ajouter les photos avec la structure attendue par l'API
      // photos[0][photo] = fichier, photos[0][is_primary] = 1 ou 0
      // La première image (index 0) est la principale (is_primary = 1)
      validPhotos.forEach((photo, index) => {
        // Vérifier que le fichier est valide avant de l'ajouter
        if (!(photo instanceof File)) {
          throw new Error(`L'image ${index + 1} n'est pas un fichier valide`);
        }

        // Vérifier que le fichier n'est pas vide
        if (photo.size === 0) {
          throw new Error(`L'image ${index + 1} est vide`);
        }

        // Ajouter le fichier avec la structure attendue par l'API
        formData.append(`photos[${index}][photo]`, photo);
        // La première image est principale (1), les autres sont secondaires (0)
        formData.append(`photos[${index}][is_primary]`, index === 0 ? "1" : "0");
      });

      
      // Envoyer la requête POST avec FormData
      const response = await apiClient.post("/produits", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      // Vérifier le statut HTTP pour confirmer la création réussie
      // Statut attendu : 201 (Created) ou 200 (OK)
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La création a échoué avec le statut HTTP ${response.status}`);
      }

      // Vérifier que la réponse contient bien des données
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      
      // L'API peut retourner différentes structures de réponse
      // Vérifier d'abord si c'est une erreur explicite
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        // Cas 1 : Réponse avec un champ d'erreur explicite
        if (responseData.error || responseData.erreur) {
          const errorMsg = typeof responseData.error === 'string' ? responseData.error :
                          typeof responseData.erreur === 'string' ? responseData.erreur :
                          typeof responseData.message === 'string' ? responseData.message :
                          "La création a échoué";
          throw new Error(errorMsg);
        }
        
        // Cas 2 : Réponse avec success explicite
        if (responseData.success !== undefined) {
          if (responseData.success === false) {
            const errorMsg = typeof responseData.message === 'string' ? responseData.message :
                            typeof responseData.msg === 'string' ? responseData.msg :
                            "La création du produit a échoué";
            throw new Error(errorMsg);
          }
          // Si success est true, retourner la réponse formatée
          const productData = responseData.produit || responseData.data || responseData;
          return {
            success: true,
            message: typeof responseData.message === 'string' ? responseData.message : "Produit créé avec succès",
            data: productData,
          };
        }
        
        // Cas 3 : Réponse avec un message et retour (structure Laravel/PHP typique)
        // L'API retourne { msg, cls, retour, produit }
        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg = typeof responseData.msg === 'string' ? responseData.msg :
                            typeof responseData.message === 'string' ? responseData.message :
                            "La création a échoué";
            throw new Error(errorMsg);
          }
          // retour === 1 signifie succès
          // L'API retourne les données du produit dans responseData.produit
          const productData = responseData.produit || responseData.data || responseData;
          return {
            success: true,
            message: typeof responseData.msg === 'string' ? responseData.msg :
                    typeof responseData.message === 'string' ? responseData.message :
                    "Produit créé avec succès",
            data: productData,
          };
        }
        
        // Cas 4 : Réponse avec message de succès et produit
        if (responseData.msg || responseData.message) {
          const message = typeof responseData.msg === 'string' ? responseData.msg :
                         typeof responseData.message === 'string' ? responseData.message : '';
          // Si le message contient des mots-clés de succès
          const successKeywords = ['succès', 'créé', 'success', 'created', 'ajouté'];
          const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
          
          if (isSuccess) {
            const productData = responseData.produit || responseData.data || responseData;
            return {
              success: true,
              message: message,
              data: productData,
            };
          }
        }
      }
      
      // Si le statut HTTP est 201 ou 200, considérer comme succès même si la structure est inattendue
      if (response.status === 201 || response.status === 200) {
        const responseData = response.data as Record<string, unknown>;
        const productData = responseData?.produit || responseData?.data || response.data;
        return {
          success: true,
          message: "Produit créé avec succès",
          data: productData,
        };
      }
      
      // Si aucune condition n'est remplie, considérer comme une erreur
      throw new Error("Réponse inattendue de l'API lors de la création");
    } catch (error: any) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            statusText?: string; 
            data?: any;
          };
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;
        
        // Erreur 422 : Validation échouée - extraire tous les messages d'erreur
        if (status === 422 && apiError) {
          // L'API Laravel retourne généralement les erreurs dans error.error ou error.errors
          const errorData = apiError.error || apiError.errors || apiError;
          
          const errorMessage = formatApiErrorMessage(errorData);
          
          return {
            success: false,
            error: errorMessage,
          };
        }
        
        // Autres erreurs HTTP
        const errorMessage = 
          apiError?.message || 
          apiError?.error || 
          `Erreur ${status || 'inconnue'}: ${axiosError.response?.statusText || 'Une erreur est survenue'}`;
        
        return {
          success: false,
          error: errorMessage,
        };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la création du produit";
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Récupérer la liste des produits vivriers avec pagination
   * @param page - Numéro de page (par défaut: 1)
   * @returns Promise avec les données paginées
   */
  async getProducts(page: number = 1): Promise<{
    data: Product[];
    meta: {
      current_page: number;
      from: number;
      last_page: number;
      per_page: number;
      to: number;
      total: number;
    };
    links: {
      first: string | null;
      last: string | null;
      prev: string | null;
      next: string | null;
    };
  }> {
    try {
      const url = `/produits?page=${page}`;
      const response = await apiClient.get<PaginatedResponse<Product>>(url);
      
      // Vérifier si la réponse est une chaîne d'erreur (ex: "vous êtes pas connecté")
      if (typeof response.data === 'string') {
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (lowerResponse.includes('connecté') || 
            lowerResponse.includes('connecte') ||
            lowerResponse.includes('authentification') ||
            lowerResponse.includes('unauthorized')) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }
        throw new Error("Réponse inattendue de l'API");
      }
      
      // Vérifier si response.data existe
      if (!response.data) {
        throw new Error("Aucune donnée reçue de l'API");
      }
      
      // La réponse est paginée avec structure { data: [...], links: {...}, meta: {...} }
      if (response.data.data && Array.isArray(response.data.data) && response.data.meta) {
        return {
          data: response.data.data,
          meta: response.data.meta,
          links: response.data.links,
        };
      }
      
      // Si la structure n'est pas celle attendue, lever une erreur
      throw new Error("Structure de réponse inattendue de l'API");
    } catch (error: unknown) {
      // Propager l'erreur pour que le composant puisse la gérer
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Une erreur est survenue lors de la récupération des produits");
    }
  },

  /**
   * Récupérer un produit par son identifiant
   * @param productId - ID du produit
   * @returns Promise<Product> - Données du produit
   */
  async getProductById(productId: string | number, forceRefresh: boolean = false): Promise<Product> {
    if (!productId) {
      throw new Error("Identifiant produit manquant");
    }

    try {
      // Ajouter un paramètre de cache-busting si forceRefresh est true
      const url = forceRefresh 
        ? `/produits/${productId}?t=${Date.now()}`
        : `/produits/${productId}`;
      
      const response = await apiClient.get<any>(url);

      // Vérifier si la réponse est une chaîne d'erreur (ex: "vous êtes pas connecté")
      if (typeof response.data === 'string') {
        const responseString: string = response.data;
        const lowerResponse = responseString.toLowerCase();
        if (lowerResponse.includes('connecté') || 
            lowerResponse.includes('connecte') ||
            lowerResponse.includes('authentification') ||
            lowerResponse.includes('unauthorized')) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }
        throw new Error("Réponse inattendue de l'API");
      }

      // Vérifier si response.data existe
      if (!response.data) {
        throw new Error("Aucune donnée reçue de l'API");
      }

      let resolvedProduct: Product | undefined;

      // Cas 1 : Réponse avec wrapper data (structure Laravel typique)
      if (typeof response.data === "object" && "data" in response.data && response.data.data) {
        resolvedProduct = response.data.data as Product;
      }
      // Cas 2 : Réponse directe (objet produit)
      else if (typeof response.data === "object" && !Array.isArray(response.data)) {
        // Vérifier si c'est un objet produit valide (a au moins un id et libelle)
        if ("id" in response.data && "libelle" in response.data) {
          resolvedProduct = response.data as Product;
        }
      }


      if (!resolvedProduct) {
        throw new Error("Réponse inattendue de l'API lors de la récupération du produit");
      }

      // L'API retourne all_photos avec les URLs complètes
      // Le status est un nombre (0 = Inactif, 1 = Actif)
      // categorie_name contient le nom de la catégorie

      return resolvedProduct;
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: {
              message?: string;
              error?: string;
              msg?: string;
            } | string;
          };
        };

        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;

        // Erreur 404 : Produit non trouvé
        if (status === 404) {
          throw new Error("Produit non trouvé");
        }

        // Erreur 401 : Non autorisé
        if (status === 401) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }

        // Gérer les différents formats de messages d'erreur
        let errorMessage = "Erreur lors de la récupération du produit";
        
        if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError && typeof apiError === 'object') {
          errorMessage = apiError.message || apiError.error || apiError.msg || errorMessage;
        }

        if (status) {
          errorMessage = `${errorMessage} (${status})`;
        }

        throw new Error(errorMessage);
      } else if (error && typeof error === "object" && "request" in error) {
        // Erreur réseau (pas de réponse du serveur)
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        // Autres erreurs (déjà formatées)
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la récupération du produit";
        throw new Error(errorMessage);
      }
    }
  },

  /**
   * Modifier un produit vivrier
   * @param productId - ID du produit à modifier
   * @param productData - Données du produit à modifier
   * @returns Promise avec la réponse de l'API
   */
  async updateProduct(productId: string | number, productData: UpdateProductData): Promise<CreateProductResponse> {
    if (!productId) {
      throw new Error("Identifiant produit manquant");
    }

    try {
      const formData = new FormData();

      const appendField = (key: string, value: string | number) => {
        formData.append(key, String(value ?? ""));
      };

      appendField("libelle", productData.libelle);
      appendField("unite_poids", productData.unite_poids);
      appendField("valeur_poids", productData.valeur_poids);
      appendField("categorie", productData.categorie_id);
      appendField("categorie_id", productData.categorie_id);
      appendField("prix_achat", productData.prix_achat);
      appendField("prix_vente_normale", productData.prix_vente_normale);
      appendField("prix_vente_reduit", productData.prix_vente_reduit);
      appendField("description", productData.description);
      appendField("status", productData.status);

      const validPhotos = (productData.photos || []).filter((photo) => photo instanceof File);

      validPhotos.forEach((photo, index) => {
        if (!(photo instanceof File)) {
          throw new Error(`L'image ${index + 1} n'est pas un fichier valide`);
        }

        if (photo.size === 0) {
          throw new Error(`L'image ${index + 1} est vide`);
        }

        formData.append(`photos[${index}][photo]`, photo);
        formData.append(`photos[${index}][is_primary]`, index === 0 ? "1" : "0");
      });

      if (Array.isArray(productData.existingPhotos) && productData.existingPhotos.length > 0) {
        productData.existingPhotos.forEach((photo, index) => {
          if (!photo?.id) {
            return;
          }
          formData.append(`existing_photos[${index}][id]`, String(photo.id));
          formData.append(`existing_photos[${index}][is_primary]`, String(photo.is_primary));
          
          if (import.meta.env.DEV) {
            console.log(`[productService.updateProduct] existing_photos[${index}]:`, {
              id: photo.id,
              is_primary: photo.is_primary,
            });
          }
        });
      }

      if (import.meta.env.DEV) {
        const debugPayload: Record<string, unknown> = {};
        const fileSummary: Record<string, number> = {};

        formData.forEach((value, key) => {
          if (value instanceof File) {
            fileSummary[key] = (fileSummary[key] || 0) + 1;
          } else {
            debugPayload[key] = value;
          }
        });

        console.log("[productService.updateProduct] Payload envoyé:", {
          ...debugPayload,
          files: fileSummary,
        });
      }

      formData.append("_method", "PUT");

      const response = await apiClient.post(`/produits/${productId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (import.meta.env.DEV) {
        console.log("[productService.updateProduct] Réponse API:", response.data);
      }

      // Vérifier le statut HTTP pour confirmer la modification réussie
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La modification a échoué avec le statut HTTP ${response.status}`);
      }

      // Vérifier que la réponse contient bien des données
      if (!response.data) {
        throw new Error("La réponse de l'API ne contient pas de données");
      }

      // L'API peut retourner différentes structures de réponse
      if (response.data && typeof response.data === 'object') {
        const responseData = response.data as Record<string, unknown>;
        
        // Cas 1 : Réponse avec un champ d'erreur explicite
        if (responseData.error || responseData.erreur) {
          const errorMsg = typeof responseData.error === 'string' ? responseData.error :
                          typeof responseData.erreur === 'string' ? responseData.erreur :
                          typeof responseData.message === 'string' ? responseData.message :
                          "La modification a échoué";
          throw new Error(errorMsg);
        }
        
        // Cas 2 : Réponse avec success explicite
        if (responseData.success !== undefined) {
          if (responseData.success === false) {
            const errorMsg = typeof responseData.message === 'string' ? responseData.message :
                            typeof responseData.msg === 'string' ? responseData.msg :
                            "La modification du produit a échoué";
            throw new Error(errorMsg);
          }
          const productData = responseData.produit || responseData.data || responseData;
          return {
            success: true,
            message: typeof responseData.message === 'string' ? responseData.message : "Produit modifié avec succès",
            data: productData,
          };
        }
        
        // Cas 3 : Réponse avec un message et retour (structure Laravel/PHP typique)
        if (responseData.retour !== undefined) {
          const retour = responseData.retour;
          if (retour === 0 || retour === false) {
            const errorMsg = typeof responseData.msg === 'string' ? responseData.msg :
                            typeof responseData.message === 'string' ? responseData.message :
                            "La modification a échoué";
            throw new Error(errorMsg);
          }
          const productData = responseData.produit || responseData.data || responseData;
          return {
            success: true,
            message: typeof responseData.msg === 'string' ? responseData.msg :
                    typeof responseData.message === 'string' ? responseData.message :
                    "Produit modifié avec succès",
            data: productData,
          };
        }
        
        // Cas 4 : Réponse avec message de succès et produit
        if (responseData.msg || responseData.message) {
          const message = typeof responseData.msg === 'string' ? responseData.msg :
                         typeof responseData.message === 'string' ? responseData.message : '';
          const successKeywords = ['succès', 'modifié', 'success', 'updated', 'modifiée'];
          const isSuccess = successKeywords.some(keyword => message.toLowerCase().includes(keyword));
          
          if (isSuccess) {
            const productData = responseData.produit || responseData.data || responseData;
            return {
              success: true,
              message: message,
              data: productData,
            };
          }
        }
      }
      
      // Si le statut HTTP est 200 ou 201, considérer comme succès
      if (response.status === 200 || response.status === 201) {
        const responseData = response.data as Record<string, unknown>;
        const productData = responseData?.produit || responseData?.data || response.data;
        return {
          success: true,
          message: "Produit modifié avec succès",
          data: productData,
        };
      }
      
      throw new Error("Réponse inattendue de l'API lors de la modification");
    } catch (error: any) {
      // Gérer les erreurs de l'API sans exposer de données sensibles
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { 
          response?: { 
            status?: number; 
            statusText?: string; 
            data?: any;
          };
        };
        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;
        
        // Erreur 422 : Validation échouée
        if (status === 422 && apiError) {
          const errorData = apiError.error || apiError.errors || apiError;
          const errorMessage = formatApiErrorMessage(errorData);
          
          return {
            success: false,
            error: errorMessage,
          };
        }
        
        // Autres erreurs HTTP
        const errorMessage = 
          apiError?.message || 
          apiError?.error || 
          `Erreur ${status || 'inconnue'}: ${axiosError.response?.statusText || 'Une erreur est survenue'}`;
        
        return {
          success: false,
          error: errorMessage,
        };
      }
      
      // Erreur réseau ou autre
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la modification du produit";
      
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  /**
   * Supprimer une image existante d'un produit
   * @param photoId - ID de la photo à supprimer
   * @returns Promise avec le résultat de la suppression
   */
  async deleteProductImage(photoId: string): Promise<CreateProductResponse> {
    if (!photoId) {
      return {
        success: false,
        error: "Identifiant de la photo manquant",
      };
    }

    try {
      // L'API expose ce point de terminaison uniquement en GET (cf. message d'erreur côté serveur).
      // Nous utilisons donc GET pour rester conforme au backend existant.
      const response = await apiClient.get(`/delete-image-produit/${photoId}`);
      const isSuccessStatus = response.status >= 200 && response.status < 300;

      if (!isSuccessStatus) {
        throw new Error(`La suppression a échoué avec le statut HTTP ${response.status}`);
      }

      const responseData = response.data as Record<string, unknown> | undefined;
      const message =
        (typeof responseData?.message === "string" && responseData.message) ||
        (typeof responseData?.msg === "string" && responseData.msg) ||
        "Image supprimée avec succès";

      return {
        success: true,
        message,
        data: responseData?.data || null,
      };
    } catch (error: any) {
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: { message?: string; error?: string; msg?: string } | string;
          };
        };

        const apiError = axiosError.response?.data;
        let errorMessage = "Impossible de supprimer l'image";

        if (typeof apiError === "string" && apiError.trim()) {
          errorMessage = apiError;
        } else if (apiError && typeof apiError === "object") {
          const apiErrorObj = apiError as Record<string, unknown>;
          const extractedMessage =
            (typeof apiErrorObj.message === "string" && apiErrorObj.message) ||
            (typeof apiErrorObj.error === "string" && apiErrorObj.error) ||
            (typeof apiErrorObj.msg === "string" && apiErrorObj.msg);

          if (extractedMessage) {
            errorMessage = extractedMessage;
          }
        }

        return {
          success: false,
          error: errorMessage,
        };
      }

      const fallbackError = error instanceof Error ? error.message : "Impossible de supprimer l'image";
      return {
        success: false,
        error: fallbackError,
      };
    }
  },

  /**
   * Supprimer un produit vivrier
   * @param productId - ID du produit à supprimer
   * @returns Promise<void>
   */
  async deleteProduct(productId: string | number): Promise<void> {
    if (!productId) {
      throw new Error("Identifiant produit manquant");
    }

    try {
      const response = await apiClient.delete(`/produits/${productId}`);
      
      // Vérifier le statut HTTP pour confirmer la suppression réussie
      const isSuccessStatus = response.status >= 200 && response.status < 300;
      
      if (!isSuccessStatus) {
        throw new Error(`La suppression a échoué avec le statut HTTP ${response.status}`);
      }
    } catch (error: unknown) {
      // Gérer les erreurs de l'API
      if (error && typeof error === "object" && "response" in error) {
        const axiosError = error as {
          response?: {
            status?: number;
            statusText?: string;
            data?: {
              message?: string;
              error?: string;
              msg?: string;
            } | string;
          };
        };

        const apiError = axiosError.response?.data;
        const status = axiosError.response?.status;

        // Erreur 404 : Produit non trouvé
        if (status === 404) {
          throw new Error("Produit non trouvé");
        }

        // Erreur 401 : Non autorisé
        if (status === 401) {
          throw new Error("Non authentifié. Veuillez vous reconnecter.");
        }

        // Gérer les différents formats de messages d'erreur
        let errorMessage = "Erreur lors de la suppression du produit";
        
        if (typeof apiError === 'string') {
          errorMessage = apiError;
        } else if (apiError && typeof apiError === 'object') {
          errorMessage = apiError.message || apiError.error || apiError.msg || errorMessage;
        }

        if (status) {
          errorMessage = `${errorMessage} (${status})`;
        }

        throw new Error(errorMessage);
      } else if (error && typeof error === "object" && "request" in error) {
        // Erreur réseau (pas de réponse du serveur)
        throw new Error("Impossible de contacter le serveur. Vérifiez votre connexion internet.");
      } else {
        // Autres erreurs (déjà formatées)
        const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la suppression du produit";
        throw new Error(errorMessage);
      }
    }
  },
};

export default productService;

