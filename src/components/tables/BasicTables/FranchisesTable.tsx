/**
 * Composant FranchisesTable - Tableau des boutiques (franchisés)
 * 
 * Affiche la liste des boutiques avec :
 * - Nom de la boutique et email
 * - Contact
 * - Adresse
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
import { Boutique } from "../../../services/api/franchiseService";

interface FranchisesTableProps {
  boutiques: Boutique[];
  onAddFranchise?: (boutique: Boutique, e: React.MouseEvent) => void;
}

/**
 * Retourne le label du statut
 */
const getStatusLabel = (status: number): string => {
  return status === 1 ? "Actif" : "Inactif";
};

/**
 * Retourne la couleur du badge selon le statut
 */
const getStatusColor = (status: number): "success" | "error" => {
  return status === 1 ? "success" : "error";
};

export default function FranchisesTable({ boutiques, onAddFranchise }: FranchisesTableProps) {
  const navigate = useNavigate();

  const tableContent = useMemo(() => {
    return boutiques.map((boutique) => (
      <TableRow
        key={boutique.id}
        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
        onClick={() => navigate(`/boutiques/${boutique.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigate(`/boutiques/${boutique.id}`);
          }
        }}
      >
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div>
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
              {boutique.name}
            </span>
            {boutique.email && (
              <span className="block text-xs text-gray-500 dark:text-gray-400">{boutique.email}</span>
            )}
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <div className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-1.5 py-1">
          {boutique.contact_1}
          {boutique.contact_2 && (
              <span className="block text-xs text-gray-600 dark:text-yellow-200/80">
              {boutique.contact_2}
            </span>
          )}
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {boutique.adresse}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge 
            size="sm" 
            color={getStatusColor(boutique.status)}
            className={boutique.status === 1 ? "border border-green-300 dark:border-green-600" : ""}
          >
            {getStatusLabel(boutique.status)}
          </Badge>
        </TableCell>
        {onAddFranchise && (
          <TableCell className="px-4 py-3 text-center">
            <button
              type="button"
              onClick={(e) => onAddFranchise?.(boutique, e)}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-100 border border-neutral-300 transition px-1.5 py-1 text-sm hover:bg-neutral-600 hover:text-white text-neutral-600 shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Placer un franchisé"
            >
              Placer un franchisé
            </button>
          </TableCell>
        )}
      </TableRow>
    ));
  }, [boutiques, navigate, onAddFranchise]);

  return (
    <div className="max-w-full overflow-x-auto">
      <Table>
        <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
          <TableRow>
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Boutique
            </TableCell>
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Contact
            </TableCell>
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Adresse
            </TableCell>
            <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
              Statut
            </TableCell>
            {onAddFranchise && (
              <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-center text-theme-xs dark:text-gray-400">
                Actions
              </TableCell>
            )}
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">{tableContent}</TableBody>
      </Table>
    </div>
  );
}
