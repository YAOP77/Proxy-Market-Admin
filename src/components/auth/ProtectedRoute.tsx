/**
 * Composant ProtectedRoute - Protection des routes nécessitant une authentification
 * 
 * Ce composant :
 * - Vérifie si l'utilisateur est authentifié
 * - Vérifie si l'utilisateur a un rôle admin
 * - Redirige vers /signin si non authentifié ou non autorisé
 * - Affiche un loader pendant la vérification
 * - Permet l'accès à la route si authentifié avec le bon rôle
 */

import { ReactNode, useEffect, useRef } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

// Rôles autorisés pour accéder à l'application
const ALLOWED_ROLES = new Set(["admin", "super_admin"]);

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, logout } = useAuth();
  const location = useLocation();
  
  // Utiliser useRef pour éviter les appels multiples à logout
  const hasLoggedOut = useRef(false);

  const normalizedRole = user?.role?.toLowerCase().replace(/\s+/g, "_");
  const hasAdminRole = normalizedRole ? ALLOWED_ROLES.has(normalizedRole) : false;

  // Si l'utilisateur est authentifié mais n'a pas le bon rôle, le déconnecter
  useEffect(() => {
    if (!isLoading && isAuthenticated && !hasAdminRole && !hasLoggedOut.current) {
      hasLoggedOut.current = true;
      // Déconnecter l'utilisateur de manière asynchrone
      logout().catch(() => {
        // Ignorer les erreurs de déconnexion
      });
    }
  }, [isLoading, isAuthenticated, hasAdminRole, logout]);

  // Afficher un loader pendant la vérification de l'authentification
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white dark:bg-gray-900">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[#04b05d] border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Vérification de l'authentification...
          </p>
        </div>
      </div>
    );
  }

  // Rediriger vers /signin si non authentifié
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  // Rediriger vers /signin avec raison "unauthorized" si pas le bon rôle
  // La déconnexion sera effectuée par le useEffect ci-dessus
  if (!hasAdminRole) {
    return <Navigate to="/signin" state={{ from: location, reason: "unauthorized" }} replace />;
  }

  // Accès autorisé
  return <>{children}</>;
}
