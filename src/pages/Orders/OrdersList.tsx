/**
 * Page OrdersList - Liste des commandes
 * 
 * Affiche toutes les commandes avec leurs statuts
 * Chaque commande est cliquable pour voir les détails
 * avec pagination et recherche intégrée
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Badge from "../../components/ui/badge/Badge";
import Pagination from "../../components/ui/pagination/Pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import commandeService, { Commande } from "../../services/api/commandeService";

interface Order {
  id: string;
  orderNumber: string;
  user: {
    name: string;
    email?: string;
    image: string;
    contact?: string;
  };
  product: {
    name: string;
    quantity: number;
    image?: string;
  };
  status: "En attente" | "En préparation" | "En livraison" | "Livré" | "Annulé";
  statusText: string;
  statusBg: string;
  total: number;
  totalFormatted: string;
  orderDate: string;
  deliveryLocation: string;
  livreur: {
    name: string;
    contact?: string;
  } | null;
}

/**
 * Détermine les styles du badge selon le texte du statut
 */
const getStatusStyles = (statusText: string, statusBg: string): { color: "success" | "warning" | "error" | "info"; className: string } => {
  const lowerText = statusText.toLowerCase();
  
  // Commande en attente de paiement -> yellow
  if (lowerText.includes("attente") && lowerText.includes("paiement")) {
    return {
      color: "warning", // Utiliser warning comme base, mais override avec yellow via className
      className: "bg-yellow-100 text-yellow-600 border border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-400 dark:border-yellow-400",
    };
  }
  
  // Commande payée -> blue
  if (lowerText.includes("payée") || lowerText.includes("payee")) {
    return {
      color: "info",
      className: "border border-blue-300 dark:border-blue-500",
    };
  }
  
  // Commande livrée -> success (vert)
  if (statusBg === "success" || lowerText.includes("livrée") || lowerText.includes("livree")) {
    return {
      color: "success",
      className: "border border-green-300 dark:border-green-600",
    };
  }
  
  // Commande annulée -> error (rouge)
  if (statusBg === "danger" || lowerText.includes("annulée") || lowerText.includes("annulee") || lowerText.includes("inactif") || lowerText.includes("inactive")) {
    return {
      color: "error",
      className: "bg-red-100 text-red-600 border border-red-300 dark:bg-red-500/15 dark:text-red-400 dark:border-red-600",
    };
  }
  
  // Autres statuts (préparation, livraison, etc.) -> warning (orange)
  return {
    color: "warning",
    className: "border border-orange-300 dark:border-orange-600",
  };
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

/**
 * Formate le prix en FCFA
 */
const formatPrice = (price: number): string => {
  return `${price.toLocaleString("fr-FR")} FCFA`;
};

export default function OrdersList() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("q") || "";

  const [commandes, setCommandes] = useState<Commande[]>([]);
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

  const loadCommandes = async (page: number = 1, search?: string) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await commandeService.getCommandes(page, search);

      // Vérifier que la réponse contient bien data et meta
      if (response && response.data && response.meta) {
        setCommandes(Array.isArray(response.data) ? response.data : []);
        setPaginationMeta(response.meta);
        setCurrentPage(response.meta.current_page || page);
      } else {
        // Si la structure n'est pas correcte, utiliser des valeurs par défaut
        setCommandes([]);
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
      const message = err instanceof Error ? err.message : "Erreur lors du chargement des commandes";
      setError(message);
      setCommandes([]);
      setPaginationMeta(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Charger les commandes avec la recherche si présente
    const search = searchQuery.trim() || undefined;
    loadCommandes(1, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, searchQuery]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const search = searchQuery.trim() || undefined;
    loadCommandes(page, search);
    // Scroll vers le haut de la table
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Convertir les commandes en format compatible avec l'affichage
  const orders = useMemo(() => {
    return commandes.map((commande) => {
      // Construire le nom complet du client
      const clientNom = commande.client?.nom || "";
      const clientPrenoms = commande.client?.prenoms || "";
      const userName = [clientNom, clientPrenoms].filter(Boolean).join(" ") || "—";

      // Email du client
      const userEmail = commande.client?.email || undefined;

      // Contact du client (pas de photo dans la structure, utiliser image par défaut)
      const userImage = "/images/user/User.jpg";

      // Nom du produit
      const productName = commande.primary_produit?.libelle || "Produit non spécifié";

      // Quantité
      const quantity = commande.quantite || 1;

      // Statut - utiliser status_text de l'API
      let status: Order["status"] = "En attente";
      const statusText = commande.status_text || "";
      if (statusText.toLowerCase().includes("livrée") || statusText.toLowerCase().includes("livré")) {
        status = "Livré";
      } else if (statusText.toLowerCase().includes("livraison")) {
        status = "En livraison";
      } else if (statusText.toLowerCase().includes("préparation")) {
        status = "En préparation";
      } else if (statusText.toLowerCase().includes("annulée") || statusText.toLowerCase().includes("annulé")) {
        status = "Annulé";
      } else if (statusText.toLowerCase().includes("payée") || statusText.toLowerCase().includes("payé")) {
        status = "En attente"; // Payée mais pas encore préparée
      }

      // Total - déjà formaté dans l'API (ex: "1 100 FCFA")
      // Extraire le nombre pour le formatage cohérent
      let total = 0;
      if (commande.total) {
        const numericPart = commande.total.replace(/[^\d]/g, "");
        total = parseInt(numericPart, 10) || 0;
      }

      // Numéro de commande (utiliser numero au lieu de id pour l'affichage)
      const orderNumber = commande.numero || commande.id;

      // Date de commande
      let orderDate = "—";
      if (commande.created_at) {
        try {
          orderDate = new Date(commande.created_at).toLocaleString("fr-FR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
          });
        } catch {
          orderDate = "—";
        }
      }

      // Localisation de livraison
      const locationName = commande.adresse_livraison?.location_name || "";
      const adresse = commande.adresse_livraison?.adresse || "";
      const deliveryLocation = locationName || adresse || "—";

      return {
        id: commande.id,
        orderNumber: orderNumber,
        user: {
          name: userName,
          email: userEmail,
          image: userImage,
          contact: commande.client?.contact1 || undefined,
        },
        product: {
          name: productName,
          quantity: quantity,
          image: commande.primary_produit?.photo_prymary || undefined,
        },
        status: status,
        statusText: commande.status_text,
        statusBg: commande.status_bg,
        total: total,
        totalFormatted: commande.total,
        orderDate: orderDate,
        deliveryLocation: deliveryLocation,
        livreur: commande.livreur
          ? {
              name: [commande.livreur.nom, commande.livreur.prenoms].filter(Boolean).join(" ") || "—",
              contact: commande.livreur.contact1 || undefined,
            }
          : null,
      };
    });
  }, [commandes]);

  // Fonction pour obtenir le statut de groupe d'une commande
  const getOrderGroupStatus = (order: Order): string => {
    const lowerStatus = (order.statusText || order.status || "").toLowerCase();
    
    if (lowerStatus.includes("livrée") || lowerStatus.includes("livree")) {
      return "livrée";
    }
    if (lowerStatus.includes("livraison") && !lowerStatus.includes("livrée") && !lowerStatus.includes("livree")) {
      return "en_livraison";
    }
    if (lowerStatus.includes("préparation") || lowerStatus.includes("preparation")) {
      return "en_préparation";
    }
    if (lowerStatus.includes("payée") || lowerStatus.includes("payee")) {
      return "payée";
    }
    if (lowerStatus.includes("attente") && lowerStatus.includes("paiement")) {
      return "en_attente_paiement";
    }
    if (lowerStatus.includes("annulée") || lowerStatus.includes("annulee") || lowerStatus.includes("annulé") || lowerStatus.includes("annule")) {
      return "annulée";
    }
    return "autre";
  };

  // Grouper les commandes par statut
  const groupedOrders = useMemo(() => {
    const groups: Record<string, Order[]> = {
      en_attente_paiement: [],
      payée: [],
      en_préparation: [],
      en_livraison: [],
      livrée: [],
      annulée: [],
      autre: [],
    };

    orders.forEach((order) => {
      const groupStatus = getOrderGroupStatus(order);
      if (groups[groupStatus]) {
        groups[groupStatus].push(order);
      } else {
        groups.autre.push(order);
      }
    });

    return groups;
  }, [orders]);

  // Fonction pour obtenir le libellé d'une section
  const getSectionLabel = (status: string): string => {
    const labels: Record<string, string> = {
      en_attente_paiement: "En attente de paiement",
      payée: "Commandes payées",
      en_préparation: "En préparation",
      en_livraison: "En livraison",
      livrée: "Commandes livrées",
      annulée: "Commandes annulées",
      autre: "Autres",
    };
    return labels[status] || status;
  };

  // Fonction pour obtenir la couleur d'une section
  const getSectionColor = (status: string): string => {
    const colors: Record<string, string> = {
      en_attente_paiement: "yellow",
      payée: "blue",
      en_préparation: "orange",
      en_livraison: "orange",
      livrée: "green",
      annulée: "red",
      autre: "gray",
    };
    return colors[status] || "gray";
  };

  // Fonction pour rendre une ligne de commande
  const renderOrderRow = useCallback((order: Order) => (
    <TableRow
                    key={order.id}
      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-white/5"
      onClick={() => navigate(`/order/${order.id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigate(`/order/${order.id}`);
        }
      }}
    >
      {/* Numéro Commande */}
      <TableCell className="px-5 py-4 sm:px-6 text-start">
        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">
          #{order.orderNumber}
        </span>
      </TableCell>

      {/* Client */}
      <TableCell className="px-5 py-4 sm:px-6 text-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full">
                          <img
                            width={40}
                            height={40}
                            src={order.user.image}
                            alt={order.user.name}
                            className="w-full h-full object-cover"
              onError={handleImageError}
                          />
                        </div>
          <div>
            <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                          {order.user.name}
            </span>
            {order.user.contact && (
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                {order.user.contact}
              </span>
            )}
          </div>
        </div>
      </TableCell>

      {/* Produit */}
      <TableCell className="px-4 py-3 text-start">
        <div className="flex items-center gap-2">
          {order.product.image && (
            <div className="w-8 h-8 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10 flex-shrink-0">
              <img
                src={order.product.image}
                alt={order.product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
                      </div>
          )}
          <div className="inline-block text-xs text-neutral-400 border border-neutral-400 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-400 rounded-full px-2 py-1">
                        {order.product.name}
            <span className="text-neutral-400 dark:text-neutral-500 ml-1">
                          (x{order.product.quantity})
                        </span>
          </div>
        </div>
      </TableCell>

      {/* Localisation */}
      <TableCell className="px-4 py-3 text-start">
        <span className="inline-block text-xs text-neutral-400 border border-neutral-400 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-600 dark:text-neutral-400 rounded-full px-2 py-1">
                        {order.deliveryLocation}
        </span>
      </TableCell>

      {/* Total */}
      <TableCell className="px-4 py-3 text-gray-800 text-start text-theme-sm dark:text-white/90 font-medium">
        {order.totalFormatted || formatPrice(order.total)}
      </TableCell>

      {/* Statut */}
      <TableCell className="px-4 py-3 text-start">
        {(() => {
          const styles = getStatusStyles(order.statusText || order.status, order.statusBg);
          let displayStatus = order.statusText || order.status;
          const lowerStatus = displayStatus.toLowerCase();
          
          // Remplacer "Commande en attente de traitement" ou "Commande en attente de paiement" par "En attente de paiement"
          if ((lowerStatus.includes("attente") && lowerStatus.includes("traitement")) ||
              (lowerStatus.includes("attente") && lowerStatus.includes("paiement"))) {
            displayStatus = "En attente de paiement";
          }
          
          // Remplacer "Commande en cour de préparation" par "Commande en préparation"
          if (lowerStatus.includes("cour") && lowerStatus.includes("préparation")) {
            displayStatus = "Commande en préparation";
          }
          
          return (
            <Badge
              size="sm"
              color={styles.color}
              className={styles.className}
            >
              {displayStatus}
            </Badge>
          );
        })()}
      </TableCell>
    </TableRow>
  ), [navigate]);

  // Ordre d'affichage des sections
  const sectionOrder = [
    "en_attente_paiement",
    "payée",
    "en_préparation",
    "en_livraison",
    "livrée",
    "annulée",
    "autre",
  ];

  // Contenu des sections groupées
  const tableContent = useMemo(() => {
    return sectionOrder.map((status) => {
      const ordersInSection = groupedOrders[status];
      if (ordersInSection.length === 0) {
        return null;
      }

      const sectionColor = getSectionColor(status);
      const sectionLabel = getSectionLabel(status);
      const count = ordersInSection.length;

      return (
        <div key={status} className="mb-8 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          {/* En-tête de section */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                {sectionLabel}
              </h3>
              <Badge
                size="sm"
                color={sectionColor as "success" | "warning" | "error" | "info"}
              >
                {count} {count === 1 ? "commande" : "commandes"}
                      </Badge>
            </div>
          </div>

          {/* Tableau pour cette section */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
                <TableRow>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    N° Commande
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Client
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Produit
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Localisation
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Total
                  </TableCell>
                  <TableCell
                    isHeader
                    className="px-5 py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
                  >
                    Statut
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {ordersInSection.map((order) => renderOrderRow(order))}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    }).filter(Boolean);
  }, [groupedOrders, navigate, renderOrderRow]);

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Liste des commandes | Proxy Market"
          description="Liste de toutes les commandes sur Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des commandes"
          items={[
            { label: "Commandes", href: "/orders" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des commandes...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="Liste des commandes | Proxy Market"
          description="Liste de toutes les commandes sur Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des commandes"
          items={[
            { label: "Gestion des produits", href: "/orders" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      </>
    );
  }

  if (!isLoading && orders.length === 0 && !error) {
    return (
      <>
        <PageMeta
          title="Liste des commandes | Proxy Market"
          description="Liste de toutes les commandes sur Proxy Market"
        />
        <PageBreadcrumb
          pageTitle="Liste des commandes"
          items={[
            { label: "Gestion des produits", href: "/orders" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex flex-col items-center justify-center py-8">
          <img
            src="/images/oups/File searching-bro.png"
            alt="Aucune commande trouvée"
            className="w-80 h-80 object-contain"
          />
          <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
            Aucune commande trouvée.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title="Liste des commandes | Proxy Market"
        description="Liste de toutes les commandes sur Proxy Market"
      />
      <PageBreadcrumb
        pageTitle="Liste des commandes"
        items={[
          { label: "Gestion des produits", href: "/orders" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {/* Sections groupées par statut */}
        <div className="space-y-8">
          {tableContent}
        </div>

        {/* Pagination */}
        {paginationMeta && paginationMeta.last_page > 1 && paginationMeta.total > 0 && (
          <div className="mt-6">
            <Pagination
              currentPage={currentPage}
              totalPages={paginationMeta.last_page}
              onPageChange={handlePageChange}
              totalItems={paginationMeta.total}
              itemsPerPage={paginationMeta.per_page}
              showingFrom={paginationMeta.from}
              showingTo={paginationMeta.to}
            />
          </div>
        )}
      </div>
    </>
  );
}
