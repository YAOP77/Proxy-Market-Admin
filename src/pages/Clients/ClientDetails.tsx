/**
 * Page ClientDetails - Détails d'un client
 *
 * Affiche les informations complètes d'un client
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import ComponentCard from "../../components/common/ComponentCard";
import Badge from "../../components/ui/badge/Badge";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import clientService, { Client } from "../../services/api/clientService";
import { formatPhoneNumber } from "../../utils/phoneUtils";

export default function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  const loadClient = async () => {
    if (!clientId) {
      setError("Identifiant client manquant.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError("");
      const clientData = await clientService.getClientById(clientId);
      setClient(clientData);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors du chargement du client";
      setError(message);
      setClient(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const statusLabel = useMemo(() => {
    if (typeof client?.status === "number") {
      return client.status === 1 ? "Actif" : "Inactif";
    }
    return "Non défini";
  }, [client]);

  const statusColor = useMemo(() => {
    if (typeof client?.status === "number") {
      return client.status === 1 ? "success" : "error";
    }
    return "warning";
  }, [client]);

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
    if (!client) return "Client";
    const parts = [client.nom, client.prenoms].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Client";
  }, [client]);

  return (
    <>
      <PageMeta
        title={client ? `${fullName} | Client` : "Client"}
        description="Consultez les informations d'un client"
      />
      <PageBreadcrumb
        pageTitle="Détails du client"
        items={[
          { label: "Gestion des rôles", href: "/users-table" },
          { label: "Liste des utilisateurs", href: "/users-table" },
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
              onClick={() => navigate("/users-table")}
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
          ) : client ? (
            <div className="space-y-6">
              {/* Section principale avec photo et statut */}
              <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={client.photo || "/images/user/User.jpg"}
                      alt={fullName}
                      className="h-20 w-20 rounded-full object-cover border-2 border-gray-200 dark:border-gray-700"
                      onError={handleImageError}
                    />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                    <p className="text-base font-medium text-gray-800 dark:text-white/90">
                      {client.email || "—"}
                    </p>
                  </div>
                </div>
                <Badge
                  color={statusColor}
                  size="sm"
                  className={
                    statusColor === "success"
                      ? "border border-green-300 dark:border-green-600"
                      : statusColor === "error"
                      ? "border border-red-300 dark:border-red-600"
                      : ""
                  }
                >
                  {statusLabel}
                </Badge>
              </div>

              {/* Informations principales */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {renderField("Nom", client.nom)}
                {renderField("Prénoms", client.prenoms)}
                {client.contact1 ? (
                  <div>
                    <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Contact principal
                    </p>
                    <div className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-1.5 py-1">
                      {formatPhoneNumber(client.contact1)}
                    </div>
                  </div>
                ) : (
                  renderField("Contact principal", "—")
                )}
                {client.contact2 ? (
                  <div>
                    <p className="mb-1.5 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Contact secondaire
                    </p>
                    <div className="inline-block text-xs text-yellow-500 border border-yellow-300 bg-yellow-50 dark:border-yellow-600 dark:bg-yellow-900/20 rounded-full px-1.5 py-1">
                      {formatPhoneNumber(client.contact2)}
                    </div>
                  </div>
                ) : (
                  renderField("Contact secondaire", "—")
                )}
                {renderField("Adresse", client.adresse)}
                {renderField("Localisation", client.location_name || client.location)}
                {client.commune_id && renderField("Commune ID", client.commune_id)}
              </div>

              {/* Informations géographiques */}
              {(client.latitude || client.longitude) && (
                <div className="border-t pt-6 dark:border-gray-700">
                  <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Coordonnées géographiques
                  </h4>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    {renderField("Latitude", client.latitude)}
                    {renderField("Longitude", client.longitude)}
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
                          : statusColor === "error"
                          ? "border border-red-300 dark:border-red-600"
                          : ""
                      }
                    >
                      {statusLabel}
                    </Badge>
                  </div>
                  {renderField("Créé le", formatDate(client.created_at))}
                  {renderField("Mis à jour le", formatDate(client.updated_at))}
                  {client.email_verified_at && renderField("Email vérifié le", formatDate(client.email_verified_at))}
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

