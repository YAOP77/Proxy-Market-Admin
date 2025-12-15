/**
 * Service pour calculer la distance et le temps de trajet entre deux points
 * en utilisant Google Maps Distance Matrix API
 */

/**
 * Interface pour les coordonnées géographiques
 */
export interface Coordinates {
  latitude: number | string;
  longitude: number | string;
}

/**
 * Interface pour le résultat de la Distance Matrix API
 */
export interface DistanceMatrixResult {
  distance: {
    text: string; // Ex: "5.2 km"
    value: number; // Distance en mètres
  };
  duration: {
    text: string; // Ex: "12 min"
    value: number; // Durée en secondes
  };
  status: string; // Status de la requête
}

/**
 * Calcule la distance et le temps de trajet entre deux points
 * en utilisant Google Maps Distance Matrix API
 * 
 * @param origin - Coordonnées du point de départ (boutique)
 * @param destination - Coordonnées du point d'arrivée (adresse de livraison)
 * @param mode - Mode de transport (driving, walking, bicycling, transit). Par défaut: "driving"
 * @returns Promise avec le résultat contenant distance et durée
 */
export async function calculateDistanceAndTime(
  origin: Coordinates,
  destination: Coordinates,
  mode: "driving" | "walking" | "bicycling" | "transit" = "driving"
): Promise<DistanceMatrixResult> {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  if (!apiKey || apiKey.trim() === "" || apiKey === "your_api_key_here") {
    throw new Error("Clé API Google Maps non configurée");
  }

  // Vérifier que Google Maps est chargé
  if (typeof window === "undefined" || !window.google || !window.google.maps) {
    throw new Error("Google Maps API n'est pas chargée");
  }

  // Convertir les coordonnées en format string pour l'API
  const originStr = `${Number(origin.latitude)},${Number(origin.longitude)}`;
  const destinationStr = `${Number(destination.latitude)},${Number(destination.longitude)}`;

  // Créer une instance du service Distance Matrix
  const service = new window.google.maps.DistanceMatrixService();

  return new Promise((resolve, reject) => {
    service.getDistanceMatrix(
      {
        origins: [originStr],
        destinations: [destinationStr],
        travelMode: window.google.maps.TravelMode[mode.toUpperCase() as keyof typeof window.google.maps.TravelMode] || window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC, // Utiliser le système métrique (km, m)
      },
      (response, status) => {
        if (status === window.google.maps.DistanceMatrixStatus.OK && response) {
          const result = response.rows[0]?.elements[0];
          
          if (!result) {
            reject(new Error("Aucune donnée de distance disponible"));
            return;
          }

          if (result.status === window.google.maps.DistanceMatrixElementStatus.OK) {
            resolve({
              distance: {
                text: result.distance.text,
                value: result.distance.value,
              },
              duration: {
                text: result.duration.text,
                value: result.duration.value,
              },
              status: "OK",
            });
          } else {
            // Gérer les différents statuts d'erreur
            let errorMessage = "Impossible de calculer la distance";
            switch (result.status) {
              case window.google.maps.DistanceMatrixElementStatus.NOT_FOUND:
                errorMessage = "Adresse de départ ou d'arrivée introuvable";
                break;
              case window.google.maps.DistanceMatrixElementStatus.ZERO_RESULTS:
                errorMessage = "Aucun itinéraire trouvé entre les deux points";
                break;
              default:
                errorMessage = `Erreur: ${result.status}`;
            }
            reject(new Error(errorMessage));
          }
        } else {
          // Gérer les erreurs de l'API
          let errorMessage = "Erreur lors du calcul de la distance";
          switch (status) {
            case window.google.maps.DistanceMatrixStatus.INVALID_REQUEST:
              errorMessage = "Requête invalide";
              break;
            case window.google.maps.DistanceMatrixStatus.MAX_ELEMENTS_EXCEEDED:
              errorMessage = "Limite d'éléments dépassée";
              break;
            case window.google.maps.DistanceMatrixStatus.MAX_DIMENSIONS_EXCEEDED:
              errorMessage = "Limite de dimensions dépassée";
              break;
            case window.google.maps.DistanceMatrixStatus.OVER_QUERY_LIMIT:
              errorMessage = "Limite de requêtes dépassée";
              break;
            case window.google.maps.DistanceMatrixStatus.REQUEST_DENIED:
              errorMessage = "Distance Matrix API non activée. Activez cette API dans Google Cloud Console pour votre clé API.";
              break;
            case window.google.maps.DistanceMatrixStatus.UNKNOWN_ERROR:
              errorMessage = "Erreur inconnue";
              break;
            default:
              errorMessage = `Erreur: ${status}`;
          }
          reject(new Error(errorMessage));
        }
      }
    );
  });
}

/**
 * Formate la durée en minutes de manière lisible
 * @param durationInSeconds - Durée en secondes
 * @returns String formaté (ex: "20 min", "1 h 15 min")
 */
export function formatDuration(durationInSeconds: number): string {
  const minutes = Math.round(durationInSeconds / 60);
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours} h`;
  }
  
  return `${hours} h ${remainingMinutes} min`;
}

