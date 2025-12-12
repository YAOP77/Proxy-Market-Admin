/**
 * Composant GoogleMapPicker - Sélection de localisation sur Google Maps
 * 
 * Permet à l'utilisateur de cliquer sur une carte pour définir l'emplacement
 * et récupère automatiquement la longitude, la latitude et les informations d'adresse
 * via le Geocoding API de Google Maps.
 * 
 * Ce composant utilise le contexte GoogleMapsContext pour éviter le chargement
 * multiple de l'API Google Maps.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { GoogleMap, Marker } from "@react-google-maps/api";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";

/**
 * Interface pour les informations d'adresse retournées par le Geocoding API
 */
export interface LocationAddressInfo {
  location_name?: string;
  formatted_address?: string;
  street_number?: string;
  route?: string;
  locality?: string;
  administrative_area_level_1?: string;
  country?: string;
  postal_code?: string;
}

/**
 * Interface pour les données complètes de localisation
 */
export interface LocationData {
  lat: number;
  lng: number;
  address?: LocationAddressInfo;
}

interface GoogleMapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationSelect: (locationData: LocationData) => void;
  height?: string;
  className?: string;
}

const GoogleMapPicker: React.FC<GoogleMapPickerProps> = ({
  latitude,
  longitude,
  onLocationSelect,
  height = "400px",
  className = "",
}) => {
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const { isLoaded, loadError: contextLoadError, googleMapsApiKey } = useGoogleMaps();
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Utiliser l'erreur du contexte ou une erreur locale
  const currentLoadError = loadError || contextLoadError;

  // Vérifier si l'API est disponible
  const isApiAvailable = typeof window !== "undefined" && window.google && window.google.maps;

  // Vérification améliorée de la clé API
  if (!googleMapsApiKey || googleMapsApiKey.trim() === "" || googleMapsApiKey === "your_api_key_here") {
    return (
      <div className={`flex items-center justify-center border border-amber-300 rounded-lg bg-amber-50 dark:border-amber-700 dark:bg-amber-900/20 p-6 ${className}`} style={{ height }}>
        <div className="text-center max-w-md">
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">
            ⚙️ Configuration Google Maps requise
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-3">
            Créez un fichier <code className="px-1 py-0.5 bg-amber-100 dark:bg-amber-900 rounded">.env</code> à la racine du projet avec :
          </p>
          <pre className="text-xs bg-amber-100 dark:bg-amber-900/50 p-2 rounded text-left overflow-x-auto">
            VITE_GOOGLE_MAPS_API_KEY=votre_cle_api_ici
          </pre>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
            Puis redémarrez le serveur de développement (npm run dev)
          </p>
        </div>
      </div>
    );
  }

  const getErrorContent = () => {
    if (currentLoadError === "BillingNotEnabled") {
      return {
        title: "💳 Facturation non activée",
        message: "Vous devez créer et activer un compte de facturation pour utiliser Google Maps API. C'est gratuit jusqu'à 200$ par mois.",
        instructions: [
          "1. Allez sur Google Cloud Console : https://console.cloud.google.com/billing",
          "2. Cliquez sur 'Créer un compte de facturation' ou 'Create billing account'",
          "3. Remplissez le formulaire avec vos informations (nom, adresse, pays, etc.)",
          "4. Ajoutez une carte de crédit ou de débit (requis mais vous ne serez PAS facturé dans la limite du quota gratuit)",
          "5. Liez le compte de facturation à votre projet Google Cloud",
          "6. Activez l'API 'Maps JavaScript API' dans 'APIs & Services' > 'Library'",
          "7. Rechargez cette page après avoir activé la facturation",
          "",
          "⚠️ Important : Vous avez un quota GRATUIT de 200$ par mois. Google ne vous facturera rien tant que vous restez dans cette limite."
        ]
      };
    } else if (currentLoadError === "ApiNotActivated") {
      return {
        title: "🔌 API non activée",
        message: "L'API Maps JavaScript API n'est pas activée dans Google Cloud Console.",
        instructions: [
          "1. Allez sur Google Cloud Console : https://console.cloud.google.com/",
          "2. Sélectionnez votre projet",
          "3. Allez dans 'APIs & Services' > 'Library'",
          "4. Recherchez 'Maps JavaScript API'",
          "5. Cliquez sur 'Enable' (Activer)",
          "6. Rechargez cette page après avoir activé l'API"
        ]
      };
    } else if (currentLoadError === "RefererNotAllowed") {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      return {
        title: "🔒 Restriction de référent",
        message: "Les restrictions de la clé API bloquent l'accès depuis cette origine.",
        instructions: [
          "1. Allez sur Google Cloud Console : https://console.cloud.google.com/",
          "2. Sélectionnez votre projet",
          "3. Allez dans 'APIs & Services' > 'Credentials'",
          "4. Cliquez sur votre clé API",
          "5. Dans 'Application restrictions', sélectionnez 'HTTP referrers (web sites)'",
          "6. Ajoutez ces référents :",
          "   - http://localhost:5173/*",
          "   - http://127.0.0.1:5173/*",
          currentOrigin ? `   - ${currentOrigin}/*` : "",
          currentOrigin ? `   - ${currentOrigin.replace(/^https?/, 'https')}/*` : "",
          "7. Cliquez sur 'Save'",
          "8. Attendez quelques minutes pour que les changements prennent effet",
          "9. Rechargez cette page"
        ]
      };
    } else if (currentLoadError === "InvalidKey") {
      return {
        title: "🔑 Clé API invalide",
        message: "La clé API configurée n'est pas valide ou a été révoquée.",
        instructions: [
          "1. Vérifiez que la clé API dans le fichier .env est correcte",
          "2. Allez sur Google Cloud Console pour créer une nouvelle clé API si nécessaire",
          "3. Redémarrez le serveur de développement après avoir modifié le .env"
        ]
      };
    } else if (currentLoadError === "NetworkError") {
      return {
        title: "🌐 Erreur réseau",
        message: "Impossible de charger Google Maps. Vérifiez votre connexion internet.",
        instructions: [
          "Vérifiez votre connexion internet",
          "Si vous êtes en production, assurez-vous que :",
          "  - La clé API est correctement configurée dans les variables d'environnement du serveur",
          "  - Les restrictions de domaine incluent votre domaine de production",
          "  - Le domaine utilise HTTPS (requis pour Google Maps en production)",
          "Essayez de recharger la page"
        ]
      };
    } else if (currentLoadError === "LoadError") {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      return {
        title: "⚠️ Erreur de chargement de Google Maps",
        message: "Une erreur est survenue lors du chargement de Google Maps.",
        instructions: [
          "Vérifiez que votre clé API est valide et correctement configurée",
          "En production, la clé API doit être définie dans les variables d'environnement du serveur",
          "La facturation est activée sur votre compte Google Cloud (requis même pour les quotas gratuits)",
          "L'API 'Maps JavaScript API' est activée dans Google Cloud Console",
          "Les restrictions de clé API permettent l'accès depuis :",
          "  - http://localhost:5173/* (développement)",
          currentOrigin ? `  - ${currentOrigin}/* (production)` : "",
          "Le domaine utilise HTTPS en production (requis par Google Maps)",
          "Consultez la console du navigateur (F12) pour plus de détails sur l'erreur"
        ]
      };
    } else {
      const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
      return {
        title: "⚠️ Erreur de chargement de Google Maps",
        message: "Une erreur est survenue lors du chargement de Google Maps.",
        instructions: [
          "Vérifiez que votre clé API est valide et correctement configurée",
          "En production, la clé API doit être définie dans les variables d'environnement du serveur",
          "La facturation est activée sur votre compte Google Cloud (requis même pour les quotas gratuits)",
          "L'API 'Maps JavaScript API' est activée dans Google Cloud Console",
          "Les restrictions de clé API permettent l'accès depuis :",
          "  - http://localhost:5173/* (développement)",
          currentOrigin ? `  - ${currentOrigin}/* (production)` : "",
          "Le domaine utilise HTTPS en production (requis par Google Maps)",
          "Consultez la console du navigateur (F12) pour plus de détails sur l'erreur"
        ]
      };
    }
  };

  if (currentLoadError && currentLoadError !== "Clé API Google Maps non configurée") {
    const errorContent = getErrorContent();
    return (
      <div className={`flex items-center justify-center border border-red-300 rounded-lg bg-red-50 dark:border-red-700 dark:bg-red-900/20 p-6 ${className}`} style={{ height }}>
        <div className="text-left max-w-lg">
          <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
            {errorContent.title}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">
            {errorContent.message}
          </p>
          <div className="text-xs text-red-600 dark:text-red-400 space-y-1 max-h-96 overflow-y-auto">
            <p className="font-medium mb-2">Pour résoudre ce problème :</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              {errorContent.instructions.map((instruction, index) => (
                instruction.trim() ? (
                  <li key={index} className="mb-1 whitespace-pre-line">{instruction}</li>
                ) : (
                  <li key={index} className="mb-2"></li>
                )
              ))}
            </ol>
          </div>
          <div className="mt-4 pt-3 border-t border-red-200 dark:border-red-800 flex gap-3">
            <a
              href="https://console.cloud.google.com/billing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-700 dark:text-red-300 hover:underline font-medium"
            >
              → Créer un compte de facturation
            </a>
            <span className="text-red-300 dark:text-red-700">|</span>
            <a
              href="https://console.cloud.google.com/apis/library/maps-javascript-backend.googleapis.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-red-700 dark:text-red-300 hover:underline font-medium"
            >
              → Activer Maps JavaScript API
            </a>
          </div>
        </div>
      </div>
    );
  }

  const defaultCenter = useMemo(() => {
    if (latitude && longitude && !isNaN(latitude) && !isNaN(longitude)) {
      return { lat: latitude, lng: longitude };
    }
    // Coordonnées par défaut : Abidjan, Côte d'Ivoire
    return { lat: 5.3600, lng: -4.0083 };
  }, [latitude, longitude]);

  const containerStyle = useMemo(
    () => ({
      width: "100%",
      height: height,
    }),
    [height]
  );

  /**
   * Effectue un reverse geocoding pour obtenir les informations d'adresse
   */
  const reverseGeocode = useCallback(
    async (lat: number, lng: number): Promise<LocationAddressInfo | undefined> => {
      if (!isApiAvailable || !window.google?.maps?.Geocoder) {
        if (import.meta.env.DEV) {
          console.warn("[GoogleMapPicker] Geocoder API not available");
        }
        return undefined;
      }

      try {
        const geocoder = new window.google.maps.Geocoder();
        const latlng = { lat, lng };

        return new Promise<LocationAddressInfo | undefined>((resolve) => {
          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results && results.length > 0) {
              const result = results[0];
              const addressInfo: LocationAddressInfo = {
                formatted_address: result.formatted_address,
              };

              // Extraire les composants d'adresse
              if (result.address_components) {
                result.address_components.forEach((component) => {
                  const types = component.types;

                  if (types.includes("street_number")) {
                    addressInfo.street_number = component.long_name;
                  }
                  if (types.includes("route")) {
                    addressInfo.route = component.long_name;
                  }
                  if (types.includes("locality")) {
                    addressInfo.locality = component.long_name;
                    // Utiliser locality comme location_name par défaut
                    if (!addressInfo.location_name) {
                      addressInfo.location_name = component.long_name;
                    }
                  }
                  if (types.includes("administrative_area_level_1")) {
                    addressInfo.administrative_area_level_1 = component.long_name;
                  }
                  if (types.includes("country")) {
                    addressInfo.country = component.long_name;
                  }
                  if (types.includes("postal_code")) {
                    addressInfo.postal_code = component.long_name;
                  }
                });
              }

              // Si pas de location_name trouvé, utiliser formatted_address
              if (!addressInfo.location_name && addressInfo.formatted_address) {
                // Extraire le nom de la localité depuis formatted_address
                const parts = addressInfo.formatted_address.split(",");
                if (parts.length > 0) {
                  addressInfo.location_name = parts[0].trim();
                } else {
                  addressInfo.location_name = addressInfo.formatted_address;
                }
              }

              resolve(addressInfo);
            } else if (status === "ZERO_RESULTS") {
              if (import.meta.env.DEV) {
                console.warn("[GoogleMapPicker] No geocoding results found");
              }
              resolve(undefined);
            } else {
              if (import.meta.env.DEV) {
                console.warn(`[GoogleMapPicker] Geocoding failed: ${status}`);
              }
              resolve(undefined);
            }
          });
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error("[GoogleMapPicker] Geocoding error:", error);
        }
        return undefined;
      }
    },
    [isApiAvailable]
  );

  const onMapClick = useCallback(
    async (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        // Appeler immédiatement avec les coordonnées
        const locationData: LocationData = {
          lat,
          lng,
        };

        // Essayer de récupérer les informations d'adresse en arrière-plan
        setIsGeocoding(true);
        try {
          const addressInfo = await reverseGeocode(lat, lng);
          if (addressInfo) {
            locationData.address = addressInfo;
          }
        } catch (error) {
          if (import.meta.env.DEV) {
            console.error("[GoogleMapPicker] Error during geocoding:", error);
          }
        } finally {
          setIsGeocoding(false);
        }

        // Appeler le callback avec les données complètes
        onLocationSelect(locationData);
      }
    },
    [onLocationSelect, reverseGeocode]
  );

  const onLoad = useCallback(() => {
    setIsMapLoaded(true);
    setLoadError(null);
  }, []);

  const onUnmount = useCallback(() => {
    setIsMapLoaded(false);
  }, []);

  // Si l'API est disponible mais que isMapLoaded est false après un délai, forcer l'affichage
  useEffect(() => {
    if (isLoaded && isApiAvailable && !isMapLoaded) {
      const timeout = setTimeout(() => {
        if (!isMapLoaded && window.google?.maps) {
          setIsMapLoaded(true);
        }
      }, 3000); // Attendre 3 secondes avant de forcer

      return () => clearTimeout(timeout);
    }
  }, [isLoaded, isApiAvailable, isMapLoaded]);


  // Vérifier périodiquement l'état de l'API même après le chargement
  useEffect(() => {
    // Vérifier périodiquement si l'API est toujours disponible
    const apiCheckInterval = setInterval(() => {
      const apiStillAvailable = typeof window !== "undefined" && window.google && window.google.maps;
      
      // Si l'API était disponible mais ne l'est plus, définir une erreur
      if (isApiAvailable && !apiStillAvailable && isMapLoaded) {
        setLoadError("LoadError");
        setIsMapLoaded(false);
      }
      
      // Si l'API devient disponible après une erreur, réinitialiser
      if (!isApiAvailable && apiStillAvailable && currentLoadError) {
        setLoadError(null);
      }
    }, 2000);

    return () => {
      clearInterval(apiCheckInterval);
    };
  }, [isApiAvailable, isMapLoaded, currentLoadError]);

  // Détecter les erreurs Google Maps critiques et vérifier périodiquement si l'API est disponible
  useEffect(() => {
    // Si l'API est déjà disponible, ne rien faire
    if (isApiAvailable) {
      setLoadError(null);
      return;
    }

    // Vérifier périodiquement si l'API devient disponible
    let checkCount = 0;
    const checkInterval = setInterval(() => {
      checkCount++;
      if (typeof window !== "undefined" && window.google && window.google.maps) {
        setLoadError(null);
        clearInterval(checkInterval);
      }
    }, 500);

    // Timeout après 30 secondes
    const timeoutId = setTimeout(() => {
      clearInterval(checkInterval);
      if (!isApiAvailable && !currentLoadError) {
        // Si après 30 secondes l'API n'est toujours pas disponible, définir une erreur générique
        setLoadError("LoadError");
      }
    }, 30000);

    // Écouter uniquement les erreurs critiques Google Maps (pas les "already defined")
    const errorHandler = (event: ErrorEvent) => {
      const errorMessage = event.message || event.filename || '';
      const errorString = errorMessage.toString();
      
      // Ignorer les erreurs "already defined" (gérées par le contexte)
      if (errorString.includes('already defined') || errorString.includes('gmp-internal')) {
        return;
      }
      
      // Ignorer les avertissements de dépréciation Marker
      if (errorString.includes('Marker is deprecated') || errorString.includes('AdvancedMarkerElement')) {
        return;
      }
      
      // Détecter les erreurs critiques Google Maps
      if (errorString.includes('maps.googleapis.com') || errorString.includes('Google Maps')) {
        // Ne définir une erreur que si l'API n'est vraiment plus disponible
        if (!window.google?.maps) {
          if (errorString.includes('BillingNotEnabled') || errorString.includes('billing')) {
            setLoadError("BillingNotEnabled");
          } else if (errorString.includes('ApiNotActivated') || errorString.includes('API not enabled')) {
            setLoadError("ApiNotActivated");
          } else if (errorString.includes('RefererNotAllowed') || errorString.includes('referer')) {
            setLoadError("RefererNotAllowed");
          } else if (errorString.includes('InvalidKey') || errorString.includes('invalid key')) {
            setLoadError("InvalidKey");
          } else if (!currentLoadError) {
            setLoadError("LoadError");
          }
        }
      }
    };

    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const errorMessage = event.reason?.message || String(event.reason) || '';
      
      // Ignorer les erreurs "already presented" (gérées par le contexte)
      if (errorMessage.includes('google api is already presented')) {
        return;
      }
      
      // Détecter les erreurs critiques Google Maps
      if (errorMessage.includes('maps.googleapis.com') || errorMessage.includes('Google Maps')) {
        if (errorMessage.includes('BillingNotEnabled') || errorMessage.includes('billing')) {
          setLoadError("BillingNotEnabled");
        } else if (errorMessage.includes('ApiNotActivated') || errorMessage.includes('API not enabled')) {
          setLoadError("ApiNotActivated");
        } else if (errorMessage.includes('RefererNotAllowed') || errorMessage.includes('referer')) {
          setLoadError("RefererNotAllowed");
        } else if (errorMessage.includes('InvalidKey') || errorMessage.includes('invalid key')) {
          setLoadError("InvalidKey");
        } else if (!currentLoadError) {
          setLoadError("LoadError");
        }
      }
    };

    // Écouter les erreurs (mais les erreurs "already defined" seront interceptées par le contexte)
    window.addEventListener('error', errorHandler);
    window.addEventListener('unhandledrejection', unhandledRejectionHandler);

    return () => {
      clearInterval(checkInterval);
      clearTimeout(timeoutId);
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
    };
  }, [isApiAvailable, currentLoadError]);


  // Afficher la carte si l'API est chargée et disponible, même si onLoad n'a pas encore été appelé
  const canDisplayMap = isLoaded && isApiAvailable;
  const isLoading = !canDisplayMap || (!isMapLoaded && !currentLoadError);
  const shouldShowError = currentLoadError && (!isMapLoaded || !isApiAvailable);
  

  return (
    <div className={`relative rounded-lg border border-gray-300 overflow-hidden dark:border-gray-700 ${className}`}>
      {isLoading && !shouldShowError && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">Chargement de la carte...</p>
          </div>
        </div>
      )}
      {isGeocoding && (
        <div className="absolute top-2 right-2 z-20 flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 shadow-md">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#04b05d] border-t-transparent" />
          <p className="text-xs text-gray-600 dark:text-gray-300">Récupération de l'adresse...</p>
        </div>
      )}
      {canDisplayMap ? (
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={defaultCenter}
          zoom={latitude && longitude ? 15 : 10}
          onClick={onMapClick}
          onLoad={onLoad}
          onUnmount={onUnmount}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: true,
            clickableIcons: false,
          }}
        >
          {latitude && longitude && (
            <Marker
              position={{ lat: latitude, lng: longitude }}
              animation={google.maps.Animation.DROP}
            />
          )}
        </GoogleMap>
      ) : (
        !currentLoadError && (
          <div className="flex items-center justify-center" style={{ height }}>
            <div className="text-center p-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Initialisation de la carte...
              </p>
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default GoogleMapPicker;



