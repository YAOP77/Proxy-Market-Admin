/**
 * Composant WelcomeCard - Card de bienvenue pour le dashboard
 * 
 * Affiche une card de bienvenue avec :
 * - Une image à gauche qui déborde légèrement
 * - Un message de bienvenue personnalisé avec le nom de l'utilisateur
 * - Une description sous le message principal
 * - Une image de fond (administrador-solidario.jpg)
 */

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import adminService, { Admin } from "../../services/api/adminService";

export default function WelcomeCard() {
  const { user } = useAuth();
  const [adminDetails, setAdminDetails] = useState<Admin | null>(null);

  // Récupérer les détails de l'admin pour obtenir le nom complet
  useEffect(() => {
    const fetchAdminDetails = async () => {
      if (!user?.email) {
        return;
      }

      try {
        const adminsResponse = await adminService.getAdmins();
        const admins = adminsResponse.data || [];
        const matchedAdmin = admins.find(
          (admin: Admin) => admin.email?.toLowerCase() === user.email.toLowerCase()
        );
        setAdminDetails(matchedAdmin ?? null);
      } catch (error) {
        // En cas d'erreur, on utilise le nom du contexte
        setAdminDetails(null);
      }
    };

    fetchAdminDetails();
  }, [user?.email]);

  // Construire le nom complet de l'utilisateur
  const userName = useMemo(() => {
    // Priorité 1: Nom complet depuis les détails de l'admin (prenoms + nom)
    if (adminDetails) {
      const prenoms = adminDetails.prenoms?.trim() ?? "";
      const nom = adminDetails.nom?.trim() ?? "";
      const fullName = `${prenoms} ${nom}`.trim();
      if (fullName.length > 0) {
        return fullName;
      }
    }

    // Priorité 2: Nom depuis le contexte d'authentification
    if (user?.name?.trim()) {
      return user.name.trim();
    }

    // Priorité 3: Partie avant @ de l'email
    if (user?.email) {
      return user.email.split("@")[0];
    }

    return "";
  }, [adminDetails, user]);

  return (
    <div className="relative">
      {/* Image à gauche - déborde sur la gauche et vers le bas (desktop uniquement, pas sur mobile) */}
      <div className="hidden sm:block absolute left-0 bottom-0 translate-y-4 md:translate-y-6 lg:translate-y-8 -translate-x-6 md:-translate-x-8 lg:-translate-x-10 w-48 sm:w-56 md:w-72 lg:w-80 xl:w-96 h-auto z-10">
        <img
          src="/images/task/Olá - Relaxing.png"
          alt="Bienvenue"
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Card avec le contenu texte et image de fond */}
      <div className="rounded-2xl border border-neutral-300 dark:border-neutral-400 overflow-hidden relative">
        {/* Image de fond */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('/images/task/administrador-solidario.jpg')"
          }}
        />
        {/* Overlay très léger pour améliorer la lisibilité du texte sans masquer l'image */}
        <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-white/15 to-transparent dark:from-gray-900/30 dark:via-gray-900/20 dark:to-transparent" />
        
        {/* Contenu texte */}
        <div className="relative flex flex-col md:flex-row items-center min-h-[160px] sm:min-h-[140px] md:min-h-[160px] lg:min-h-[180px] xl:min-h-[200px] pl-4 sm:pl-40 md:pl-56 lg:pl-64 xl:pl-80 pr-4 sm:pr-6 md:pr-8 lg:pr-10 pt-4 pb-20 sm:pb-16 md:py-5 lg:py-6 z-10">
          <div className="flex-1 flex flex-col justify-center w-full text-center sm:text-left">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-5xl font-bold text-white dark:text-white/90 mb-1 sm:mb-1.5 leading-tight drop-shadow-lg">
              {userName ? (
                <>
                  Bienvenue{" "}
                  <span className="text-green-600">{userName}</span>
                </>
              ) : (
                "Bienvenue"
              )}
            </h2>
            <p className="text-xs sm:text-sm md:text-sm lg:text-sm text-white dark:text-gray-200 font-medium drop-shadow-md">
              Vous avez la gestions totale des administrateurs, les franchisés, les clients,
              les commandes et et la possibilité de voir les statistiques de vente pour optimiser votre activité.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
