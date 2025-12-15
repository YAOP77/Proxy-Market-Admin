/**
 * Composant DeliveryTimeEstimate - Estimation du temps de livraison
 * 
 * Calcule et affiche le temps estimé de livraison entre une boutique
 * et une adresse de livraison en utilisant Google Maps Distance Matrix API
 */

import { useState, useEffect } from "react";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";
import { calculateDistanceAndTime, formatDuration, Coordinates } from "../../services/api/distanceService";

interface DeliveryTimeEstimateProps {
  origin: Coordinates; // Coordonnées de la boutique
  destination: Coordinates; // Coordonnées de l'adresse de livraison
  originName?: string; // Nom de la boutique (optionnel)
  destinationName?: string; // Nom de l'adresse de livraison (optionnel)
  mode?: "driving" | "walking" | "bicycling" | "transit"; // Mode de transport
  className?: string;
}

export default function DeliveryTimeEstimate({
  origin,
  destination,
  originName = "Boutique",
  destinationName = "Adresse de livraison",
  mode = "driving",
  className = "",
}: DeliveryTimeEstimateProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [durationInSeconds, setDurationInSeconds] = useState<number | null>(null);

  useEffect(() => {
    const calculateEstimate = async () => {
      // Vérifier que les coordonnées sont valides
      if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
        setError("Coordonnées manquantes");
        return;
      }

      // Vérifier que Google Maps est chargé
      if (!isLoaded) {
        if (loadError) {
          setError("Google Maps non disponible");
        }
        return;
      }

      try {
        setIsCalculating(true);
        setError(null);

        const result = await calculateDistanceAndTime(origin, destination, mode);

        setDistance(result.distance.text);
        setDuration(result.duration.text);
        setDurationInSeconds(result.duration.value);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du calcul";
        setError(message);
        setDistance(null);
        setDuration(null);
        setDurationInSeconds(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateEstimate();
  }, [origin, destination, mode, isLoaded, loadError]);

  // Si les coordonnées ne sont pas valides
  if (!origin.latitude || !origin.longitude || !destination.latitude || !destination.longitude) {
    return null;
  }

  // Si Google Maps n'est pas chargé
  if (!isLoaded) {
    if (loadError) {
      return (
        <div className={`rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20 p-4 ${className}`}>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Impossible de calculer le temps de livraison : Google Maps non disponible
          </p>
        </div>
      );
    }
    return null; // Ne rien afficher pendant le chargement
  }

  return (
    <div className={`rounded-lg border border-[#04b05d]/20 bg-[#04b05d]/5 dark:border-[#04b05d]/30 dark:bg-[#04b05d]/10 p-4 ${className}`}>
      <div className="flex items-start gap-3">
        {/* Icône */}
        <div className="flex-shrink-0 mt-0.5">
          <svg
            className="w-5 h-5 text-[#04b05d] dark:text-[#04b05d]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
            />
          </svg>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 mb-2">
            Estimation de livraison
          </h4>

          {isCalculating ? (
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#04b05d] border-t-transparent" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Calcul en cours...</p>
            </div>
          ) : error ? (
            <div className="space-y-2">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              {error.includes("API key") || error.includes("clé API") || error.includes("not authorized") ? (
                <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2">
                  <p className="font-semibold mb-1">Configuration requise :</p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Allez sur <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">Google Cloud Console</a></li>
                    <li>Activez l'API <strong>"Distance Matrix API"</strong></li>
                    <li>Vérifiez que votre clé API a accès à cette API</li>
                    <li>Redémarrez l'application</li>
                  </ol>
                </div>
              ) : null}
            </div>
          ) : duration && distance ? (
            <div className="space-y-2">
              {/* Temps estimé - Mise en évidence */}
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-[#04b05d] dark:text-[#04b05d]">
                  {duration}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  (environ)
                </span>
              </div>

              {/* Distance */}
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>{distance}</span>
              </div>

              {/* Informations supplémentaires */}
              <div className="pt-2 border-t border-[#04b05d]/20 dark:border-[#04b05d]/30">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  De <span className="font-medium">{originName}</span> vers{" "}
                  <span className="font-medium">{destinationName}</span>
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Mode de transport : {mode === "driving" ? "Véhicule" : mode === "walking" ? "À pied" : mode === "bicycling" ? "Vélo" : "Transport en commun"}
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

