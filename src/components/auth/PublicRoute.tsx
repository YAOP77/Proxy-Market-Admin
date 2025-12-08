/**
 * Composant PublicRoute - Route accessible uniquement si non authentifié
 * 
 * Ce composant :
 * - Redirige vers le dashboard si l'utilisateur est déjà connecté ET a le bon rôle
 * - Permet l'accès à la route si non authentifié OU si authentifié sans le bon rôle
 */

import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface PublicRouteProps {
  children: ReactNode;
}

// Rôles autorisés pour accéder à l'application
const ALLOWED_ROLES = new Set(["admin", "super_admin"]);

/**
 * Vérifie si l'utilisateur a un rôle admin
 */
function hasAdminRole(role: string | undefined): boolean {
  if (!role) return false;
  const normalizedRole = role.toLowerCase().replace(/\s+/g, "_");
  return ALLOWED_ROLES.has(normalizedRole);
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Afficher le contenu pendant la vérification
  if (isLoading) {
    return <>{children}</>;
  }

  // Rediriger vers le dashboard UNIQUEMENT si :
  // - L'utilisateur est authentifié ET
  // - L'utilisateur a un rôle admin valide
  if (isAuthenticated && hasAdminRole(user?.role)) {
    return <Navigate to="/" replace />;
  }

  // Accès autorisé pour :
  // - Les utilisateurs non authentifiés
  // - Les utilisateurs authentifiés mais sans rôle admin (pour voir le message d'erreur)
  return <>{children}</>;
}
