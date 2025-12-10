/**
 * Page LivreurDetails - Détails d'un livreur
 *
 * Affiche les informations complètes d'un livreur
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import livreurService, { Livreur } from "../../services/api/livreurService";
import { formatPhoneNumber } from "../../utils/phoneUtils";

export default function LivreurDetails() {
  const { livreurId } = useParams<{ livreurId: string }>();
  const navigate = useNavigate();

  const [livreur, setLivreur] = useState<Livreur | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const loadLivreur = async () => {
    if (!livreurId) {
      setError("Identifiant livreur manquant.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const livreurData = await livreurService.getLivreurById(livreurId);
      setLivreur(livreurData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement du livreur";
      setError(message);
      setLivreur(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLivreur();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [livreurId]);

  const statusLabel = useMemo(() => {
    if (typeof livreur?.status === "number") {
      return livreur.status === 1 ? "Actif" : "Inactif";
    }
    return "Non défini";
  }, [livreur]);

  const statusColor = useMemo(() => {
    if (typeof livreur?.status === "number") {
      return livreur.status === 1 ? "success" : "error";
    }
    return "warning";
  }, [livreur]);

  const formatDate = (dateValue?: string | null) => {
    if (!dateValue) {
      return "—";
    }
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
      return dateValue;
    }
    return parsed.toLocaleString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderField = (label: string, value?: string | number | null) => (
    <div>
      <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm font-medium text-gray-800 dark:text-white/90">
        {value && String(value).trim().length > 0 ? value : "—"}
      </p>
    </div>
  );

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    target.src = "/images/user/User.jpg";
  };

  const fullName = useMemo(() => {
    if (!livreur) return "Livreur";
    const parts = [livreur.prenoms, livreur.nom].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Livreur";
  }, [livreur]);

  return (
    <>
      <PageMeta
        title={livreur ? `${fullName} | Livreur` : "Livreur"}
        description="Consultez les informations d'un livreur"
      />
      <PageBreadcrumb
        pageTitle="Détails du livreur"
        items={[
          { label: "Gestion des rôles", href: "/livreurs-table" },
          { label: "Liste des livreurs", href: "/livreurs-table" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {error && !isLoading && <Alert variant="error" title="Erreur" message={error} />}

        <ComponentCard
          title={fullName}
          action={
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate("/livreurs-table")}
              className="border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              Retour à la liste
            </Button>
          }
        >
          {isLoading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
              <p className="text-sm text-gray-500 dark:text-gray-400">Chargement des informations...</p>
            </div>
          ) : livreur ? (
            <div className="space-y-6">
              {/* Section principale avec photo et statut */}
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={livreur.photo || "/images/user/User.jpg"}
                      alt={fullName}
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      onError={handleImageError}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-base font-medium text-gray-800 dark:text-white/90">
                      {livreur.email || "—"}
                    </p>
                  </div>
                </div>
                <Badge
                  color={statusColor}
                  size="sm"
                  className={
                    statusColor === "success"
                      ? "border border-green-300 dark:border-green-600"
                      : ""
                  }
                >
                  {statusLabel}
                </Badge>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderField("Prénoms", livreur.prenoms)}
                {renderField("Nom", livreur.nom)}
                <div>
                  <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Rôle
                  </p>
                  <Badge size="sm" color="warning" className="border border-orange-300 dark:border-orange-600">
                    {livreur.role || "Livreur"}
                  </Badge>
                </div>
                {livreur.contact1 ? (
                  <div>
                    <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Contact principal
                    </p>
                    <div className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-1.5 py-1">
                      {formatPhoneNumber(livreur.contact1)}
                    </div>
                  </div>
                ) : (
                  renderField("Contact principal", "—")
                )}
                {livreur.contact2 ? (
                  <div>
                    <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Contact secondaire
                    </p>
                    <div className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-1.5 py-1">
                      {formatPhoneNumber(livreur.contact2)}
                    </div>
                  </div>
                ) : (
                  renderField("Contact secondaire", "—")
                )}
                {renderField("Adresse", livreur.adresse)}
                {renderField("Localisation", livreur.location_name || livreur.location)}
                {livreur.commune_id && renderField("Commune ID", livreur.commune_id)}
              </div>

              {/* Informations géographiques */}
              {(livreur.latitude || livreur.longitude) && (
                <div className="border-t pt-6 dark:border-gray-700">
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Coordonnées géographiques
                  </h4>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {renderField("Latitude", livreur.latitude)}
                    {renderField("Longitude", livreur.longitude)}
                  </div>
                </div>
              )}

              {/* Suivi du compte */}
              <div className="border-t pt-6 dark:border-gray-700">
                <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Suivi du compte
                </h4>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Statut
                    </p>
                    <Badge
                      color={statusColor}
                      size="sm"
                      className={
                        statusColor === "success"
                          ? "border border-green-300 dark:border-green-600"
                          : ""
                      }
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                  {renderField("Créé le", formatDate(livreur.created_at))}
                  {renderField("Mis à jour le", formatDate(livreur.updated_at))}
                  {livreur.email_verified_at && renderField("Email vérifié le", formatDate(livreur.email_verified_at))}
                </div>
              </div>
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              Aucune information disponible.
            </p>
          )}
        </ComponentCard>
      </div>
    </>
  );
}

