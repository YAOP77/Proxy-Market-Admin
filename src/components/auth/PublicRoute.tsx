/**
 * Composant PublicRoute - Route accessible uniquement si non authentifié
 * 
 * Ce composant :
 * - Redirige vers le dashboard si l'utilisateur est déjà connecté
 * - Permet l'accès à la route si non authentifié
 */

import { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../../context/AuthContext";

interface PublicRouteProps {
  children: ReactNode;
}

export default function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Afficher le contenu pendant la vérification
  if (isLoading) {
    return <>{children}</>;
  }

  // Rediriger vers le dashboard si déjà authentifié
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Accès autorisé pour les utilisateurs non authentifiés
  return <>{children}</>;
}

