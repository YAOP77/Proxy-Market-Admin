/**
 * Page OrdersList - Liste des commandes
 * 
 * Affiche toutes les commandes avec leurs statuts
 * Chaque commande est cliquable pour voir les détails
 */

import { useState } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";

interface Order {
  id: string;
  user: {
    name: string;
    image: string;
  };
  product: {
    name: string;
    quantity: number;
  };
  status: "En attente" | "En préparation" | "En livraison" | "Livré" | "Annulé";
  total: number;
  orderDate: string;
  deliveryLocation: string;
}

// Données simulées des commandes
const ordersData: Order[] = [
  {
    id: "CMD-001",
    user: {
      name: "David Brown",
      image: "/images/user/user-02.jpg",
    },
    product: {
      name: "SAC / FILET DE POMMES DE TERRE",
      quantity: 1,
    },
    status: "En attente",
    total: 4250,
    orderDate: "2024-01-15 14:30",
    deliveryLocation: "Yopougon",
  },
  {
    id: "CMD-002",
    user: {
      name: "Anne Loren",
      image: "/images/user/user-03.jpg",
    },
    product: {
      name: "SAC / FILET DE TOMATES",
      quantity: 2,
    },
    status: "Livré",
    total: 6250,
    orderDate: "2024-01-15 10:00",
    deliveryLocation: "Marcory",
  },
  {
    id: "CMD-003",
    user: {
      name: "Thomas Muller",
      image: "/images/user/user-04.jpg",
    },
    product: {
      name: "SAC / FILET DE RIZ",
      quantity: 1,
    },
    status: "En préparation",
    total: 4250,
    orderDate: "2024-01-15 08:15",
    deliveryLocation: "Cocody",
  },
  {
    id: "CMD-004",
    user: {
      name: "Sarah Johnson",
      image: "/images/user/user-05.jpg",
    },
    product: {
      name: "SAC / FILET DE BANANES",
      quantity: 3,
    },
    status: "Livré",
    total: 9250,
    orderDate: "2024-01-14 16:45",
    deliveryLocation: "Angré",
  },
  {
    id: "CMD-005",
    user: {
      name: "Pierre Martin",
      image: "/images/user/user-01.jpg",
    },
    product: {
      name: "SAC / FILET DE POMMES DE TERRE",
      quantity: 1,
    },
    status: "En livraison",
    total: 4250,
    orderDate: "2024-01-14 13:20",
    deliveryLocation: "Plateau",
  },
  {
    id: "CMD-006",
    user: {
      name: "Marie Dubois",
      image: "/images/user/user-17.jpg",
    },
    product: {
      name: "SAC / FILET D'OIGNONS",
      quantity: 2,
    },
    status: "Annulé",
    total: 8500,
    orderDate: "2024-01-13 11:00",
    deliveryLocation: "Koumassi",
  },
];

export default function OrdersList() {
  const [orders] = useState(ordersData);

  /**
   * Détermine la couleur du badge selon le statut
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "En attente":
        return "warning";
      case "En préparation":
        return "warning";
      case "En livraison":
        return "success";
      case "Livré":
        return "success";
      case "Annulé":
        return "error";
      default:
        return "warning";
    }
  };

  return (
    <>
      <PageMeta
        title="Liste des commandes | Proxy Market"
        description="Liste de toutes les commandes sur Proxy Market"
      />
      
      <PageBreadcrumb pageTitle="Liste des commandes" />
      
      <ComponentCard title="Toutes les commandes">
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
          <div className="max-w-full overflow-x-auto">
            <table className="w-full">
              {/* En-tête du tableau */}
              <thead className="border-b border-gray-100 dark:border-white/[0.05]">
                <tr>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-left dark:text-gray-400">
                    Commande
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-left dark:text-gray-400">
                    Client
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-left dark:text-gray-400">
                    Produit
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-left dark:text-gray-400">
                    Localisation
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-left dark:text-gray-400">
                    Date
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-left dark:text-gray-400">
                    Total
                  </th>
                  <th className="px-5 py-3 text-xs font-medium text-gray-500 text-left dark:text-gray-400">
                    Statut
                  </th>
                </tr>
              </thead>

              {/* Corps du tableau */}
              <tbody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="px-5 py-4 sm:px-6">
                      <Link
                        to={`/order/${order.id}`}
                        className="text-sm font-medium text-[#04b05d] hover:text-[#039850] dark:text-[#04b05d] dark:hover:text-[#039850]"
                      >
                        {order.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 overflow-hidden rounded-full">
                          <img
                            width={40}
                            height={40}
                            src={order.user.image}
                            alt={order.user.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <Link
                          to={`/order/${order.id}`}
                          className="text-sm font-medium text-gray-800 dark:text-white/90 hover:text-brand-600 dark:hover:text-brand-500"
                        >
                          {order.user.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/order/${order.id}`}
                        className="block text-sm text-[#d9c300] dark:text-[#d9c300] hover:text-[#c4b000] dark:hover:text-[#c4b000]"
                      >
                        {order.product.name}
                        <span className="text-gray-500 dark:text-gray-400">
                          {" "}
                          (x{order.product.quantity})
                        </span>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/order/${order.id}`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {order.deliveryLocation}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/order/${order.id}`}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                      >
                        {order.orderDate}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/order/${order.id}`}
                        className="text-sm font-medium text-gray-800 dark:text-white/90 hover:text-brand-600 dark:hover:text-brand-500"
                      >
                        {order.total.toLocaleString("fr-FR")} FCFA
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Badge size="sm" color={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ComponentCard>
    </>
  );
}

