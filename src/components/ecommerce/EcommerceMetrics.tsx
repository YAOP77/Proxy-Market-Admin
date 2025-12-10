import { useEffect, useState } from "react";
import {
  BoxIcon,
  GroupIcon,
  TableIcon,
  UserCircleIcon,
} from "../../icons";
import { useAnimatedCounter } from "../../hooks/useAnimatedCounter";
import reportService, { ReportsData } from "../../services/api/reportService";

/**
 * Composant EcommerceMetrics - Métriques principales du tableau de bord
 *
 * Affiche les métriques clés sous forme de cartes :
 * - Clients : nombre total de clients
 * - Boutiques : nombre total de boutiques
 * - Produits : nombre total de produits
 * - Livreurs : nombre total de livreurs
 *
 * Les valeurs sont animées de 0 à leur valeur finale lors du montage du composant.
 */
export default function EcommerceMetrics() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = await reportService.getReports();
        setReportsData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement des statistiques";
        setError(message);
        setReportsData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, []);

  // Valeurs cibles pour chaque métrique (utiliser 0 si pas encore chargé)
  const clientsTarget = reportsData?.all_client || 0;
  const boutiquesTarget = reportsData?.all_boutique || 0;
  const produitsTarget = reportsData?.all_produit || 0;
  const livreursTarget = reportsData?.all_livreur || 0;

  // Animation des valeurs
  const clientsValue = useAnimatedCounter(clientsTarget, { duration: 2000, format: "number" });
  const boutiquesValue = useAnimatedCounter(boutiquesTarget, { duration: 2000, format: "number" });
  const produitsValue = useAnimatedCounter(produitsTarget, { duration: 2000, format: "number" });
  const livreursValue = useAnimatedCounter(livreursTarget, { duration: 2000, format: "number" });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
        {[1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className="rounded-2xl border border-neutral-300 bg-white p-5 dark:border-neutral-400 dark:bg-white/[0.03] md:p-6 animate-pulse"
          >
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800" />
            <div className="mt-5">
              <div className="h-4 bg-gray-200 rounded dark:bg-gray-700 w-20 mb-2" />
              <div className="h-8 bg-gray-200 rounded dark:bg-gray-700 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !reportsData) {
    return (
      <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
        {error || "Erreur lors du chargement des statistiques"}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 md:gap-6">
      {/* <!-- Metric Item Start - Clients --> */}
      <div className="group rounded-2xl border border-neutral-300 bg-white p-5 transition-all duration-300 hover:border-[#04b05d] dark:border-neutral-400 dark:bg-white/[0.03] dark:hover:border-[#04b05d] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#04b05d]/10 transition-colors duration-300 group-hover:bg-[#04b05d]/20 dark:bg-[#04b05d]/20">
          <GroupIcon className="text-[#04b05d] size-6 dark:text-[#04b05d]" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 font-medium dark:text-gray-400">
              Clients
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {clientsValue}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start - Boutiques --> */}
      <div className="group rounded-2xl border border-neutral-300 bg-white p-5 transition-all duration-300 hover:border-[#04b05d] dark:border-neutral-400 dark:bg-white/[0.03] dark:hover:border-[#04b05d] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#04b05d]/10 transition-colors duration-300 group-hover:bg-[#04b05d]/20 dark:bg-[#04b05d]/20">
          <TableIcon className="text-[#04b05d] size-6 dark:text-[#04b05d]" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 font-medium dark:text-gray-400">
              Boutiques
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {boutiquesValue}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start - Produits --> */}
      <div className="group rounded-2xl border border-neutral-300 bg-white p-5 transition-all duration-300 hover:border-[#04b05d] dark:border-neutral-400 dark:bg-white/[0.03] dark:hover:border-[#04b05d] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#04b05d]/10 transition-colors duration-300 group-hover:bg-[#04b05d]/20 dark:bg-[#04b05d]/20">
          <BoxIcon className="text-[#04b05d] size-6 dark:text-[#04b05d]" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 font-medium dark:text-gray-400">
              Produits
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {produitsValue}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start - Livreurs --> */}
      <div className="group rounded-2xl border border-neutral-300 bg-white p-5 transition-all duration-300 hover:border-[#04b05d] dark:border-neutral-400 dark:bg-white/[0.03] dark:hover:border-[#04b05d] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-[#04b05d]/10 transition-colors duration-300 group-hover:bg-[#04b05d]/20 dark:bg-[#04b05d]/20">
          <UserCircleIcon className="text-[#04b05d] size-6 dark:text-[#04b05d]" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 font-medium dark:text-gray-400">
              Livreurs
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {livreursValue}
            </h4>
          </div>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
