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
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]') as HTMLScriptElement | null;
    if (existingScript) {
      // Si l'API est déjà disponible, résoudre immédiatement
      if (window.google && window.google.maps) {
        resolve();
        return;
      }
      
      // Attendre que le script existant se charge (avec timeout)
      let resolved = false;
      const checkExisting = setInterval(() => {
        if (window.google && window.google.maps && !resolved) {
          clearInterval(checkExisting);
          resolved = true;
          resolve();
        }
      }, 100);
      
      // Timeout pour le script existant (20 secondes)
      const timeoutId = setTimeout(() => {
        clearInterval(checkExisting);
        if (!resolved) {
          resolved = true;
          // Si après 20 secondes le script n'est toujours pas chargé, rejeter
          // Le retry logic dans le contexte gérera la nouvelle tentative
          reject(new Error('Existing script timeout'));
        }
      }, 20000);
      
      // Si le script existant se charge avec succès
      existingScript.addEventListener('load', () => {
        const checkAfterLoad = setInterval(() => {
          if (window.google && window.google.maps && !resolved) {
            clearInterval(checkAfterLoad);
            clearInterval(checkExisting);
            clearTimeout(timeoutId);
            resolved = true;
            resolve();
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkAfterLoad);
          clearInterval(checkExisting);
          clearTimeout(timeoutId);
          if (window.google && window.google.maps && !resolved) {
            resolved = true;
            resolve();
          } else if (!resolved) {
            resolved = true;
            reject(new Error('Script loaded but API not available'));
          }
        }, 10000);
      }, { once: true });
      
      // Si le script existant a une erreur
      existingScript.addEventListener('error', () => {
        clearInterval(checkExisting);
        clearTimeout(timeoutId);
        if (!resolved) {
          resolved = true;
          existingScript.remove();
          reject(new Error('Failed to load existing script'));
        }
      }, { once: true });
      
      return;
    }

    // Créer une fonction de callback globale pour gérer les erreurs Google Maps
    const callbackName = `initGoogleMaps_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    let callbackExecuted = false;
    let scriptRemoved = false;
    
    // Définir le callback global
    (window as any)[callbackName] = () => {
      callbackExecuted = true;
      // Attendre que l'objet google.maps soit disponible
      const checkInterval = setInterval(() => {
        if (window.google && window.google.maps) {
          clearInterval(checkInterval);
          if ((window as any)[callbackName]) {
            delete (window as any)[callbackName];
          }
          resolve();
        }
      }, 100);
      
      // Timeout après 15 secondes
      setTimeout(() => {
        clearInterval(checkInterval);
        if (window.google && window.google.maps) {
          if ((window as any)[callbackName]) {
            delete (window as any)[callbackName];
          }
          resolve();
        } else {
          if ((window as any)[callbackName]) {
            delete (window as any)[callbackName];
          }
          reject(new Error('Google Maps API loaded but not available'));
        }
      }, 15000);
    };

    // Créer et insérer le script avec callback
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    
    // Gestionnaire d'erreur pour le script
    const scriptErrorHandler = () => {
      if (!scriptRemoved) {
        scriptRemoved = true;
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
        if (script.parentNode) {
          script.remove();
        }
        reject(new Error('Failed to load Google Maps script'));
      }
    };
    
    script.onerror = scriptErrorHandler;
    
    script.onload = () => {
      // Si le callback n'a pas été exécuté après 3 secondes, vérifier manuellement
      setTimeout(() => {
        if (!callbackExecuted && !scriptRemoved) {
          if (window.google && window.google.maps) {
            if ((window as any)[callbackName]) {
              delete (window as any)[callbackName];
            }
            resolve();
          } else {
            // Le script s'est chargé mais l'API n'est pas disponible
            // Cela peut indiquer une erreur de clé API ou de facturation
            if ((window as any)[callbackName]) {
              delete (window as any)[callbackName];
            }
            reject(new Error('Google Maps API failed to initialize - check API key and billing'));
          }
        }
      }, 3000);
    };
    
    // Ajouter un gestionnaire d'erreur global pour les erreurs Google Maps
    const errorHandler = (event: ErrorEvent) => {
      const errorMessage = String(event.message || event.filename || '');
      const errorSource = String(event.filename || '');
      
      // Détecter les erreurs Google Maps spécifiques
      if ((errorMessage.includes('maps.googleapis.com') || errorSource.includes('maps.googleapis.com') || 
           errorMessage.includes('Google Maps') || errorMessage.includes('gmp')) && !scriptRemoved) {
        scriptRemoved = true;
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
        if (script.parentNode) {
          script.remove();
        }
        
        // Détecter le type d'erreur spécifique
        let errorType = 'LoadError';
        if (errorMessage.includes('BillingNotEnabled') || errorMessage.includes('billing')) {
          errorType = 'BillingNotEnabled';
        } else if (errorMessage.includes('ApiNotActivated') || errorMessage.includes('API not enabled')) {
          errorType = 'ApiNotActivated';
        } else if (errorMessage.includes('RefererNotAllowed') || errorMessage.includes('referer')) {
          errorType = 'RefererNotAllowed';
        } else if (errorMessage.includes('InvalidKey') || errorMessage.includes('invalid key')) {
          errorType = 'InvalidKey';
        }
        
        reject(new Error(errorType));
      }
    };
    
    // Gestionnaire pour les rejets de promesses non gérés
    const unhandledRejectionHandler = (event: PromiseRejectionEvent) => {
      const errorMessage = String(event.reason?.message || event.reason || '');
      if ((errorMessage.includes('maps.googleapis.com') || errorMessage.includes('Google Maps')) && !scriptRemoved) {
        scriptRemoved = true;
        if ((window as any)[callbackName]) {
          delete (window as any)[callbackName];
        }
        if (script.parentNode) {
          script.remove();
        }
        reject(new Error('Google Maps promise rejection'));
      }
    };
    
    window.addEventListener('error', errorHandler, { once: true });
    window.addEventListener('unhandledrejection', unhandledRejectionHandler, { once: true });
    
    document.head.appendChild(script);
    
    // Nettoyer après 20 secondes
    const cleanupTimeout = setTimeout(() => {
      window.removeEventListener('error', errorHandler);
      window.removeEventListener('unhandledrejection', unhandledRejectionHandler);
      if ((window as any)[callbackName] && !callbackExecuted) {
        delete (window as any)[callbackName];
      }
    }, 20000);
    
    // Nettoyer le timeout si la promesse est résolue
    Promise.resolve().then(() => {
      clearTimeout(cleanupTimeout);
    });
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

    // Charger le script avec retry logic
    const loadWithRetry = async (retries = 2): Promise<void> => {
      try {
        await loadGoogleMapsScript(googleMapsApiKey);
        setIsLoaded(true);
        setLoadError(null);
        isScriptLoaded = true;
        isScriptLoading = false;
        hasInitialized.current = true;
        isInitializing.current = false;
      } catch (error) {
        // Si on a encore des tentatives, réessayer
        if (retries > 0) {
          // Attendre un peu avant de réessayer
          await new Promise(resolve => setTimeout(resolve, 1000));
          return loadWithRetry(retries - 1);
        }
        
        // Plus de tentatives, définir l'erreur
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        // Détecter le type d'erreur
        let detectedError: string | null = null;
        if (errorMessage.includes('BillingNotEnabled') || errorMessage.includes('billing')) {
          detectedError = "BillingNotEnabled";
        } else if (errorMessage.includes('ApiNotActivated') || errorMessage.includes('API not enabled')) {
          detectedError = "ApiNotActivated";
        } else if (errorMessage.includes('RefererNotAllowed') || errorMessage.includes('referer')) {
          detectedError = "RefererNotAllowed";
        } else if (errorMessage.includes('InvalidKey') || errorMessage.includes('invalid key')) {
          detectedError = "InvalidKey";
        } else if (errorMessage.includes('Failed to load')) {
          detectedError = "NetworkError";
        } else {
          detectedError = "LoadError";
        }
        
        // Utiliser l'erreur originale pour éviter la boucle
        if (import.meta.env.DEV) {
          console.error("Erreur lors du chargement de Google Maps:", errorMessage);
        }
        
        setLoadError(detectedError);
        isScriptLoading = false;
        hasInitialized.current = true;
        isInitializing.current = false;
      }
    };
    
    loadWithRetry();
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

