/**
 * Page LivreursTable - Liste des livreurs
 *
 * Affiche la liste des livreurs avec leurs informations
 * avec pagination et recherche intégrée
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useSearchParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import LivreursTable from "../../components/tables/BasicTables/LivreursTable";
import Pagination from "../../components/ui/pagination/Pagination";
import livreurService, { Livreur } from "../../services/api/livreurService";

export default function LivreursTablePage() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [paginationMeta, setPaginationMeta] = useState<{
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
  } | null>(null);

  const loadLivreurs = async (page: number = 1, search?: string) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await livreurService.getLivreurs(page, search);

      // Vérifier que la réponse contient bien data et meta
      if (response && response.data && response.meta) {
        setLivreurs(Array.isArray(response.data) ? response.data : []);
        setPaginationMeta(response.meta);
        setCurrentPage(response.meta.current_page || page);
      } else {
        // Si la structure n'est pas correcte, utiliser des valeurs par défaut
        setLivreurs([]);
        setPaginationMeta({
          current_page: page,
          from: 0,
          last_page: 1,
          per_page: 0,
          to: 0,
          total: 0,
        });
        setCurrentPage(page);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des livreurs";
      setError(message);
      setLivreurs([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Charger les livreurs avec la recherche si présente
    const search = searchQuery.trim() || undefined;
    loadLivreurs(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const search = searchQuery.trim() || undefined;
    loadLivreurs(page, search);
    // Scroll vers le haut de la table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Convertir les livreurs en format compatible avec LivreursTable
  const normalizedLivreurs = useMemo(() => {
    return livreurs.map((livreur) => {
      // Construire le nom complet à partir de nom et prenoms
      const fullName = [livreur.nom, livreur.prenoms].filter(Boolean).join(" ") || "—";

      // Déterminer le statut
      const status = livreur.status === 1 ? "Actif" : "Inactif";

      // Utiliser contact1 comme contact principal
      const contact = livreur.contact1 || livreur.contact2 || undefined;

      // Utiliser location_name comme localisation
      const location = livreur.location_name || livreur.adresse || undefined;

      return {
        id: livreur.id,
        name: fullName,
        email: livreur.email || undefined,
        image: livreur.photo || "/images/user/User.jpg",
        contact: contact,
        location: location,
        role: livreur.role || "Livreur",
        status: status,
      };
    });
  }, [livreurs]);

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Liste des livreurs | Proxy Market"
          description="Consultez la liste des livreurs Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des livreurs"
          items={[
            { label: "Gestion des rôles", href: "/livreurs-table" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des livreurs...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="Liste des livreurs | Proxy Market"
          description="Consultez la liste des livreurs Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des livreurs"
          items={[
            { label: "Gestion des rôles", href: "/livreurs-table" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      </>
    );
  }

  if (!isLoading && normalizedLivreurs.length === 0 && !error) {
    return (
      <>
        <PageMeta
          title="Liste des livreurs | Proxy Market"
          description="Consultez la liste des livreurs Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des livreurs"
          items={[
            { label: "Gestion des rôles", href: "/livreurs-table" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex flex-col items-center justify-center py-8">
          <img
            src="/images/oups/File searching-bro.png"
            alt="Aucun livreur trouvé"
            className="w-80 h-80 object-contain"
          />
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
            Aucun livreur trouvé.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Liste des livreurs | Proxy Market"
        description="Consultez la liste des livreurs Proxy Market"
      />
      <PageBreadcrumb
        pageTitle="Liste des livreurs"
        items={[
          { label: "Gestion des rôles", href: "/livreurs-table" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <LivreursTable livreurs={normalizedLivreurs} />

          {/* Pagination */}
          {paginationMeta && paginationMeta.last_page > 1 && paginationMeta.total > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={paginationMeta.last_page}
              onPageChange={handlePageChange}
              totalItems={paginationMeta.total}
              itemsPerPage={paginationMeta.per_page}
              showingFrom={paginationMeta.from}
              showingTo={paginationMeta.to}
            />
          )}
        </div>
      </div>
    </>
  );
}

