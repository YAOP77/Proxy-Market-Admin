/**
 * Composant EditBoutiqueModal - Modal de modification de boutique
 * 
 * Affiche un formulaire pour modifier les informations d'une boutique
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import Button from "../ui/button/Button";
import GoogleMapPicker, { LocationData } from "../maps/GoogleMapPicker";
import franchiseService, { Boutique, UpdateBoutiqueData } from "../../services/api/franchiseService";
import { adminService, Commune } from "../../services/api/adminService";
import { cleanPhoneNumber, validatePhoneNumber } from "../../utils/phoneUtils";
import { validateEmail } from "../../utils/validationUtils";

interface EditBoutiqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  boutique: Boutique | null;
  onSuccess: () => void;
}

export default function EditBoutiqueModal({
  isOpen,
  onClose,
  boutique,
  onSuccess,
}: EditBoutiqueModalProps) {
  // État du formulaire
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [contact1, setContact1] = useState("");
  const [contact2, setContact2] = useState("");
  const [adresse, setAdresse] = useState("");
  const [communeId, setCommuneId] = useState<string>("");
  const [status, setStatus] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationName, setLocationName] = useState<string>("");

  // État pour les alertes
  const [showWarningAlert, setShowWarningAlert] = useState(false);
  const [isWarningAlertVisible, setIsWarningAlertVisible] = useState(false);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [error, setError] = useState("");

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);

  // État pour les communes
  const [communes, setCommunes] = useState<Commune[]>([]);
  const [isLoadingCommunes, setIsLoadingCommunes] = useState(true);

  // Charger les données de la boutique quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && boutique) {
      setName(boutique.name || "");
      setEmail(boutique.email || "");
      setContact1(boutique.contact_1 || "");
      setContact2(boutique.contact_2 || "");
      setAdresse(boutique.adresse || "");
      setLocationName(boutique.location_name || "");
      setCommuneId(boutique.commune_id ? String(boutique.commune_id) : "");
      // Convertir le status de number (1/0) vers "actif"/"inactif" pour le formulaire
      if (boutique.status !== null && boutique.status !== undefined) {
        setStatus(boutique.status === 1 ? "actif" : "inactif");
      } else {
        setStatus("");
      }
      
      // Extraire latitude et longitude de localisation (WKB) ou utiliser des valeurs par défaut
      // Pour l'instant, on utilise des valeurs par défaut car on ne peut pas facilement parser WKB
      // L'utilisateur devra re-sélectionner la position sur la carte
      // TODO: Si l'API retourne latitude/longitude séparément, les utiliser ici
      setLatitude(null);
      setLongitude(null);
      
      setError("");
      setShowWarningAlert(false);
      setShowSuccessAlert(false);
    }
  }, [isOpen, boutique]);

  // Charger la liste des communes
  useEffect(() => {
    if (isOpen) {
      const loadCommunes = async () => {
        try {
          setIsLoadingCommunes(true);
          const communesList = await adminService.getCommunes();
          setCommunes(communesList);
        } catch (error) {
          setCommunes([]);
        } finally {
          setIsLoadingCommunes(false);
        }
      };
      loadCommunes();
    }
  }, [isOpen]);

  // Gère l'affichage et la disparition de l'alerte d'avertissement
  useEffect(() => {
    if (showWarningAlert) {
      setIsWarningAlertVisible(true);
      const fadeOutTimer = setTimeout(() => {
        setIsWarningAlertVisible(false);
      }, 2500);
      const hideTimer = setTimeout(() => {
        setShowWarningAlert(false);
      }, 3000);
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setIsWarningAlertVisible(false);
    }
  }, [showWarningAlert]);

  // Gère l'affichage et la disparition de l'alerte de succès
  useEffect(() => {
    if (showSuccessAlert) {
      setIsSuccessAlertVisible(true);
      const fadeOutTimer = setTimeout(() => {
        setIsSuccessAlertVisible(false);
      }, 2500);
      const hideTimer = setTimeout(() => {
        setShowSuccessAlert(false);
      }, 3000);
      return () => {
        clearTimeout(fadeOutTimer);
        clearTimeout(hideTimer);
      };
    } else {
      setIsSuccessAlertVisible(false);
    }
  }, [showSuccessAlert]);

  /**
   * Gère la sélection de localisation sur la carte
   */
  const handleLocationSelect = useCallback((locationData: LocationData) => {
    setLatitude(locationData.lat);
    setLongitude(locationData.lng);
    
    // Si des informations d'adresse sont disponibles, mettre à jour le champ adresse
    if (locationData.address) {
      // Utiliser formatted_address si disponible, sinon location_name
      const addressToUse = locationData.address.formatted_address || locationData.address.location_name;
      if (addressToUse) {
        setAdresse(addressToUse);
      }
      
      // Stocker location_name pour l'envoyer à l'API
      if (locationData.address.location_name) {
        setLocationName(locationData.address.location_name);
      } else {
        setLocationName("");
      }
    } else {
      setLocationName("");
    }
  }, []);

  /**
   * Options pour le statut
   */
  const statusOptions = useMemo(
    () => [
      { value: "actif", label: "Actif" },
      { value: "inactif", label: "Inactif" },
    ],
    []
  );

  /**
   * Options pour les communes
   */
  const communeOptions = useMemo(
    () =>
      communes.map((commune) => ({
        value: String(commune.id),
        label: commune.libelle || String(commune.id),
      })),
    [communes]
  );

  /**
   * Gère la soumission du formulaire
   * @param e - Événement de soumission du formulaire
   */
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowWarningAlert(false);
    setShowSuccessAlert(false);

    if (!boutique) {
      setError("Aucune boutique sélectionnée");
      return;
    }

    // Nettoyer les valeurs des champs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedContact1 = contact1.trim();
    const trimmedAdresse = adresse.trim();
    const trimmedCommuneId = communeId.trim();
    const trimmedStatus = status.trim();

    // Utiliser les valeurs existantes de la boutique si les champs sont vides
    // Cela permet la modification partielle (modifier seulement un champ)
    const finalName = trimmedName || boutique.name || "";
    const finalEmail = trimmedEmail || boutique.email || "";
    const finalContact1 = trimmedContact1 || boutique.contact_1 || "";
    const finalAdresse = trimmedAdresse || boutique.adresse || "";
    const finalCommuneId = trimmedCommuneId || (boutique.commune_id ? String(boutique.commune_id) : "");
    const finalStatus = trimmedStatus || (boutique.status === 1 ? "actif" : boutique.status === 0 ? "inactif" : "");

    // Validation des champs requis avec les valeurs finales (existantes ou modifiées)
    if (
      !finalName || 
      !finalEmail || 
      !finalContact1 || 
      !finalAdresse || 
      !finalCommuneId || 
      !finalStatus
    ) {
      setShowWarningAlert(true);
      return;
    }

    // Pour la localisation : lors de la modification, la localisation n'est pas obligatoire
    // Si elle n'a pas été re-sélectionnée, on utilisera des coordonnées par défaut
    // L'API backend devrait conserver la localisation existante si elle n'a pas été modifiée
    // On ne bloque plus la soumission si la localisation n'a pas été re-sélectionnée

    // Validation de l'email avec la valeur finale
    if (!validateEmail(finalEmail)) {
      setError("Veuillez entrer une adresse email valide");
      return;
    }

    setIsLoading(true);

    try {
      // Nettoyer et valider le numéro de téléphone principal avec la valeur finale
      if (!validatePhoneNumber(finalContact1)) {
        setError("Le numéro de téléphone (Contact 1) doit contenir exactement 10 chiffres");
        setIsLoading(false);
        return;
      }
      
      const cleanedContact1 = cleanPhoneNumber(finalContact1);
      
      // Valider contact_2 s'il est fourni
      if (contact2 && contact2.trim()) {
        if (!validatePhoneNumber(contact2)) {
          setError("Le numéro de téléphone (Contact 2) doit contenir exactement 10 chiffres");
          setIsLoading(false);
          return;
        }
      }

      // Convertir le status de "actif"/"inactif" vers "1"/"0" comme l'API l'attend
      const statusValue = finalStatus.toLowerCase();
      const apiStatus = statusValue === "actif" ? "1" : statusValue === "inactif" ? "0" : statusValue;

      // Parser commune_id en nombre avec la valeur finale
      const parsedCommuneId = parseInt(finalCommuneId, 10);
      if (isNaN(parsedCommuneId) || parsedCommuneId <= 0) {
        setError("La commune sélectionnée n'est pas valide");
        setIsLoading(false);
        return;
      }

      // Gérer la localisation : utiliser les valeurs sélectionnées ou des valeurs par défaut
      // Si la localisation n'a pas été re-sélectionnée, utiliser des coordonnées par défaut d'Abidjan
      // L'API backend devrait conserver la localisation existante si elle n'a pas été modifiée
      const defaultLatitude = 5.3600; // Latitude d'Abidjan par défaut
      const defaultLongitude = -4.0083; // Longitude d'Abidjan par défaut
      
      let latitudeNum: number;
      let longitudeNum: number;
      
      if (latitude !== null && longitude !== null) {
        // Utiliser les coordonnées sélectionnées par l'utilisateur
        latitudeNum = Number(latitude);
        longitudeNum = Number(longitude);
      } else {
        // Si la localisation n'a pas été re-sélectionnée, utiliser des valeurs par défaut
        // L'API backend devrait conserver la localisation existante de la boutique
        latitudeNum = defaultLatitude;
        longitudeNum = defaultLongitude;
      }
      
      // S'assurer que latitude et longitude sont des nombres valides
      if (isNaN(latitudeNum) || isNaN(longitudeNum)) {
        setError("Les coordonnées de localisation ne sont pas valides. Veuillez sélectionner à nouveau un emplacement sur la carte.");
        setIsLoading(false);
        return;
      }

      // Préparer les données pour l'API avec les valeurs finales
      // Utiliser location_name si disponible, sinon utiliser l'adresse comme fallback
      const locationNameValue = locationName.trim() || finalAdresse;
      
      // S'assurer que location_name n'est jamais vide
      if (!locationNameValue) {
        setError("La localisation est requise. Veuillez sélectionner un emplacement sur la carte.");
        setIsLoading(false);
        return;
      }
      
      const boutiqueData: UpdateBoutiqueData = {
        name: finalName,
        email: finalEmail.toLowerCase(),
        contact_1: cleanedContact1,
        contact_2: contact2 && contact2.trim() ? cleanPhoneNumber(contact2) : "",
        adresse: finalAdresse,
        latitude: latitudeNum,
        longitude: longitudeNum,
        location_name: locationNameValue,
        commune_id: parsedCommuneId,
        status: apiStatus,
      };

      const result = await franchiseService.updateBoutique(boutique.id, boutiqueData);

      // Vérifier que la modification a vraiment réussi
      if (!result.success) {
        throw new Error(result.error || "La modification de la boutique a échoué");
      }

      // Afficher l'alerte de succès
      setShowSuccessAlert(true);
      
      // Appeler onSuccess après un court délai pour permettre à l'utilisateur de voir le message de succès
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Une erreur est survenue lors de la modification de la boutique";
      setError(errorMessage);
      setShowWarningAlert(false);
      setShowSuccessAlert(false);
    } finally {
      setIsLoading(false);
    }
  }, [boutique, name, email, contact1, contact2, adresse, communeId, status, latitude, longitude, onSuccess]);

  if (!isOpen || !boutique) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h3 className="text-xl font-semibold text-[#04b05d] dark:text-[#04b05d] mb-6">
          Modifier la boutique
        </h3>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
              <div className="font-medium mb-1">Erreur</div>
              <div className="whitespace-pre-line">{error}</div>
            </div>
          )}

          {showWarningAlert && isWarningAlertVisible && (
            <div className="p-3 text-sm text-yellow-600 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800">
              <div className="font-medium mb-1">Attention</div>
              <div>Veuillez remplir tous les champs requis (nom, email, contact 1, adresse, commune, statut et localisation sur la carte).</div>
            </div>
          )}

          {showSuccessAlert && isSuccessAlertVisible && (
            <div className="p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
              <div className="font-medium mb-1">Succès</div>
              <div>Boutique modifiée avec succès.</div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <Label htmlFor="edit-name">
                Nom de la boutique <span className="text-error-500">*</span>
              </Label>
              <Input
                id="edit-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de la boutique"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="edit-email">
                Email <span className="text-error-500">*</span>
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="edit-contact1">
                Contact principal <span className="text-error-500">*</span>
              </Label>
              <Input
                id="edit-contact1"
                type="tel"
                value={contact1}
                onChange={(e) => setContact1(e.target.value)}
                placeholder="+225 XX XX XX XX XX"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Le numéro sera automatiquement formaté en 10 chiffres
              </p>
            </div>

            <div>
              <Label htmlFor="edit-contact2">Contact secondaire</Label>
              <Input
                id="edit-contact2"
                type="tel"
                value={contact2}
                onChange={(e) => setContact2(e.target.value)}
                placeholder="+225 XX XX XX XX XX (optionnel)"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Optionnel - 10 chiffres requis si fourni
              </p>
            </div>


            <div>
              <Label htmlFor="edit-commune">
                Commune <span className="text-error-500">*</span>
              </Label>
              {isLoadingCommunes ? (
                <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Chargement des communes...
                  </span>
                </div>
              ) : (
                <Select
                  options={communeOptions}
                  value={communeId}
                  onChange={(value) => setCommuneId(value)}
                  placeholder="Sélectionnez une commune"
                  disabled={isLoadingCommunes || isLoading}
                />
              )}
            </div>

            <div>
              <Label htmlFor="edit-status">
                Statut <span className="text-error-500">*</span>
              </Label>
              <Select
                options={statusOptions}
                value={status}
                onChange={(value) => setStatus(value)}
                placeholder="Sélectionnez un statut"
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-localisation">
                Localisation sur la carte
              </Label>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Cliquez sur la carte pour modifier l'emplacement de la boutique (optionnel - la localisation existante sera conservée si non modifiée)
              </p>
            </div>
            
            <GoogleMapPicker
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={handleLocationSelect}
              height="400px"
            />

            {latitude !== null && longitude !== null && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-latitude">Latitude</Label>
                  <Input
                    id="edit-latitude"
                    type="text"
                    value={latitude.toFixed(6)}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-longitude">Longitude</Label>
                  <Input
                    id="edit-longitude"
                    type="text"
                    value={longitude.toFixed(6)}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                  />
                </div>
                
                {/* Adresse - verrouillée et pré-remplie automatiquement */}
                <div className="md:col-span-2">
                  <Label htmlFor="edit-adresse">
                    Adresse <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    id="edit-adresse"
                    type="text"
                    value={adresse}
                    disabled
                    className="bg-gray-50 dark:bg-gray-800"
                    placeholder="L'adresse sera détectée automatiquement depuis la carte"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Cette adresse est automatiquement détectée depuis Google Maps lors de la sélection d'un emplacement
                  </p>
                </div>
                
                {/* Localisation - verrouillée et pré-remplie automatiquement */}
                {locationName && (
                  <div className="md:col-span-2">
                    <Label htmlFor="edit-location-name">Localisation</Label>
                    <Input
                      id="edit-location-name"
                      type="text"
                      value={locationName}
                      disabled
                      className="bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700"
                      placeholder="La localisation sera détectée automatiquement depuis la carte"
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Cette localisation est automatiquement détectée depuis Google Maps lors de la sélection d'un emplacement
                    </p>
                  </div>
                )}
              </div>
            )}
            {latitude === null && longitude === null && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Cliquez sur la carte pour modifier l'emplacement de la boutique (optionnel - la localisation existante sera conservée)
              </p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              type="submit"
              variant="none"
              disabled={isLoading}
              className="flex-1 bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 disabled:opacity-50"
            >
              {isLoading ? "Modification..." : "Modifier la boutique"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

