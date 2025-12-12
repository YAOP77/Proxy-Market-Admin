/**
 * Page BannersList - Liste des bannieres
 *
 * Affiche la liste des bannieres avec pagination et recherche
 */

import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";

import Badge from "../../components/ui/badge/Badge";
import bannerService, { Banner, Category } from "../../services/api/bannerService";
import { PlusIcon } from "../../icons";
import Button from "../../components/ui/button/Button";
import Pagination from "../../components/ui/pagination/Pagination";

/**
 * Retourne le label du statut
 */
const getStatusLabel = (status: string | number): string => {
  const statusStr = String(status);
  return statusStr === "1" || statusStr === "1" ? "Actif" : "Inactif";
};

/**
 * Retourne la couleur du badge selon le statut
 */
const getStatusColor = (status: string | number): "success" | "error" => {
  const statusStr = String(status);
  return statusStr === "1" ? "success" : "error";
};

export default function BannersList() {
  const location = useLocation();
  const navigate = useNavigate();

  const [banners, setBanners] = useState<Banner[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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

  const loadBanners = async (page: number = 1) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await bannerService.getBanners(page);
      
      // Verifier que la reponse contient bien data et meta
      if (response && response.data && response.meta) {
        setBanners(Array.isArray(response.data) ? response.data : []);
        setPaginationMeta(response.meta);
        setCurrentPage(response.meta.current_page || page);
      } else {
        // Si la structure n'est pas correcte, utiliser des valeurs par defaut
        setBanners([]);
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
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des bannieres";
      setError(message);
      setBanners([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les categories au montage
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const categoriesList = await bannerService.getCategories();
        setCategories(categoriesList);
      } catch (err: unknown) {
        // En cas d'erreur, on continue sans categories
        if (import.meta.env.DEV) {
        }
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    loadBanners(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    loadBanners(page);
    // Scroll vers le haut de la table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  /**
   * Recupere le nom de la categorie a partir de son ID
   */
  const getCategoryName = (categoryId: string): string => {
    if (!categoryId) return "—";
    const category = categories.find((cat) => cat.id === categoryId);
    return category?.libelle || "—";
  };

  const tableContent = useMemo(() => {
    return banners.map((banner) => (
      <TableRow
        key={banner.id}
        className="hover:bg-gray-50 dark:hover:bg-white/5"
      >
        <TableCell className="px-5 py-4 sm:px-6 text-start">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
              <img
                src={banner.photo || "/images/product/product-01.jpg"}
                alt={banner.titre1}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/images/product/product-01.jpg";
                }}
              />
            </div>
            <div>
              <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                {banner.titre1}
              </span>
              {banner.titre2 && (
                <span className="block text-xs text-gray-500 dark:text-gray-400">
                  {banner.titre2}
                </span>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge size="sm" color="warning" className="border border-orange-300 dark:border-orange-600">
            {getCategoryName(banner.categorie_id)}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {banner.ordre}
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          <Badge
            size="sm"
            color={getStatusColor(banner.status)}
            className={getStatusColor(banner.status) === "success" ? "border border-green-300 dark:border-green-600" : ""}
          >
            {getStatusLabel(banner.status)}
          </Badge>
        </TableCell>
        <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
          {banner.created_at
            ? new Date(banner.created_at).toLocaleDateString("fr-FR", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })
            : "—"}
        </TableCell>
      </TableRow>
    ));
  }, [banners, categories]);

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Liste des bannieres | Proxy Market"
          description="Consultez la liste des bannieres Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des bannieres"
          items={[
            { label: "Gestion des produits", href: "/banners" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des bannieres...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="Liste des bannieres | Proxy Market"
          description="Consultez la liste des bannieres Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des bannieres"
          items={[
            { label: "Gestion des produits", href: "/banners" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      </>
    );
  }

  if (!isLoading && banners.length === 0 && !error) {
    return (
      <>
        <PageMeta
          title="Liste des bannieres | Proxy Market"
          description="Consultez la liste des bannieres Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des bannieres"
          items={[
            { label: "Gestion des produits", href: "/banners" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex justify-end mb-6">
          <Button
            variant="none"
            className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => navigate("/add-banner")}
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Creer une banniere
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <img
            src="/images/oups/File searching-bro.png"
            alt="Aucune banniere trouvee"
            className="w-80 h-80 object-contain"
          />
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
            Aucune banniere trouvee.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Liste des bannieres | Proxy Market"
        description="Consultez la liste des bannieres Proxy Market"
      />
      <PageBreadcrumb
        pageTitle="Liste des bannieres"
        items={[
          { label: "Gestion des produits", href: "/banners" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="flex justify-end mb-6">
        <Button
          variant="none"
          className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 focus:ring-3 focus:ring-[#04b05d]/20 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => navigate("/add-banner")}
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Creer une banniere
        </Button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
        <div className="max-w-full overflow-x-auto">
          <Table>
            <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
              <TableRow>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Banniere
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Categorie
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Ordre
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Statut
                </TableCell>
                <TableCell isHeader className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400">
                  Date de creation
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
              {tableContent}
            </TableBody>
          </Table>
        </div>

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
    </>
  );
}

