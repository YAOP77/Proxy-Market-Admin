/**
 * Service API pour la gestion des rapports et statistiques
 *
 * Gère les opérations liées aux rapports :
 * - Récupération des statistiques générales
 */

import apiClient from "./axiosConfig";

/**
 * Interface pour les rapports de statistiques
 */
export interface ReportsData {
  commande_to_day: number;
  commande_to_day_soustotal: number;
  commandehier: number;
  commandehier_soustotal: number;
  commandesemaine: number;
  commandesemaine_soustotal: number;
  commandeSemainePasse: number;
  commandeSemainePasse_soustotal: number;
  commandemois: number;
  commandemois_soustotal: number;
  commandeMoisPasse: number;
  commandeMoisPasse_soustotal: number;
  commandeannee: number;
  commandeannee_soustotal: number;
  commandeAnneePasse: number;
  commandeAnneePasse_soustotal: number;
  all_boutique: number;
  all_produit: number;
  produit_actif: number;
  produit_inactif: number;
  all_client: number;
  all_livreur: number;
}

/**
 * Récupère les rapports et statistiques
 * @returns Promise avec les données de rapports
 */
async function getReports(): Promise<ReportsData> {
  try {
    const response = await apiClient.get<ReportsData | { data: ReportsData } | string>("/get-reports");

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
    const responseData = response.data as ReportsData | { data: ReportsData };

    // Si la réponse est wrappée dans { data: ... }
    if ("data" in responseData && responseData.data && typeof responseData.data === "object") {
      return responseData.data as ReportsData;
    }

    // Sinon, retourner directement
    return responseData as ReportsData;
  } catch (error: unknown) {

    if (error instanceof Error) {
      throw new Error(error.message || "Erreur lors de la récupération des rapports");
    }

    throw new Error("Erreur lors de la récupération des rapports");
  }
}

const reportService = {
  getReports,
};

export default reportService;

