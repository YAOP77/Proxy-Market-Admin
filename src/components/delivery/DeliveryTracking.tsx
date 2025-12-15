/**
 * Composant DeliveryTracking - Suivi de livraison en temps réel
 * 
 * Affiche :
 * - Estimation du temps de livraison
 * - Compte à rebours en temps réel
 * - Heure exacte de livraison estimée
 * - Date réelle de livraison (si déjà livrée)
 */

import { useState, useEffect, useRef } from "react";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";
import { calculateDistanceAndTime, Coordinates } from "../../services/api/distanceService";

interface DeliveryTrackingProps {
  origin: Coordinates; // Coordonnées de la boutique
  destination: Coordinates; // Coordonnées de l'adresse de livraison
  originName?: string; // Nom de la boutique (optionnel)
  destinationName?: string; // Nom de l'adresse de livraison (optionnel)
  mode?: "driving" | "walking" | "bicycling" | "transit"; // Mode de transport
  orderStatus?: string; // Statut de la commande (pour savoir si elle est livrée)
  deliveredAt?: string | null; // Date réelle de livraison (si disponible)
  orderId?: string; // ID de la commande pour persister le compte à rebours
  className?: string;
}

export default function DeliveryTracking({
  origin,
  destination,
  originName = "Boutique",
  destinationName = "Adresse de livraison",
  mode = "driving",
  orderStatus,
  deliveredAt,
  orderId,
  className = "",
}: DeliveryTrackingProps) {
  const { isLoaded, loadError } = useGoogleMaps();
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [durationInSeconds, setDurationInSeconds] = useState<number | null>(null);
  const [estimatedDeliveryTime, setEstimatedDeliveryTime] = useState<Date | null>(null);
  const [initialEstimatedDeliveryTime, setInitialEstimatedDeliveryTime] = useState<Date | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Vérifier si la commande est livrée (déclaré avant les useEffect qui l'utilisent)
  const isDelivered = orderStatus && (orderStatus.toLowerCase().includes("livrée") || orderStatus.toLowerCase().includes("livree"));
  
  // Vérifier si la commande est annulée
  const isCancelled = orderStatus && (
    orderStatus.toLowerCase().includes("annulée") || 
    orderStatus.toLowerCase().includes("annulee") ||
    orderStatus.toLowerCase().includes("annulé") ||
    orderStatus.toLowerCase().includes("annule")
  );
  
  // Vérifier si la commande est en préparation (condition pour afficher l'estimation)
  // Détecte : "Commande en préparation", "En préparation", "En cours de préparation", etc.
  const isInPreparation = orderStatus && (
    orderStatus.toLowerCase().includes("préparation") || 
    orderStatus.toLowerCase().includes("preparation") ||
    (orderStatus.toLowerCase().includes("cour") && orderStatus.toLowerCase().includes("préparation")) ||
    (orderStatus.toLowerCase().includes("cours") && orderStatus.toLowerCase().includes("préparation"))
  );
  
  // Vérifier si la commande est en livraison (doit aussi afficher l'estimation)
  const isInDelivery = orderStatus && (
    orderStatus.toLowerCase().includes("livraison") && 
    !orderStatus.toLowerCase().includes("livrée") &&
    !orderStatus.toLowerCase().includes("livree")
  );
  
  // La commande est active si elle est en préparation ou en livraison
  const isActiveOrder = isInPreparation || isInDelivery;

  // Calculer l'estimation initiale - Seulement si la commande est active
  useEffect(() => {
    const calculateEstimate = async () => {
      // Ne calculer que si la commande est active (en préparation ou en livraison)
      if (!isActiveOrder) {
        // Réinitialiser les valeurs si la commande n'est plus active
        setDistance(null);
        setDurationInSeconds(null);
        setEstimatedDeliveryTime(null);
        setInitialEstimatedDeliveryTime(null);
        setRemainingSeconds(null);
        setError(null);
        return;
      }

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
        setDurationInSeconds(result.duration.value);

        // Calculer l'heure de livraison estimée (maintenant + durée)
        const now = new Date();
        const deliveryTime = new Date(now.getTime() + result.duration.value * 1000);
        
        // Stocker l'heure initiale de livraison estimée pour persister entre les navigations
        // Utiliser localStorage avec une clé unique basée sur l'ID de la commande
        const storageKey = orderId ? `delivery_${orderId}` : `delivery_${origin.latitude}_${origin.longitude}_${destination.latitude}_${destination.longitude}`;
        const storedInitialTime = localStorage.getItem(storageKey);
        
        let initialDeliveryTime: Date;
        if (storedInitialTime) {
          // Si on a une heure stockée, l'utiliser (pour persister entre navigations)
          initialDeliveryTime = new Date(storedInitialTime);
          // Recalculer le temps restant basé sur l'heure initiale
          const currentTime = new Date();
          const remaining = Math.max(0, Math.floor((initialDeliveryTime.getTime() - currentTime.getTime()) / 1000));
          setRemainingSeconds(remaining);
        } else {
          // Première fois, stocker l'heure initiale
          initialDeliveryTime = deliveryTime;
          localStorage.setItem(storageKey, deliveryTime.toISOString());
          setRemainingSeconds(result.duration.value);
        }
        
        setInitialEstimatedDeliveryTime(initialDeliveryTime);
        setEstimatedDeliveryTime(initialDeliveryTime);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur lors du calcul";
        setError(message);
        setDistance(null);
        setDurationInSeconds(null);
        setEstimatedDeliveryTime(null);
        setInitialEstimatedDeliveryTime(null);
        setRemainingSeconds(null);
      } finally {
        setIsCalculating(false);
      }
    };

    calculateEstimate();
  }, [origin, destination, mode, isLoaded, loadError, orderId, isActiveOrder]);
  
  // Vérifier si on doit afficher le message "livraison n'a pas encore démarré"
  // Ne pas l'afficher pour les commandes livrées, annulées, ou en cours (préparation/livraison)
  const shouldShowNotStartedMessage = !isDelivered && !isCancelled && !isActiveOrder;

  // Compte à rebours en temps réel - Basé sur l'heure estimée pour persister entre navigations
  useEffect(() => {
    if (isCalculating || !initialEstimatedDeliveryTime) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Ne pas démarrer le compte à rebours si la commande est déjà livrée ou annulée
    if (isDelivered || isCancelled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }
    
    // Ne démarrer le compte à rebours que si la commande est en préparation ou en livraison
    if (!isActiveOrder) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    // Calculer le temps restant basé sur l'heure estimée initiale (pour persister entre navigations)
    const calculateRemaining = () => {
      const now = new Date();
      const remaining = Math.max(0, Math.floor((initialEstimatedDeliveryTime.getTime() - now.getTime()) / 1000));
      setRemainingSeconds(remaining);
      setEstimatedDeliveryTime(initialEstimatedDeliveryTime);
      return remaining;
    };

    // Calculer immédiatement
    calculateRemaining();

    // Mettre à jour toutes les secondes
    intervalRef.current = setInterval(() => {
      const remaining = calculateRemaining();
      if (remaining <= 0 && intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isCalculating, isDelivered, isCancelled, isActiveOrder, initialEstimatedDeliveryTime]);
  
  // Nettoyer le localStorage quand le composant est démonté ou quand la commande est livrée
  useEffect(() => {
    if (isDelivered && initialEstimatedDeliveryTime) {
      const storageKey = orderId ? `delivery_${orderId}` : `delivery_${origin.latitude}_${origin.longitude}_${destination.latitude}_${destination.longitude}`;
      localStorage.removeItem(storageKey);
    }
    
    return () => {
      // Nettoyer seulement si la commande est livrée
      if (isDelivered && initialEstimatedDeliveryTime) {
        const storageKey = orderId ? `delivery_${orderId}` : `delivery_${origin.latitude}_${origin.longitude}_${destination.latitude}_${destination.longitude}`;
        localStorage.removeItem(storageKey);
      }
    };
  }, [isDelivered, initialEstimatedDeliveryTime, origin, destination, orderId]);

  // Formater le temps restant
  const formatRemainingTime = (seconds: number): string => {
    if (seconds <= 0) return "0 min";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    if (minutes > 0) {
      return `${minutes}min ${secs}s`;
    }
    return `${secs}s`;
  };

  // Formater l'heure
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Formater la date au format DD/MM/YYYY
  const formatDate = (date: Date): string => {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Formater la date complète
  const formatFullDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };


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
    return null;
  }

  return (
    <div className={className}>
      {/* Contenu */}
        {isCalculating ? (
          <div className="flex items-center justify-center gap-3 py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-3 border-[#04b05d] border-t-transparent" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Calcul en cours...</p>
          </div>
        ) : error ? (
          <div className="space-y-2">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
            {error.includes("API key") || error.includes("clé API") || error.includes("not authorized") || error.includes("non activée") ? (
              <div className="text-xs text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-3">
                <p className="font-semibold mb-2">Configuration requise :</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Allez sur <a href="https://console.cloud.google.com/apis/library" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">Google Cloud Console</a></li>
                  <li>Recherchez et activez l'API <strong>"Distance Matrix API"</strong></li>
                  <li>Vérifiez que votre clé API a accès à cette API</li>
                  <li>Redémarrez l'application</li>
                </ol>
              </div>
            ) : null}
          </div>
        ) : shouldShowNotStartedMessage ? (
          // Commande pas encore en préparation - Afficher un message (sauf si livrée ou annulée)
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-amber-100 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-lg">
              <svg
                className="w-5 h-5 text-amber-600 dark:text-amber-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  La livraison de cette commande n'a pas encore démarré
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  L'estimation de livraison sera disponible lorsque la commande sera en préparation
                </p>
              </div>
            </div>
          </div>
        ) : isDelivered && deliveredAt ? (
          // Commande déjà livrée - Afficher la date réelle
          <div className="space-y-4">
            <div className="flex items-center gap-2 p-4 bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Commande livrée
                </p>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  {formatFullDate(deliveredAt)}
                </p>
              </div>
            </div>
            {distance && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Distance parcourue : <span className="font-medium">{distance}</span>
              </div>
            )}
          </div>
        ) : durationInSeconds !== null && estimatedDeliveryTime && isActiveOrder ? (
          // Commande en cours (préparation ou livraison) - Afficher le suivi en temps réel avec style minimaliste
          <div className="flex flex-col md:flex-row items-start justify-between gap-4 md:gap-6">
            {/* Colonne gauche - Temps restant et heure estimée */}
            <div className="flex-1 space-y-3 w-full md:w-auto">
              {/* Temps restant estimé */}
              {remainingSeconds !== null && remainingSeconds > 0 ? (
                <>
                  <div>
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Temps restant estimé
                    </p>
                    <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {formatRemainingTime(remainingSeconds)}
                    </p>
                  </div>
                  {/* Livraison prévue à */}
                  <div className="pt-2">
                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                      Livraison prévue à
                    </p>
                    <p className="text-base font-semibold text-gray-800 dark:text-white/90">
                      {formatTime(estimatedDeliveryTime)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-xm font-medium text-neutral-700 dark:text-amber-400 mb-1">
                      Livraison imminente
                    </p>
                    <p className="p-0.5 text-xs text-green-600 px-2 py-1 w-full sm:w-auto inline-block bg-green-200 border border-green-300 rounded-full dark:text-white">
                      Il semble que la commande ait été livrée. Le statut sera confirmé dans quelques instants.
                    </p>
                  </div>
                  {/* Livraison a été prévue */}
                  {estimatedDeliveryTime && (
                    <div className="pt-2">
                      <p className="text-xm font-medium text-neutral-700 dark:text-gray-400 mb-1">
                        Livraison a été prévue
                      </p>
                      <p className="text-xs font-semibold text-blue-600 dark:text-white/90">
                        {formatDate(estimatedDeliveryTime)} à {formatTime(estimatedDeliveryTime)}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Colonne droite - Distance et Mode */}
            <div className="text-left sm:text-right space-y-4 w-full sm:w-auto mt-4 sm:mt-0">
              {distance && (
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Distance
                  </p>
                  <p className="text-base font-semibold text-gray-900 dark:text-white">
                    {distance}
                  </p>
                </div>
              )}
              <div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Mode
                </p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {mode === "driving" ? "Véhicule" : mode === "walking" ? "À pied" : mode === "bicycling" ? "Vélo" : "Transport"}
                </p>
              </div>
            </div>
          </div>
        ) : null}
    </div>
  );
}

