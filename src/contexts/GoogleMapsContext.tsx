/**
 * Contexte Google Maps - Gestion du chargement unique de l'API Google Maps
 * 
 * Ce contexte garantit que l'API Google Maps n'est chargée qu'une seule fois
 * dans toute l'application, évitant les erreurs de chargement multiple.
 * 
 * Il intercepte également les erreurs "already defined" pour éviter qu'elles
 * n'apparaissent dans la console du navigateur.
 */

import { createContext, useContext, useState, useEffect, useRef, ReactNode } from "react";

// Variable globale pour suivre si le script a déjà été chargé
let isScriptLoading = false;
let isScriptLoaded = false;

interface GoogleMapsContextType {
  isLoaded: boolean;
  loadError: string | null;
  googleMapsApiKey: string | undefined;
}

const GoogleMapsContext = createContext<GoogleMapsContextType | undefined>(undefined);

interface GoogleMapsProviderProps {
  children: ReactNode;
}

/**
 * Charge le script Google Maps manuellement (une seule fois)
 */
const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Vérifier si le script est déjà chargé
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      resolve();
      return;
    }

    // Vérifier si un script est déjà en cours de chargement
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Attendre que le script existant se charge
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () => reject(new Error('Failed to load')));
      return;
    }

    // Créer et insérer le script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      // Attendre que l'objet google.maps soit disponible
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      
      // Timeout après 10 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google && window.google.maps) {
          resolve();
        } else {
          reject(new Error('Google Maps API loaded but not available'));
        }
      }, 10000);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });
};

/**
 * Provider pour Google Maps - Charge l'API une seule fois
 */
export function GoogleMapsProvider({ children }: GoogleMapsProviderProps) {
  const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Utiliser useRef pour éviter les re-renders inutiles
  const hasInitialized = useRef(false);
  const isInitializing = useRef(false);
  
  const [isLoaded, setIsLoaded] = useState(() => {
    // Vérifier immédiatement si l'API est déjà chargée
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      isScriptLoaded = true;
      hasInitialized.current = true;
      return true;
    }
    if (isScriptLoaded) {
      hasInitialized.current = true;
      return true;
    }
    return false;
  });
  
  const [loadError, setLoadError] = useState<string | null>(null);

  // Intercepter les erreurs "already defined" de Google Maps avant qu'elles n'apparaissent dans la console
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Utiliser une référence pour éviter les problèmes de closure
    const isMountedRef = { current: true };

    // Intercepter uniquement les erreurs window.error liées à Google Maps
    const errorHandler = (event: ErrorEvent) => {
      // Ne pas intercepter si le composant est démonté
      if (!isMountedRef.current) return;

      const errorMessage = event.message || event.filename || '';
      const errorString = errorMessage.toString();
      
      // Ignorer uniquement les erreurs spécifiques à Google Maps
      // Ne pas intercepter les erreurs React Router ou autres erreurs critiques
      if (
        (errorString.includes("already defined") && (errorString.includes("gmp") || errorString.includes("google"))) ||
        (errorString.includes("gmp-internal") || errorString.includes("gmp-map")) ||
        (errorString.includes("Element with name") && errorString.includes("gmp")) ||
        errorString.includes("google api is already presented") ||
        (errorString.includes("Cannot read properties of undefined") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN"))) ||
        (errorString.includes("reading") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN")) && errorString.includes("google")) ||
        errorString.includes("BillingNotEnabledMapError") ||
        errorString.includes("BillingNotEnabled") ||
        errorString.includes("billing-not-enabled") ||
        errorString.includes("Google Maps JavaScript API error")
      ) {
        // Empêcher la propagation de ces erreurs dans la console
        event.stopImmediatePropagation();
        event.preventDefault();
        return false;
      }
    };

    // Écouter les erreurs en phase de capture (avant qu'elles n'atteignent la console)
    window.addEventListener("error", errorHandler, true);

    // Intercepter également les rejets de promesses non gérés liés à Google Maps
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      // Ne pas intercepter si le composant est démonté
      if (!isMountedRef.current) return;

      const errorMessage =
        (event.reason?.message || String(event.reason) || "").toString();
      
      // Ignorer uniquement les erreurs spécifiques à Google Maps
      if (
        (errorMessage.includes("google api is already presented") || 
         (errorMessage.includes("already defined") && errorMessage.includes("google"))) ||
        (errorMessage.includes("gmp-internal") || errorMessage.includes("gmp-map")) ||
        (errorMessage.includes("Cannot read properties of undefined") && (errorMessage.includes("DJ") || errorMessage.includes("ip") || errorMessage.includes("LN"))) ||
        ((errorMessage.includes("reading 'DJ'") || errorMessage.includes("reading 'ip'") || errorMessage.includes("reading 'LN'")) && errorMessage.includes("google")) ||
        (errorMessage.includes("reading") && (errorMessage.includes("DJ") || errorMessage.includes("ip") || errorMessage.includes("LN")) && errorMessage.includes("google")) ||
        (errorMessage.includes("TypeError") && (errorMessage.includes("DJ") || errorMessage.includes("ip") || errorMessage.includes("LN")) && errorMessage.includes("google")) ||
        errorMessage.includes("BillingNotEnabledMapError") ||
        errorMessage.includes("BillingNotEnabled") ||
        errorMessage.includes("billing-not-enabled") ||
        errorMessage.includes("Google Maps JavaScript API error")
      ) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    };

    window.addEventListener("unhandledrejection", unhandledRejectionHandler, true);

    // Intercepter également les erreurs via console.error (si possible)
    // Utiliser une référence pour éviter les problèmes de closure
    const originalConsoleError = console.error;
    const consoleErrorWrapper = (...args: unknown[]) => {
      // Ne pas intercepter si le composant est démonté
      if (!isMountedRef.current) {
        originalConsoleError.apply(console, args);
        return;
      }

      const errorString = args.map(arg => String(arg)).join(' ');
      
      // Ignorer uniquement les erreurs spécifiques à Google Maps
      // Ne pas intercepter les erreurs React Router ou autres erreurs critiques
      if (
        (errorString.includes("already defined") && (errorString.includes("gmp") || errorString.includes("google"))) ||
        (errorString.includes("gmp-internal") || errorString.includes("gmp-map")) ||
        (errorString.includes("Element with name") && errorString.includes("gmp")) ||
        errorString.includes("google api is already presented") ||
        (errorString.includes("Cannot read properties of undefined") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN"))) ||
        ((errorString.includes("reading 'DJ'") || errorString.includes("reading 'ip'") || errorString.includes("reading 'LN'")) && errorString.includes("google")) ||
        (errorString.includes("reading") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN")) && errorString.includes("google")) ||
        (errorString.includes("TypeError") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN")) && errorString.includes("google")) ||
        errorString.includes("BillingNotEnabledMapError") ||
        errorString.includes("BillingNotEnabled") ||
        errorString.includes("billing-not-enabled") ||
        errorString.includes("Google Maps JavaScript API error")
      ) {
        // Ne pas afficher ces erreurs dans la console
        return;
      }
      // Appeler la fonction originale pour les autres erreurs
      originalConsoleError.apply(console, args);
    };
    
    // Remplacer console.error uniquement si ce n'est pas déjà fait
    if (console.error === originalConsoleError) {
      console.error = consoleErrorWrapper;
    }

    // Intercepter également les erreurs non gérées via window.onerror
    const originalOnError = window.onerror;
    const onErrorHandler = (message: string | Event | null, source?: string | null, lineno?: number | null, colno?: number | null, error?: Error | null) => {
      // Ne pas intercepter si le composant est démonté
      if (!isMountedRef.current) {
        if (originalOnError) {
          return originalOnError(message ?? "", source || undefined, lineno || undefined, colno || undefined, error || undefined);
        }
        return false;
      }

      const errorString = String(message || error?.message || "");
      
      // Ignorer uniquement les erreurs spécifiques à Google Maps
      // Ne pas intercepter les erreurs React Router ou autres erreurs critiques
      if (
        (errorString.includes("already defined") && (errorString.includes("gmp") || errorString.includes("google"))) ||
        (errorString.includes("gmp-internal") || errorString.includes("gmp-map")) ||
        (errorString.includes("Element with name") && errorString.includes("gmp")) ||
        errorString.includes("google api is already presented") ||
        (errorString.includes("Cannot read properties of undefined") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN"))) ||
        ((errorString.includes("reading 'DJ'") || errorString.includes("reading 'ip'") || errorString.includes("reading 'LN'")) && errorString.includes("google")) ||
        (errorString.includes("reading") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN")) && errorString.includes("google")) ||
        (errorString.includes("TypeError") && (errorString.includes("DJ") || errorString.includes("ip") || errorString.includes("LN")) && errorString.includes("google")) ||
        errorString.includes("BillingNotEnabledMapError") ||
        errorString.includes("BillingNotEnabled") ||
        errorString.includes("billing-not-enabled") ||
        errorString.includes("Google Maps JavaScript API error")
      ) {
        // Empêcher l'affichage de ces erreurs
        return true;
      }
      // Appeler le gestionnaire d'erreur original pour les autres erreurs
      if (originalOnError) {
        return originalOnError(message ?? "", source || undefined, lineno || undefined, colno || undefined, error || undefined);
      }
      return false;
    };
    
    window.onerror = onErrorHandler;

    return () => {
      isMountedRef.current = false;
      window.removeEventListener("error", errorHandler, true);
      window.removeEventListener("unhandledrejection", unhandledRejectionHandler, true);
      // Restaurer console.error uniquement si c'est notre wrapper
      if (console.error === consoleErrorWrapper) {
      console.error = originalConsoleError;
      }
      // Restaurer window.onerror uniquement si c'est notre handler
      if (window.onerror === onErrorHandler) {
      window.onerror = originalOnError;
      }
    };
  }, []);

  // Charger le script Google Maps au montage du composant
  useEffect(() => {
    // Éviter les appels multiples
    if (hasInitialized.current || isInitializing.current) {
      return;
    }

    // Si pas de clé API, ne rien faire
    if (!googleMapsApiKey) {
      setLoadError("Clé API Google Maps non configurée");
      hasInitialized.current = true;
      return;
    }

    // Vérifier si déjà chargé
    if (typeof window !== "undefined" && window.google && window.google.maps) {
      setIsLoaded(true);
      setLoadError(null);
      isScriptLoaded = true;
      hasInitialized.current = true;
      return;
    }

    // Si déjà chargé ou en cours de chargement, ne rien faire
    if (isScriptLoaded || isScriptLoading) {
      if (isScriptLoaded) {
        setIsLoaded(true);
        setLoadError(null);
        hasInitialized.current = true;
      }
      return;
    }

    // Marquer comme en cours d'initialisation
    isInitializing.current = true;
    isScriptLoading = true;

    // Charger le script
    loadGoogleMapsScript(googleMapsApiKey)
      .then(() => {
        setIsLoaded(true);
        setLoadError(null);
        isScriptLoaded = true;
        isScriptLoading = false;
        hasInitialized.current = true;
        isInitializing.current = false;
      })
      .catch((error) => {
        // Utiliser l'erreur originale pour éviter la boucle
        const originalConsoleError = console.error;
        originalConsoleError("Erreur lors du chargement de Google Maps:", error);
        setLoadError("Erreur de chargement");
        isScriptLoading = false;
        hasInitialized.current = true;
        isInitializing.current = false;
      });
  }, [googleMapsApiKey]);

  return (
    <GoogleMapsContext.Provider
      value={{
        isLoaded,
        loadError,
        googleMapsApiKey,
      }}
    >
      {children}
    </GoogleMapsContext.Provider>
  );
}

/**
 * Hook pour accéder au contexte Google Maps
 */
export function useGoogleMaps() {
  const context = useContext(GoogleMapsContext);
  if (context === undefined) {
    throw new Error("useGoogleMaps doit être utilisé à l'intérieur d'un GoogleMapsProvider");
  }
  return context;
}

