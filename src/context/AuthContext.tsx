/**
 * Contexte d'authentification - Gestion de l'état de connexion
 * 
 * Ce contexte fournit :
 * - L'état de connexion de l'utilisateur
 * - Les fonctions de connexion et déconnexion
 * - La vérification de l'authentification
 * - La persistance de la session via localStorage
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import authService, { LoginResponse } from "../services/api/authService";

interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  roleLabel?: string;
  role_slug?: string;
  role_name?: string;
  type?: string;
  user_type?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  isLoading: boolean;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Clé pour le localStorage
const AUTH_STORAGE_KEY = "proxy_market_auth";
const USER_STORAGE_KEY = "proxy_market_user";

const normalizeRoleValue = (value: unknown): string | null => {
  if (!value) {
    return null;
  }

  if (typeof value === "string") {
    return value.trim() || null;
  }

  if (typeof value === "object") {
    const source = value as Record<string, unknown>;
    return (
      normalizeRoleValue(
        source.slug ||
          source.name ||
          source.label ||
          source.title ||
          source.role
      ) || null
    );
  }

  return null;
};

const getRoleInfo = (rawRole: unknown): { role: string; label: string } => {
  if (!rawRole) {
    return { role: "guest", label: "Invité" };
  }

  if (typeof rawRole === "string") {
    const label = rawRole.trim();
    const roleSlug = label.toLowerCase().replace(/\s+/g, "_");
    return { role: roleSlug || "guest", label: label || "Invité" };
  }

  if (typeof rawRole === "object") {
    const roleObj = rawRole as Record<string, unknown>;
    return getRoleInfo(
      roleObj.slug ||
        roleObj.role_slug ||
        roleObj.name ||
        roleObj.label ||
        roleObj.title ||
        roleObj.role ||
        roleObj.type ||
        roleObj.user_type
    );
  }

  return { role: "guest", label: "Invité" };
};

const extractRoleCandidate = (source: Record<string, unknown>): unknown => {
  return (
    source.role_slug ||
    source.roleSlug ||
    source.role_label ||
    source.roleLabel ||
    source.role_name ||
    source.roleName ||
    source.type ||
    source.user_type ||
    source.role ||
    source.userRole
  );
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Vérifie si l'utilisateur est authentifié au chargement
   */
  useEffect(() => {
    const checkAuth = () => {
      try {
        const authToken = localStorage.getItem(AUTH_STORAGE_KEY);
        const userData = localStorage.getItem(USER_STORAGE_KEY);

        if (authToken && userData) {
          // Vérifier si le token est valide (non expiré)
          const tokenData = JSON.parse(authToken);
          const now = Date.now();

          if (tokenData.expiresAt && tokenData.expiresAt > now) {
            const parsedUser = JSON.parse(userData);
            const roleInfo = getRoleInfo(
              extractRoleCandidate(parsedUser) || parsedUser
            );
            setIsAuthenticated(true);
            setUser({
              ...parsedUser,
              role: roleInfo.role,
              roleLabel: roleInfo.label,
            });
            localStorage.setItem(
              USER_STORAGE_KEY,
              JSON.stringify({
                ...parsedUser,
                role: roleInfo.role,
                roleLabel: roleInfo.label,
              })
            );
          } else {
            // Token expiré, nettoyer le localStorage
            localStorage.removeItem(AUTH_STORAGE_KEY);
            localStorage.removeItem(USER_STORAGE_KEY);
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        // Ne pas logger l'erreur pour éviter d'exposer des informations sensibles
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Fonction de connexion
   * @param email - Email de l'utilisateur
   * @param password - Mot de passe de l'utilisateur
   * @returns Promise<{ success: boolean; error?: string }> - Résultat de la connexion
   */
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Appeler l'API d'authentification
      const response: LoginResponse = await authService.login({ email, password });

        if (response.success && response.data) {
        const { token, user: userData, expiresIn } = response.data;

        // Calculer la date d'expiration
        // Si expiresIn est fourni par l'API, l'utiliser, sinon utiliser 24h par défaut
        const expiresAt = expiresIn 
          ? Date.now() + expiresIn * 1000 
          : Date.now() + 24 * 60 * 60 * 1000; // 24 heures par défaut

        // Sauvegarder le token et les données utilisateur
        const tokenData = {
          token,
          expiresAt,
        };

        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokenData));
        const rawRoleSource = userData as Record<string, unknown>;
        const roleInfo = getRoleInfo(
          extractRoleCandidate(rawRoleSource) || rawRoleSource.role
        );
        const sanitizedUser = {
          ...userData,
          role: roleInfo.role,
          roleLabel: roleInfo.label,
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(sanitizedUser));

        // Mettre à jour l'état
        setIsAuthenticated(true);
        setUser(sanitizedUser);

        return { success: true };
      } else {
        // Réponse de l'API indiquant un échec
        return { 
          success: false, 
          error: response.message || "Erreur lors de la connexion" 
        };
      }
    } catch (error: any) {
      // Transmettre le message d'erreur spécifique depuis authService
      // Le service a déjà analysé l'erreur et fourni un message approprié
      const errorMessage = error.message || "Une erreur est survenue lors de la connexion";
      
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  };

  /**
   * Fonction de déconnexion
   */
  const logout = async (): Promise<void> => {
    try {
      // Appeler l'API de déconnexion
      await authService.logout();
    } catch (error) {
      // Ne pas logger l'erreur pour éviter d'exposer des informations sensibles
    } finally {
      // Nettoyer le localStorage même en cas d'erreur API
      localStorage.removeItem(AUTH_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);

      // Mettre à jour l'état
      setIsAuthenticated(false);
      setUser(null);
    }
  };

  const updateUser = (data: Partial<User>) => {
    setUser((prevUser) => {
      if (!prevUser) {
        return prevUser;
      }

      const mergedData = { ...prevUser, ...data } as Record<string, unknown>;
      const roleInfo = getRoleInfo(
        mergedData.role ||
          mergedData.roleLabel ||
          mergedData.role_name ||
          mergedData.role_slug ||
          mergedData.type ||
          mergedData.user_type
      );

      const updatedUser: User = {
        ...prevUser,
        ...data,
        role: roleInfo.role,
        roleLabel: roleInfo.label,
      };

      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const value: AuthContextType = {
        isAuthenticated,
        user,
        login,
        logout,
        isLoading,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook personnalisé pour utiliser le contexte d'authentification
 * @throws Error si utilisé en dehors d'un AuthProvider
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth doit être utilisé dans un AuthProvider");
  }
  return context;
}

