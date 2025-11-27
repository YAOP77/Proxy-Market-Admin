/**
 * Composant ProtectedRoute - Protection des routes nécessitant une authentification
 * 
 * Ce composant :
 * - Vérifie si l'utilisateur est authentifié
 * - Redirige vers /signin si non authentifié
 * - Affiche un loader pendant la vérification
 * - Permet l'accès à la route si authentifié
 */

import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";
interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const normalizedRole = user?.role?.toLowerCase().replace(/\s+/g, "_");
  const allowedRoles = new Set(["admin", "super_admin"]);
  const hasAdminRole = normalizedRole ? allowedRoles.has(normalizedRole) : false;

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
  // Sauvegarder la location actuelle pour rediriger après connexion
  if (!isAuthenticated) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  if (!hasAdminRole) {
    return <Navigate to="/signin" state={{ from: location, reason: "unauthorized" }} replace />;
  }

  // Accès autorisé
  return <>{children}</>;
}

