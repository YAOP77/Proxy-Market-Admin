/**
 * Page OrderDetails - Détails d'une commande
 * 
 * Affiche les détails complets d'une commande avec :
 * - Informations utilisateur (nom, numéro, localisation)
 * - Informations produit (quantité, image, prix, boutique)
 * - Boutons d'action (Préparer / Annuler)
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Button from "../../components/ui/button/Button";
import AssignDeliveryModal from "../../components/modals/AssignDeliveryModal";

interface OrderDetailsData {
  id: string;
  user: {
    name: string;
    phone: string;
    location: string;
    image: string;
  };
  product: {
    name: string;
    quantity: number;
    image: string;
    price: number;
    shop: string;
  };
  deliveryFee: number;
  serviceFee: number;
  status: string;
  orderDate: string;
}

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Données simulées - sera remplacé par l'appel API
  const orderData: OrderDetailsData = {
    id: orderId || "CMD-001",
    user: {
      name: "David Brown",
      phone: "+225 07 12 34 56 78",
      location: "Yopougon, Cocody",
      image: "/images/user/user-02.jpg",
    },
    product: {
      name: "SAC / FILET DE POMMES DE TERRE",
      quantity: 1,
      image: "/images/product/product-06.jpg",
      price: 3000,
      shop: "Boutique : Maman Janette",
    },
    deliveryFee: 1000,
    serviceFee: 250,
    status: "En attente",
    orderDate: "2024-01-15 14:30",
  };

  /**
   * Gère l'annulation de la commande
   */
  const handleCancel = () => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette commande ?")) {
      console.log("Commande annulée:", orderData.id);
      // TODO: Appel API pour annuler la commande
      navigate("/");
    }
  };

  /**
   * Ouvre le modal d'attribution à un livreur
   */
  const handlePrepare = () => {
    setShowAssignModal(true);
  };

  /**
   * Gère la fermeture du modal
   */
  const handleCloseModal = () => {
    setShowAssignModal(false);
  };

  /**
   * Gère l'attribution de la livraison
   */
  const handleAssignDelivery = (deliveryManId: string) => {
    console.log("Livraison attribuée au livreur:", deliveryManId);
    // TODO: Appel API pour attribuer la livraison
    setShowAssignModal(false);
    // Optionnel : rediriger vers la liste des commandes
    // navigate("/");
  };

  return (
    <>
      <PageMeta
        title={`Détails de la commande ${orderData.id} | Proxy Market`}
        description={`Détails de la commande ${orderData.id}`}
      />
      
      <PageBreadcrumb pageTitle={`Commande ${orderData.id}`} />
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Informations utilisateur */}
        <ComponentCard title="Informations client">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 overflow-hidden rounded-full">
                <img
                  src={orderData.user.image}
                  alt={orderData.user.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {orderData.user.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Client
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Numéro de téléphone
                </label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {orderData.user.phone}
                </p>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Localisation
                </label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                  {orderData.user.location}
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>

        {/* Informations produit */}
        <ComponentCard title="Détails du produit">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-800">
                <img
                  src={orderData.product.image}
                  alt={orderData.product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {orderData.product.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {orderData.product.shop}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Quantité
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {orderData.product.quantity}
                </p>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Prix unitaire
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {orderData.product.price.toLocaleString('fr-FR')} FCFA
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-800">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Sous-total
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {(orderData.product.quantity * orderData.product.price).toLocaleString('fr-FR')} FCFA
                </p>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Frais de livraison
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {orderData.deliveryFee.toLocaleString('fr-FR')} FCFA
                </p>
              </div>

              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Frais de service
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {orderData.serviceFee.toLocaleString('fr-FR')} FCFA
                </p>
              </div>

              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 dark:border-gray-700">
                <label className="text-base font-bold text-gray-800 dark:text-white/90">
                  Total
                </label>
                <p className="text-xl font-bold text-brand-600 dark:text-brand-500">
                  {(orderData.product.quantity * orderData.product.price + orderData.deliveryFee + orderData.serviceFee).toLocaleString('fr-FR')} FCFA
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Informations complémentaires */}
      <ComponentCard title="Informations de commande" className="mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Numéro de commande
            </label>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {orderData.id}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Date de commande
            </label>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {orderData.orderDate}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Statut
            </label>
            <p className="mt-1">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-900/30 dark:text-warning-400">
                {orderData.status}
              </span>
            </p>
          </div>
        </div>
      </ComponentCard>

      {/* Boutons d'action */}
      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={handleCancel}
          className="w-full sm:w-auto"
        >
          Annuler la commande
        </Button>
        <Button
          variant="primary"
          onClick={handlePrepare}
          className="w-full sm:w-auto"
        >
          Préparer la commande
        </Button>
      </div>

      {/* Modal d'attribution à un livreur */}
      <AssignDeliveryModal
        isOpen={showAssignModal}
        onClose={handleCloseModal}
        onAssign={handleAssignDelivery}
        orderId={orderData.id}
      />
    </>
  );
}

