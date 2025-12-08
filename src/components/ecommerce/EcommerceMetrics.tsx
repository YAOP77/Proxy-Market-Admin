import {
  ArrowDownIcon,
  ArrowUpIcon,
  BoxIconLine,
  DollarLineIcon,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useAnimatedCounter } from "../../hooks/useAnimatedCounter";

/**
 * Composant EcommerceMetrics - Métriques principales du tableau de bord
 * 
 * Affiche les métriques clés sous forme de cartes :
 * - Clients : nombre total de clients
 * - Commandes : nombre total de commandes
 * - Ventes : montant total des ventes
 * 
 * Les valeurs sont animées de 0 à leur valeur finale lors du montage du composant.
 */
export default function EcommerceMetrics() {
  // Valeurs cibles pour chaque métrique
  const clientsTarget = 3782;
  const commandesTarget = 5359;
  const ventesTarget = 127845;

  // Animation des valeurs
  const clientsValue = useAnimatedCounter(clientsTarget, { duration: 2000, format: "number" });
  const commandesValue = useAnimatedCounter(commandesTarget, { duration: 2000, format: "number" });
  const ventesValue = useAnimatedCounter(ventesTarget, { duration: 2000, format: "currency", prefix: "$" });

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 md:gap-6">
      {/* <!-- Metric Item Start - Clients avec fond jaune --> */}
      <div className="rounded-2xl border border-yellow-300 bg-yellow-100 p-5 dark:border-yellow-600/30 dark:bg-yellow-900/20 md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-yellow-200 rounded-xl dark:bg-yellow-900/40">
          <GroupIcon className="text-gray-800 size-6 dark:text-yellow-200" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-600 dark:text-yellow-700/80 font-medium">
              Clients
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {clientsValue}
            </h4>
          </div>
          <Badge color="success" className="ml-2 flex-shrink-0 border border-green-300">
            <ArrowUpIcon />
            11.01%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start --> */}
      <div className="rounded-2xl border border-neutral-400 bg-white p-5 dark:border-gray-700 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <BoxIconLine className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Commandes
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {commandesValue}
            </h4>
          </div>
          <Badge color="error" className="ml-2 flex-shrink-0 border border-red-300">
            <ArrowDownIcon />
            9.05%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* <!-- Metric Item Start - Ventes --> */}
      <div className="rounded-2xl border border-neutral-400 bg-white p-5 dark:border-gray-700 dark:bg-white/[0.03] md:p-6">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <DollarLineIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>
        <div className="flex items-end justify-between mt-5">
          <div className="flex-1 min-w-0">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Ventes
            </span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90 truncate">
              {ventesValue}
            </h4>
          </div>
          <Badge color="success" className="ml-2 flex-shrink-0 border border-green-300">
            <ArrowUpIcon />
            15.3%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}
    </div>
  );
}
