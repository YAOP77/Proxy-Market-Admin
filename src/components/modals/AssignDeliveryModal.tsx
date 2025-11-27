/**
 * Composant AssignDeliveryModal - Modal d'attribution à un livreur
 * 
 * Affiche la liste des livreurs actifs avec leurs localités
 * et permet d'attribuer la livraison à un livreur
 */

import Button from "../ui/button/Button";

interface DeliveryMan {
  id: string;
  name: string;
  phone: string;
  location: string;
  image: string;
  status: "available" | "busy";
  activeDeliveries: number;
}

interface AssignDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssign: (deliveryManId: string) => void;
  orderId: string;
}

// Données simulées des livreurs
const deliveryMen: DeliveryMan[] = [
  {
    id: "LV-001",
    name: "Jean Kouassi",
    phone: "+225 05 11 22 33 44",
    location: "Port-Bouet",
    image: "/images/user/user-06.jpg",
    status: "available",
    activeDeliveries: 2,
  },
  {
    id: "LV-002",
    name: "Marie Diallo",
    phone: "+225 07 99 88 77 66",
    location: "Yopougon",
    image: "/images/user/user-07.jpg",
    status: "available",
    activeDeliveries: 1,
  },
  {
    id: "LV-003",
    name: "Paul Gbame",
    phone: "+225 01 44 55 66 77",
    location: "Marcory",
    image: "/images/user/user-08.jpg",
    status: "available",
    activeDeliveries: 0,
  },
  {
    id: "LV-004",
    name: "Sophie Kouassi",
    phone: "+225 06 33 44 55 66",
    location: "Koumassi",
    image: "/images/user/user-09.jpg",
    status: "busy",
    activeDeliveries: 5,
  },
  {
    id: "LV-005",
    name: "Martin N'Guessan",
    phone: "+225 05 66 77 88 99",
    location: "Cocody",
    image: "/images/user/user-10.jpg",
    status: "available",
    activeDeliveries: 3,
  },
];

export default function AssignDeliveryModal({
  isOpen,
  onClose,
  onAssign,
  orderId,
}: AssignDeliveryModalProps) {
  if (!isOpen) return null;

  // Filtrer uniquement les livreurs disponibles
  const availableDeliveryMen = deliveryMen.filter(
    (man) => man.status === "available"
  );

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90">
            Attribuer la livraison
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Sélectionnez un livreur disponible pour la commande{" "}
            <span className="font-semibold text-gray-800 dark:text-white/90">
              {orderId}
            </span>
          </p>

          {availableDeliveryMen.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun livreur disponible pour le moment
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {availableDeliveryMen.map((deliveryMan) => (
                <button
                  key={deliveryMan.id}
                  onClick={() => onAssign(deliveryMan.id)}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left"
                >
                  <div className="w-12 h-12 overflow-hidden rounded-full flex-shrink-0">
                    <img
                      src={deliveryMan.image}
                      alt={deliveryMan.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90 truncate">
                        {deliveryMan.name}
                      </h4>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success-100 text-success-800 dark:bg-success-900/30 dark:text-success-400 flex-shrink-0 ml-2">
                        Disponible
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        <span>{deliveryMan.location}</span>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        •
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {deliveryMan.activeDeliveries} livraison(s) en cours
                      </span>
                    </div>
                  </div>

                  <svg
                    className="w-5 h-5 text-gray-400 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-800">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}

