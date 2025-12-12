/**
 * Composant LivreursTable - Tableau des livreurs
 *
 * Affiche la liste des livreurs avec :
 * - Livreur (photo + nom + email)
 * - Contact
 * - Rôle
 * - Statut
 */

import { useMemo } from "react";
import { useNavigate } from "react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../ui/table";

import Badge from "../../ui/badge/Badge";

interface Livreur {
  id: number | string;
  name: string;
  email?: string;
  image: string;
  contact?: string;
  location?: string;
  role: string;
  status: string;
}

interface LivreursTableProps {
  livreurs?: Livreur[];
}

/**
 * Retourne la couleur du badge selon le statut
 */
const getStatusColor = (status: string): "success" | "warning" | "error" => {
  if (status === "Actif") return "success";
  if (status === "En attente") return "warning";
  return "error";
};

/**
 * Gère l'erreur de chargement d'image
 */
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.currentTarget;
  if (target.src !== "/images/user/User.jpg") {
    target.src = "/images/user/User.jpg";
  }
};

export default function LivreursTable({ livreurs = [] }: LivreursTableProps) {
  const navigate = useNavigate();

  const tableContent = useMemo(() => {
    return livreurs.map((livreur) => (
      <TableRow
        key={livreur.id}
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
        onClick={() => navigate(`/livreurs/${livreur.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/livreurs/${livreur.id}`);
          }
        }}
      >
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 overflow-hidden rounded-full">
              <img
                width={40}
                height={40}
                src={livreur.image}
                alt={livreur.name}
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
            </div>
            <div>
              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {livreur.name}
              </span>
              {livreur.email && (
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {livreur.email}
                </span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {livreur.contact ? (
            <div className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-1.5 py-1">
              {livreur.contact}
            </div>
          ) : (
            "—"
          )}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge size="sm" color="warning" className="border border-orange-300 dark:border-orange-600">
            {livreur.role}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge
            size="sm"
            color={getStatusColor(livreur.status)}
            className={
              livreur.status === "Actif"
                ? "border border-green-300 dark:border-green-600"
                : livreur.status === "Inactif"
                ? "border border-red-300 dark:border-red-600"
                : ""
            }
          >
            {livreur.status}
          </Badge>
        </TableCell>
      </TableRow>
    ));
  }, [livreurs, navigate]);

  return (
    <div className="max-w-full overflow-x-auto">
      <Table>
        {/* En-tête du tableau */}
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Livreur
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Contact
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Rôle
            </TableCell>
            <TableCell
              isHeader
              className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
            >
              Statut
            </TableCell>
          </TableRow>
        </TableHeader>

        {/* Corps du tableau */}
        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
          {tableContent}
        </TableBody>
      </Table>
    </div>
  );
}

