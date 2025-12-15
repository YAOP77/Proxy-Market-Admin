/**
 * Page OrderDetails - Détails d'une commande
 * 
 * Affiche les détails complets d'une commande avec :
 * - Informations utilisateur (nom, numéro, localisation)
 * - Informations produit (quantité, image, prix, boutique)
 */

import { useEffect, useState, useMemo } from "react";
import { useParams } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import DeliveryTracking from "../../components/delivery/DeliveryTracking";
import commandeService, { CommandeDetail } from "../../services/api/commandeService";
import franchiseService, { Boutique } from "../../services/api/franchiseService";
import { useGoogleMaps } from "../../contexts/GoogleMapsContext";

  /**
 * Gère l'erreur de chargement d'image
   */
const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, fallback: string) => {
  const target = e.currentTarget;
  if (target.src !== fallback) {
    target.src = fallback;
    }
  };

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

export default function OrderDetails() {
  const { orderId } = useParams<{ orderId: string }>();
  const { isLoaded: isGoogleMapsLoaded } = useGoogleMaps();
  const [orderData, setOrderData] = useState<CommandeDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [boutique, setBoutique] = useState<Boutique | null>(null);
  const [isLoadingBoutique, setIsLoadingBoutique] = useState<boolean>(false);

  useEffect(() => {
    const loadOrderDetails = async () => {
      if (!orderId) {
        setError("ID de commande manquant");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const data = await commandeService.getCommandeDetail(orderId);
        setOrderData(data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Erreur lors du chargement des détails de la commande";
        setError(message);
        setOrderData(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderDetails();
  }, [orderId]);

  // Charger la boutique associée à la commande
  // Note: Pour l'instant, on récupère la première boutique disponible et on charge ses détails pour obtenir les coordonnées
  // Dans un cas réel, l'API devrait retourner l'ID de la boutique dans les détails de la commande
  useEffect(() => {
    const loadBoutique = async () => {
      // Ne pas charger si on a déjà une boutique ou si on n'a pas de données de commande
      if (!orderData || boutique) {
        return;
      }

      try {
        setIsLoadingBoutique(true);
        // Récupérer toutes les boutiques pour obtenir l'ID
        const boutiques = await franchiseService.getAllBoutiques();
        if (boutiques.length > 0) {
          // Prendre la première boutique active
          const activeBoutique = boutiques.find(b => b.status === 1) || boutiques[0];
          
          if (activeBoutique && activeBoutique.id) {
            // Charger les détails complets de la boutique pour obtenir les coordonnées
            // L'API retourne latitude et longitude dans les détails, pas dans la liste
            try {
              const boutiqueDetails = await franchiseService.getBoutiqueById(activeBoutique.id);
              // Vérifier que la boutique a des coordonnées valides
              if (boutiqueDetails.latitude && boutiqueDetails.longitude) {
                setBoutique(boutiqueDetails);
              } else {
                // Si pas de coordonnées, utiliser la boutique de la liste quand même
                setBoutique(activeBoutique);
              }
            } catch (detailError) {
              // Si erreur lors du chargement des détails, utiliser la boutique de la liste
              setBoutique(activeBoutique);
            }
          }
        }
      } catch (err) {
        // Ignorer l'erreur silencieusement, on n'affichera pas l'estimation
      } finally {
        setIsLoadingBoutique(false);
      }
    };

    loadBoutique();
  }, [orderData, boutique]);

  // Construire le nom du client
  const clientName = orderData?.client
    ? [orderData.client.nom, orderData.client.prenoms].filter(Boolean).join(" ") || "—"
    : "—";

  // Construire le contact du client
  const clientPhone = orderData?.client?.contact1 || orderData?.client?.contact2 || "—";

  // Construire la localisation
  const deliveryLocation = orderData?.adresse_livraison?.location_name || orderData?.adresse_livraison?.adresse || "—";
  const deliveryAddress = orderData?.adresse_livraison?.adresse || "";

  // Construire le nom du livreur
  const livreurName = orderData?.livreur
    ? [orderData.livreur.nom, orderData.livreur.prenoms].filter(Boolean).join(" ") || "Non assigné"
    : "Non assigné";

  // Date de commande formatée - utiliser datecommande si disponible, sinon created_at
  const orderDate = orderData?.datecommande || (orderData?.created_at
    ? new Date(orderData.created_at).toLocaleString("fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—");

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Chargement... | Proxy Market"
          description="Chargement des détails de la commande"
        />
        <PageBreadcrumb
          pageTitle="Détails de la commande"
          items={[
            { label: "Gestion des produits", href: "/orders" },
            { label: "Commandes", href: "/orders" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Chargement des détails...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !orderData) {
    return (
      <>
        <PageMeta
          title="Erreur | Proxy Market"
          description="Erreur lors du chargement de la commande"
        />
        <PageBreadcrumb
          pageTitle="Détails de la commande"
          items={[
            { label: "Gestion des produits", href: "/orders" },
            { label: "Commandes", href: "/orders" },
          ]}
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        />
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
          {error || "Commande introuvable"}
        </div>
      </>
    );
  }

  return (
    <>
      <PageMeta
        title={`Commande #${orderData.numero} | Proxy Market`}
        description={`Détails de la commande #${orderData.numero}`}
      />

      <PageBreadcrumb
        pageTitle={`Commande #${orderData.numero}`}
        items={[
          { label: "Gestion des produits", href: "/orders" },
          { label: "Commandes", href: "/orders" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      {/* Estimation de livraison - Section dédiée en premier */}
      {(() => {
        // Vérifier que toutes les conditions sont remplies
        const hasBoutique = boutique && boutique.latitude && boutique.longitude;
        const hasDeliveryCoords = orderData.adresse_livraison?.latitude && orderData.adresse_livraison?.longitude;
        
        // Convertir et valider les coordonnées
        const boutiqueLat = hasBoutique ? Number(boutique.latitude) : null;
        const boutiqueLng = hasBoutique ? Number(boutique.longitude) : null;
        const deliveryLat = hasDeliveryCoords ? Number(orderData.adresse_livraison.latitude) : null;
        const deliveryLng = hasDeliveryCoords ? Number(orderData.adresse_livraison.longitude) : null;
        
        const isValidBoutique = boutiqueLat !== null && !isNaN(boutiqueLat) && boutiqueLng !== null && !isNaN(boutiqueLng);
        const isValidDelivery = deliveryLat !== null && !isNaN(deliveryLat) && deliveryLng !== null && !isNaN(deliveryLng);
        
        // Déterminer la date de livraison réelle (si la commande est livrée)
        const isDelivered = orderData.status_text && (
          orderData.status_text.toLowerCase().includes("livrée") || 
          orderData.status_text.toLowerCase().includes("livree")
        );
        const deliveredAt = isDelivered && orderData.updated_at ? orderData.updated_at : null;
        
        if (isValidBoutique && isValidDelivery && isGoogleMapsLoaded) {
          return (
            <ComponentCard title="Estimation de livraison" className="mb-6">
              <DeliveryTracking
                origin={{
                  latitude: boutiqueLat,
                  longitude: boutiqueLng,
                }}
                destination={{
                  latitude: deliveryLat,
                  longitude: deliveryLng,
                }}
                originName={boutique.name}
                destinationName={orderData.adresse_livraison.location_name || orderData.adresse_livraison.adresse || "Adresse de livraison"}
                mode="driving"
                orderStatus={orderData.status_text}
                deliveredAt={deliveredAt}
                orderId={orderData.id}
      />
            </ComponentCard>
          );
        }
        
        // Afficher un indicateur de chargement si la boutique n'est pas encore chargée
        if (!boutique || !isValidBoutique || !isValidDelivery || !isGoogleMapsLoaded) {
          return (
            <ComponentCard title="Estimation de livraison" className="mb-6">
              <div className="flex items-center justify-center gap-3 py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#04b05d] border-t-transparent" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Chargement de l'estimation...
                </p>
              </div>
            </ComponentCard>
          );
        }
        
        return null;
      })()}
      
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Informations client */}
        <ComponentCard title="Informations client">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <img
                  src="/images/user/User.jpg"
                  alt={clientName}
                  className="w-full h-full object-cover"
                  onError={(e) => handleImageError(e, "/images/user/User.jpg")}
                />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                  {clientName}
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
                  <span className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-2 py-1">
                    {clientPhone}
                  </span>
                </p>
              </div>

              {orderData.client?.email && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Email
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {orderData.client.email}
                  </p>
                </div>
              )}
            </div>
          </div>
        </ComponentCard>

        {/* Adresse de livraison */}
        <ComponentCard title="Adresse de livraison">
          <div className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Localisation
                </label>
                <p className="mt-1">
                  <Badge size="sm" color="warning" className="border border-orange-300 dark:border-orange-600">
                    {deliveryLocation}
                  </Badge>
                </p>
              </div>

              {deliveryAddress && deliveryAddress !== deliveryLocation && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Adresse complète
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {deliveryAddress}
                  </p>
                </div>
              )}

              {orderData.adresse_livraison?.adresse_detail && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Détails supplémentaires
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {orderData.adresse_livraison.adresse_detail}
                  </p>
                </div>
              )}

              {orderData.adresse_livraison?.commune && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Commune
                  </label>
                  <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {orderData.adresse_livraison.commune}
                  </p>
                </div>
              )}

              {(orderData.adresse_livraison?.latitude || orderData.adresse_livraison?.longitude) && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Coordonnées géographiques
                </label>
                <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                    {orderData.adresse_livraison.latitude && orderData.adresse_livraison.longitude
                      ? `${orderData.adresse_livraison.latitude}, ${orderData.adresse_livraison.longitude}`
                      : orderData.adresse_livraison.latitude || orderData.adresse_livraison.longitude || "—"}
                </p>
              </div>
              )}

              {(orderData.adresse_livraison?.contact1 || orderData.adresse_livraison?.contact2) && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    Contact livraison
                  </label>
                  <div className="mt-1 space-y-1">
                    {orderData.adresse_livraison.contact1 && (
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        <span className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-2 py-1">
                          {orderData.adresse_livraison.contact1}
                        </span>
                      </p>
                    )}
                    {orderData.adresse_livraison.contact2 && (
                      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                        <span className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-2 py-1">
                          {orderData.adresse_livraison.contact2}
                        </span>
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Produit(s) */}
      <ComponentCard title="Détails des produits" className="mt-6">
        <div className="space-y-4">
          {/* Liste des produits de la commande */}
          {orderData.commande_details && orderData.commande_details.length > 0 ? (
          <div className="space-y-4">
              {orderData.commande_details.map((produit, index) => (
                <div key={produit.id || index} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                  <div className="w-16 h-16 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 flex-shrink-0">
                <img
                      src={produit.photo || produit.photo_prymary || "/images/product/product-01.jpg"}
                      alt={produit.libelle}
                  className="w-full h-full object-cover"
                      onError={(e) => handleImageError(e, "/images/product/product-01.jpg")}
                />
              </div>
              <div className="flex-1">
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {produit.libelle}
                    </h4>
                    {produit.description && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {produit.description}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-gray-500 dark:text-gray-400">
                      {produit.quantite && (
                        <span>Quantité: <strong>{produit.quantite}</strong></span>
                      )}
                      {produit.prix && (
                        <span>Prix unitaire: <strong>{produit.prix}</strong></span>
                      )}
                      {produit.valeur_poids && produit.unite_poids && (
                        <span>Poids: <strong>{produit.valeur_poids} {produit.unite_poids}</strong></span>
                      )}
                      {produit.categorie && (
                        <span>Catégorie: <strong>{produit.categorie}</strong></span>
                      )}
                      {produit.total_prix && (
                        <span>Total: <strong>{produit.total_prix}</strong></span>
                      )}
                    </div>
              </div>
            </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Aucun produit</p>
          )}

          {/* Récapitulatif des prix */}
            <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Quantité totale
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                {orderData.quantite}
                </p>
              </div>

            {orderData.soustotal && (
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Sous-total
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {orderData.soustotal}
                </p>
              </div>
            )}

            {orderData.frais_livraison && (
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                  Frais de livraison
                </label>
                <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                  {orderData.frais_livraison}
                </p>
              </div>
            )}

              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-200 dark:border-gray-700">
                <label className="text-base font-bold text-gray-800 dark:text-white/90">
                  Total
                </label>
              <p className="text-xl font-bold text-[#04b05d] dark:text-[#04b05d]">
                {orderData.total}
                </p>
              </div>
            </div>
          </div>
        </ComponentCard>

      {/* Informations complémentaires */}
      <ComponentCard title="Informations de commande" className="mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Numéro de commande
            </label>
            <p className="mt-1 text-sm font-medium text-[#04b05d] dark:text-[#04b05d]">
              #{orderData.numero}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Date de commande
            </label>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {orderDate}
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Statut
            </label>
            <p className="mt-1">
              {(() => {
                const styles = getStatusStyles(orderData.status_text || "", orderData.status_bg || "");
                // Remplacer les textes de statut comme dans OrdersList
                let displayStatus = orderData.status_text || "";
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
            </p>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
              Livreur assigné
            </label>
            <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
              {livreurName}
            </p>
            {orderData.livreur?.contact1 && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {orderData.livreur.contact1}
              </p>
            )}
          </div>

          {orderData.modepaiement && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Mode de paiement
              </label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {orderData.modepaiement}
              </p>
            </div>
          )}

          {orderData.status !== undefined && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Statut numérique
              </label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {orderData.status}
              </p>
            </div>
          )}

          {orderData.created_at && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Date de création (API)
              </label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(orderData.created_at).toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          )}

          {orderData.updated_at && (
            <div>
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Dernière mise à jour
              </label>
              <p className="mt-1 text-sm font-medium text-gray-800 dark:text-white/90">
                {new Date(orderData.updated_at).toLocaleString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
            </p>
          </div>
          )}
        </div>
      </ComponentCard>

    </>
  );
}
