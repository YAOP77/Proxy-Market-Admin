import { useState, useEffect, useRef } from "react";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { Link, useNavigate } from "react-router";
import commandeService, { Commande } from "../../services/api/commandeService";

interface NotificationItem {
  id: string;
  orderId: string;
  orderNumber: string;
  clientName: string;
  clientImage: string;
  message: string;
  location: string;
  status: string;
  statusBg: string;
  timestamp: Date;
  isNew: boolean;
}

export default function NotificationDropdown() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifying, setNotifying] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchedOrdersRef = useRef<Set<string>>(new Set());
  const lastOrderStatusRef = useRef<Map<string, string>>(new Map());
  const isInitialLoadRef = useRef<boolean>(true);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  const handleClick = () => {
    toggleDropdown();
    setNotifying(false);
    // Marquer toutes les notifications comme lues
    setNotifications((prev) => prev.map((notif) => ({ ...notif, isNew: false })));
  };

  /**
   * Formate le temps écoulé depuis une date
   */
  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return "À l'instant";
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `Il y a ${minutes} min`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `Il y a ${hours} h`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `Il y a ${days} j`;
    }
  };

  /**
   * Génère un message de notification selon le statut de la commande
   */
  const getNotificationMessage = (statusText: string): string => {
    const lowerStatus = statusText.toLowerCase();
    
    if (lowerStatus.includes("attente") && lowerStatus.includes("paiement")) {
      return "a passé une commande";
    } else if (lowerStatus.includes("payée") || lowerStatus.includes("payee")) {
      return "a payé sa commande";
    } else if (lowerStatus.includes("préparation") || lowerStatus.includes("preparation")) {
      return "est en préparation";
    } else if (lowerStatus.includes("livraison") && !lowerStatus.includes("livrée") && !lowerStatus.includes("livree")) {
      return "est en cours de livraison";
    } else if (lowerStatus.includes("livrée") || lowerStatus.includes("livree")) {
      return "a été livrée";
    } else if (lowerStatus.includes("annulée") || lowerStatus.includes("annulee")) {
      return "a été annulée";
    }
    
    return "a changé de statut";
  };

  /**
   * Obtient la couleur du badge selon le statut
   */
  const getStatusBadgeColor = (statusBg: string): string => {
    switch (statusBg) {
      case "success":
        return "bg-green-500";
      case "warning":
        return "bg-yellow-500";
      case "danger":
        return "bg-red-500";
      case "primary":
      default:
        return "bg-blue-500";
    }
  };

  /**
   * Charge les commandes récentes et génère les notifications
   */
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        setIsLoading(true);
        const response = await commandeService.getCommandes(1, "");
        
        if (!response || !response.data || !Array.isArray(response.data)) {
          return;
        }

        const orders: Commande[] = response.data;
        const currentTime = new Date();
        const newNotifications: NotificationItem[] = [];
        const currentOrderIds = new Set<string>();
        const currentOrderStatuses = new Map<string, string>();

        // Traiter chaque commande
        orders.forEach((order) => {
          currentOrderIds.add(order.id);
          currentOrderStatuses.set(order.id, order.status_text);

          // Ignorer les commandes existantes lors du premier chargement
          if (isInitialLoadRef.current) {
            return;
          }

          // Vérifier si c'est une nouvelle commande
          const isNewOrder = !lastFetchedOrdersRef.current.has(order.id);
          
          // Vérifier si le statut a changé
          const previousStatus = lastOrderStatusRef.current.get(order.id);
          const statusChanged = previousStatus && previousStatus !== order.status_text;

          // Créer une notification si c'est une nouvelle commande ou si le statut a changé
          if (isNewOrder || statusChanged) {
            const clientName = order.client
              ? `${order.client.nom || ""} ${order.client.prenoms || ""}`.trim() || "Client"
              : "Client";
            
            const clientImage = order.client?.email 
              ? `https://ui-avatars.com/api/?name=${encodeURIComponent(clientName)}&background=04b05d&color=fff&size=40`
              : "/images/user/User.jpg";

            const location = order.adresse_livraison?.location_name || 
                           order.adresse_livraison?.adresse || 
                           "Adresse inconnue";

            // Pour les nouvelles commandes, utiliser la date de création
            // Pour les changements de statut, utiliser la date de mise à jour
            const notificationDate = isNewOrder 
              ? (order.created_at ? new Date(order.created_at) : currentTime)
              : currentTime;

            newNotifications.push({
              id: `${order.id}-${order.status_text}-${notificationDate.getTime()}`,
              orderId: order.id,
              orderNumber: order.numero,
              clientName,
              clientImage,
              message: getNotificationMessage(order.status_text),
              location,
              status: order.status_text,
              statusBg: order.status_bg,
              timestamp: notificationDate,
              isNew: true,
            });
          }
        });

        // Mettre à jour les références
        lastFetchedOrdersRef.current = currentOrderIds;
        lastOrderStatusRef.current = currentOrderStatuses;

        // Marquer que le premier chargement est terminé
        if (isInitialLoadRef.current) {
          isInitialLoadRef.current = false;
        }

        // Ajouter les nouvelles notifications en tête de liste
        if (newNotifications.length > 0) {
          setNotifications((prev) => {
            // Éviter les doublons
            const existingIds = new Set(prev.map((n) => n.id));
            const uniqueNew = newNotifications.filter((n) => !existingIds.has(n.id));
            return [...uniqueNew, ...prev].slice(0, 10); // Garder seulement les 10 plus récentes
          });
          setNotifying(true);
        }
      } catch (error) {
        // Ignorer silencieusement les erreurs
        console.error("Erreur lors du chargement des notifications:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Charger immédiatement
    loadNotifications();

    // Recharger toutes les 30 secondes pour détecter les nouvelles commandes et changements de statut
    const interval = setInterval(loadNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Fermer le dropdown quand on clique en dehors (mobile)
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        if (!target.closest('.notification-dropdown-container') && !target.closest('.dropdown-toggle')) {
          closeDropdown();
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative notification-dropdown-container">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={handleClick}
      >
        {notifications.some((n) => n.isNew) && (
          <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400 flex">
            <span className="absolute inline-flex w-full h-full bg-orange-400 rounded-full opacity-75 animate-ping"></span>
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      {/* Backdrop pour mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[9998] sm:hidden"
          onClick={closeDropdown}
        />
      )}

      {/* Dropdown - Modal plein écran sur mobile, dropdown normal sur desktop */}
      {isOpen && (
        <div
          className={`
            fixed inset-x-0 bottom-0 top-auto sm:absolute sm:inset-x-auto sm:bottom-auto sm:top-full
            sm:right-0 sm:mt-[17px]
            flex flex-col
            max-h-[85vh] sm:max-h-[480px]
            w-full sm:w-[350px] sm:max-w-[361px]
            rounded-t-2xl sm:rounded-2xl
            border border-gray-200 bg-white
            p-3 shadow-theme-lg
            dark:border-gray-800 dark:bg-gray-dark
            z-[9999] sm:z-40
          `}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
            <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Notifications
            </h5>
            <button
              onClick={closeDropdown}
              className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <svg
                className="fill-current"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
          <ul className="flex flex-col overflow-y-auto custom-scrollbar flex-1 min-h-0">
            {isLoading ? (
              <li className="flex items-center justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#04b05d] border-t-transparent" />
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">Chargement...</span>
              </li>
            ) : notifications.length === 0 ? (
              <li className="flex items-center justify-center py-8">
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Aucune notification
                </span>
              </li>
            ) : (
              notifications.map((notification) => (
                <li key={notification.id}>
                  <DropdownItem
                    tag="a"
                    to={`/order/${notification.orderId}`}
                    onItemClick={() => {
                      closeDropdown();
                      navigate(`/order/${notification.orderId}`);
                    }}
                    className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${
                      notification.isNew ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                    }`}
                  >
                    <span className="relative block w-full h-10 rounded-full z-1 max-w-10 flex-shrink-0">
                      <img
                        width={40}
                        height={40}
                        src={notification.clientImage}
                        alt={notification.clientName}
                        className="w-full overflow-hidden rounded-full"
                        onError={(e) => {
                          const target = e.currentTarget;
                          if (target.src !== "/images/user/User.jpg") {
                            target.src = "/images/user/User.jpg";
                          }
                        }}
                      />
                      <span
                        className={`absolute bottom-0 right-0 z-10 h-2.5 w-full max-w-2.5 rounded-full border-[1.5px] border-white dark:border-gray-900 ${getStatusBadgeColor(
                          notification.statusBg
                        )}`}
                      ></span>
                    </span>

                    <span className="block flex-1 min-w-0">
                      <span className="mb-1.5 block text-theme-sm text-gray-500 dark:text-gray-400 space-x-1">
                        <span className="font-medium text-gray-800 dark:text-white/90">
                          {notification.clientName}
                        </span>
                        <span>{notification.message}</span>
                        {notification.isNew && (
                          <span className="inline-block ml-1 h-2 w-2 rounded-full bg-orange-400"></span>
                        )}
                      </span>

                      <span className="flex items-center gap-2 text-gray-500 text-theme-xs dark:text-gray-400">
                        <span>{notification.location}</span>
                        <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                        <span>{formatTimeAgo(notification.timestamp)}</span>
                      </span>
                    </span>
                  </DropdownItem>
                </li>
              ))
            )}
          </ul>
          <Link
            to="/orders"
            onClick={closeDropdown}
            className="block px-4 py-2 mt-3 text-sm font-medium text-center text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            Voir toutes les commandes
          </Link>
        </div>
      )}
    </div>
  );
}
