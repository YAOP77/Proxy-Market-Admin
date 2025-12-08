/**
 * Composant EditProductModal - Modal de modification de produit vivrier
 * 
 * Affiche un formulaire pour modifier les informations d'un produit vivrier
 */

import { useState, useEffect, useMemo } from "react";
import { useDropzone } from "react-dropzone";
import { Modal } from "../ui/modal";
import Label from "../form/Label";
import Input from "../form/input/InputField";
import Select from "../form/Select";
import TextArea from "../form/input/TextArea";
import Button from "../ui/button/Button";
import Alert from "../ui/alert/Alert";
import productService, {
  Product,
  UpdateProductData,
  Category,
  ExistingProductPhotoPayload,
} from "../../services/api/productService";

const ensureStringValue = (value: unknown, fallback = ""): string => {
  if (value === undefined || value === null) {
    return fallback;
  }
  return String(value);
};

const getCategorieIdentifier = (prod?: Product | null): string => {
  if (!prod) {
    return "";
  }
  if (prod.categorie_id !== undefined && prod.categorie_id !== null) {
    return String(prod.categorie_id).trim();
  }
  if (typeof prod.categorie === "string") {
    return prod.categorie.trim();
  }
  if (
    prod.categorie &&
    typeof prod.categorie === "object" &&
    "id" in prod.categorie &&
    (prod.categorie as { id?: string | number }).id !== undefined &&
    (prod.categorie as { id?: string | number }).id !== null
  ) {
    return String((prod.categorie as { id?: string | number }).id).trim();
  }
  return "";
};

type RawPhoto = Record<string, unknown>;

interface ExistingPhoto {
  id: string;
  url: string;
  isPrimary: boolean;
  isDeleting?: boolean;
}

const BLOCKED_IMAGE_KEYWORDS = ["default.webp", "default.jpg", "default.png"];
const URL_KEYS = ["photo", "url", "path", "image"] as const;
const ID_KEYS = ["id", "photo_id", "image_id"] as const;

const isTruthyPrimary = (value: unknown): boolean => {
  if (value === undefined || value === null) {
    return false;
  }
  if (typeof value === "number") {
    return value === 1;
  }
  const normalized = String(value).toLowerCase().trim();
  return normalized === "1" || normalized === "true";
};

const resolvePhotoUrl = (photo: RawPhoto): string | null => {
  for (const key of URL_KEYS) {
    const rawValue = photo[key];
    if (typeof rawValue !== "string") {
      continue;
    }
    const trimmed = rawValue.trim();
    if (!trimmed) {
      continue;
    }
    const lowerCased = trimmed.toLowerCase();
    if (BLOCKED_IMAGE_KEYWORDS.some((keyword) => lowerCased.includes(keyword))) {
      continue;
    }
    return trimmed;
  }
  return null;
};

const resolvePhotoIdentifier = (photo: RawPhoto): string | number | null => {
  for (const key of ID_KEYS) {
    const value = photo[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number") {
      return value;
    }
  }
  return null;
};

const normalizeExistingPhotoState = (
  photos: ExistingPhoto[],
  options: { enforcePrimary?: boolean } = {}
): ExistingPhoto[] => {
  const { enforcePrimary = false } = options;

  if (photos.length === 0) {
    return [];
  }

  let normalized = photos;

  if (enforcePrimary) {
    const hasPrimary = photos.some((photo) => photo.isPrimary);
    if (!hasPrimary) {
      normalized = photos.map((photo, index) =>
        index === 0 ? { ...photo, isPrimary: true } : photo
      );
    }
  }

  return [...normalized].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary));
};

const extractExistingPhotos = (product?: Product | null): ExistingPhoto[] => {
  if (!product) {
    return [];
  }

  const sourcePhotos: RawPhoto[] =
    Array.isArray(product.all_photos) && product.all_photos.length > 0
      ? (product.all_photos as RawPhoto[])
      : Array.isArray(product.photos)
      ? (product.photos as RawPhoto[])
      : [];

  const normalized: ExistingPhoto[] = [];

  sourcePhotos.forEach((photo) => {
    const url = resolvePhotoUrl(photo);
    const identifier = resolvePhotoIdentifier(photo);

    if (!url || identifier === null || identifier === undefined) {
      return;
    }

    normalized.push({
      id: String(identifier),
      url,
      isPrimary: isTruthyPrimary(photo?.is_primary),
    });
  });

  return normalizeExistingPhotoState(normalized, { enforcePrimary: true });
};

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess: () => void;
}

export default function EditProductModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: EditProductModalProps) {
  // État du formulaire
  const [libelle, setLibelle] = useState("");
  const [unitePoids, setUnitePoids] = useState("");
  const [valeurPoids, setValeurPoids] = useState("");
  const [categorie, setCategorie] = useState("");
  const [prixAchat, setPrixAchat] = useState("");
  const [prixVenteNormale, setPrixVenteNormale] = useState("");
  const [prixVenteReduit, setPrixVenteReduit] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [existingPhotos, setExistingPhotos] = useState<ExistingPhoto[]>([]);
  const [detailedProduct, setDetailedProduct] = useState<Product | null>(null);
  const [isLoadingProductDetails, setIsLoadingProductDetails] = useState(false);

  // État pour les alertes
  const [showWarningAlert, setShowWarningAlert] = useState(false);
  const [isWarningAlertVisible, setIsWarningAlertVisible] = useState(false);
  const [error, setError] = useState("");

  // État pour le chargement
  const [isLoading, setIsLoading] = useState(false);

  // État pour les catégories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Options pour les Select
  const unitePoidsOptions = [
    { value: "kg", label: "kg" },
    { value: "g", label: "g" },
    { value: "kgs", label: "kgs" },
  ];

  const statusOptions = [
    { value: "actif", label: "Disponible" },
    { value: "inactif", label: "Indisponible" },
  ];

  const categorieOptions = useMemo(() => {
    return categories.map((cat) => ({
      value: cat.id.toString(),
      label: cat.libelle,
    }));
  }, [categories]);

  const resolvedProduct = useMemo(() => detailedProduct ?? product ?? null, [detailedProduct, product]);
  const isFormDisabled = isLoading || isLoadingProductDetails;

  // Configuration du dropzone pour les images
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles: File[]) => {
      // Ajouter les nouvelles images aux images existantes
      setPhotos((prevPhotos) => [...prevPhotos, ...acceptedFiles]);
    },
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/jpg": [],
      "image/webp": [],
    },
    multiple: true,
  });

  // Charger systématiquement les informations complètes du produit
  useEffect(() => {
    if (!isOpen || !product?.id) {
      setDetailedProduct(null);
      setIsLoadingProductDetails(false);
      return;
    }

    let isCancelled = false;

    const fetchProductDetails = async () => {
      try {
        setIsLoadingProductDetails(true);
        const fullProduct = await productService.getProductById(product.id);
        if (!isCancelled) {
          setDetailedProduct(fullProduct);
        }
      } catch (error) {
        if (!isCancelled && import.meta.env.DEV) {
          const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
          console.error("[EditProductModal] Erreur chargement produit:", errorMessage);
        }
        if (!isCancelled) {
          setDetailedProduct(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingProductDetails(false);
        }
      }
    };

    fetchProductDetails();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, product?.id]);

  // Pré-remplir le formulaire lorsque les données sont disponibles
  useEffect(() => {
    if (isOpen && resolvedProduct) {
      setLibelle(ensureStringValue(resolvedProduct.libelle));
      setUnitePoids(ensureStringValue(resolvedProduct.unite_poids));
      setValeurPoids(ensureStringValue(resolvedProduct.valeur_poids));

      setCategorie(getCategorieIdentifier(resolvedProduct));
      setPrixAchat(ensureStringValue(resolvedProduct.prix_achat));
      setPrixVenteNormale(ensureStringValue(resolvedProduct.prix_vente_normale));
      setPrixVenteReduit(ensureStringValue(resolvedProduct.prix_vente_reduit, "0"));
      setDescription(ensureStringValue(resolvedProduct.description));

      if (resolvedProduct.status !== null && resolvedProduct.status !== undefined) {
        if (typeof resolvedProduct.status === "number") {
          setStatus(resolvedProduct.status === 1 ? "actif" : "inactif");
        } else if (typeof resolvedProduct.status === "string") {
          const statusStr = resolvedProduct.status.toLowerCase().trim();
          if (statusStr === "1" || statusStr === "actif" || statusStr === "active") {
            setStatus("actif");
          } else {
            setStatus("inactif");
          }
        } else {
          setStatus("");
        }
      } else {
        setStatus("");
      }

      setPhotos([]);
      setExistingPhotos(extractExistingPhotos(resolvedProduct));
      setError("");
      setShowWarningAlert(false);
    } else if (!isOpen) {
      setPhotos([]);
      setExistingPhotos([]);
      setDetailedProduct(null);
    }
  }, [isOpen, resolvedProduct]);

  // Charger la liste des catégories
  useEffect(() => {
    if (isOpen) {
      const loadCategories = async () => {
        try {
          setIsLoadingCategories(true);
          const categoriesList = await productService.getCategories();
          setCategories(categoriesList);
        } catch (_error) {
          setCategories([]);
        } finally {
          setIsLoadingCategories(false);
        }
      };

      loadCategories();
    }
  }, [isOpen]);

  // Gère l'affichage et la disparition de l'alerte d'avertissement avec transition
  useEffect(() => {
    if (showWarningAlert) {
      setIsWarningAlertVisible(true);
      const timer = setTimeout(() => {
        setIsWarningAlertVisible(false);
        setTimeout(() => setShowWarningAlert(false), 300);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showWarningAlert]);

  /**
   * Met à jour la photo existante principale
   */
  const setExistingPhotoAsPrimary = (photoId: string) => {
    setExistingPhotos((prev) => {
      const index = prev.findIndex((photo) => photo.id === photoId);
      if (index === -1) {
        return prev;
      }

      const updated = prev.map((photo, idx) => ({
        ...photo,
        isPrimary: idx === index,
      }));

      return normalizeExistingPhotoState(updated, { enforcePrimary: true });
    });
  };

  /**
   * Rendre une photo existante secondaire
   */
  const unsetExistingPhotoPrimary = (photoId: string) => {
    setExistingPhotos((prev) =>
      normalizeExistingPhotoState(
        prev.map((photo) =>
          photo.id === photoId ? { ...photo, isPrimary: false } : photo
        )
      )
    );
  };

  /**
   * Suppression d'une photo existante via l'API
   */
  const deleteExistingPhoto = async (photoId: string) => {
    if (!photoId || isLoading) {
      return;
    }

    const targetPhoto = existingPhotos.find((photo) => photo.id === photoId);
    if (!targetPhoto) {
      return;
    }

    const confirmation = window.confirm(
      "Voulez-vous vraiment supprimer cette image ? Cette action est irréversible."
    );

    if (!confirmation) {
      return;
    }

    setExistingPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, isDeleting: true } : photo
      )
    );

    try {
      const result = await productService.deleteProductImage(photoId);
      if (!result.success) {
        throw new Error(result.error || "La suppression de l'image a échoué");
      }

      setExistingPhotos((prev) => {
        const remaining = prev.filter((photo) => photo.id !== photoId);
        const shouldEnforcePrimary =
          remaining.length > 0 && !remaining.some((photo) => photo.isPrimary);

        return normalizeExistingPhotoState(remaining, {
          enforcePrimary: shouldEnforcePrimary,
        });
      });
    } catch (deleteError) {
      const errorMessage =
        deleteError instanceof Error
          ? deleteError.message
          : "Impossible de supprimer l'image";
      setError(errorMessage);
      setExistingPhotos((prev) =>
        prev.map((photo) =>
          photo.id === photoId ? { ...photo, isDeleting: false } : photo
        )
      );
    }
  };

  /**
   * Supprime une image nouvellement ajoutée
   */
  const removePhoto = (index: number) => {
    setPhotos((prevPhotos) => prevPhotos.filter((_, i) => i !== index));
  };

  /**
   * Place une nouvelle image en première position (principale côté frontend)
   */
  const setNewPhotoAsPrimary = (index: number) => {
    if (index === 0) {
      return;
    }

    setPhotos((prevPhotos) => {
      const updated = [...prevPhotos];
      const [selected] = updated.splice(index, 1);
      updated.unshift(selected);
      return updated;
    });

    // Toutes les photos existantes redeviennent secondaires si une nouvelle image devient principale
    setExistingPhotos((prev) =>
      prev.map((photo) => ({ ...photo, isPrimary: false }))
    );
  };

  /**
   * Gère la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setShowWarningAlert(false);

    const productSnapshot = resolvedProduct ?? product;

    const fallbackStringValue = (value: unknown): string => {
      if (value === undefined || value === null) {
        return "";
      }
      return String(value).trim();
    };

    const deriveProductStatus = (): string => {
      if (!productSnapshot) return "";
      if (typeof productSnapshot.status === "number") {
        return productSnapshot.status === 1 ? "actif" : "inactif";
      }
      if (typeof productSnapshot.status === "string") {
        const normalized = productSnapshot.status.toLowerCase().trim();
        if (normalized === "1" || normalized === "actif") {
          return "actif";
        }
        if (normalized === "0" || normalized === "inactif") {
          return "inactif";
        }
      }
      return "";
    };

    const determineCategorieId = (): string => {
      if (!productSnapshot) return "";
      return getCategorieIdentifier(productSnapshot);
    };

    const finalLibelle = libelle.trim() || fallbackStringValue(productSnapshot?.libelle);
    const finalUnitePoids = unitePoids.trim() || fallbackStringValue(productSnapshot?.unite_poids);
    const finalValeurPoidsString = valeurPoids.trim() || fallbackStringValue(productSnapshot?.valeur_poids);
    const finalCategorie = categorie.trim() || determineCategorieId();
    const finalPrixAchatString = prixAchat.trim() || fallbackStringValue(productSnapshot?.prix_achat);
    const finalPrixVenteNormaleString =
      prixVenteNormale.trim() || fallbackStringValue(productSnapshot?.prix_vente_normale);
    const finalPrixVenteReduitString =
      prixVenteReduit.trim() || fallbackStringValue(productSnapshot?.prix_vente_reduit);
    const finalDescription = description.trim() || (productSnapshot?.description?.trim?.() ?? "");
    const finalStatus = status.trim() || deriveProductStatus();

    const missingFields: string[] = [];
    if (!finalLibelle) missingFields.push("libellé");
    if (!finalUnitePoids) missingFields.push("unité de poids");
    if (!finalValeurPoidsString) missingFields.push("valeur du poids");
    if (!finalPrixVenteNormaleString) missingFields.push("prix de vente normale");
    if (!finalDescription) missingFields.push("description");
    if (!finalStatus) missingFields.push("statut");

    if (missingFields.length > 0) {
      setShowWarningAlert(true);
      setError(`Les champs suivants sont requis : ${missingFields.join(", ")}`);
      return;
    }

    // Validation des valeurs numériques
    const valeurPoidsNum = parseFloat(finalValeurPoidsString);
    const prixAchatNum = parseFloat(finalPrixAchatString);
    const prixVenteNormaleNum = parseFloat(finalPrixVenteNormaleString);
    const prixVenteReduitNum = parseFloat(finalPrixVenteReduitString);

    if (isNaN(valeurPoidsNum) || valeurPoidsNum <= 0) {
      setError("La valeur du poids doit être un nombre positif");
      return;
    }

    if (isNaN(prixAchatNum) || prixAchatNum <= 0) {
      setError("Le prix d'achat doit être un nombre positif");
      return;
    }

    if (isNaN(prixVenteNormaleNum) || prixVenteNormaleNum <= 0) {
      setError("Le prix de vente normale doit être un nombre positif");
      return;
    }

    if (isNaN(prixVenteReduitNum) || prixVenteReduitNum < 0) {
      setError("Le prix de vente réduit doit être un nombre positif ou égal à zéro");
      return;
    }

    const hasExistingPrimary = existingPhotos.some((photo) => photo.isPrimary);

    if (!hasExistingPrimary && photos.length === 0 && existingPhotos.length > 0) {
      setError("Veuillez définir une image principale ou ajouter une nouvelle photo.");
      return;
    }

    // Validation des images si des images sont fournies
    if (photos.length > 0) {
      const validImageTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      const maxFileSize = 10 * 1024 * 1024; // 10 Mo
      
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        
        if (!(photo instanceof File)) {
          setError(`L'image ${i + 1} n'est pas un fichier valide`);
          return;
        }
        
        if (!validImageTypes.includes(photo.type)) {
          setError(`L'image ${i + 1} doit être au format PNG, JPEG, JPG ou WEBP. Type reçu: ${photo.type || "inconnu"}`);
          return;
        }
        
        if (photo.size > maxFileSize) {
          const sizeInMB = (photo.size / (1024 * 1024)).toFixed(2);
          setError(`L'image ${i + 1} est trop volumineuse (${sizeInMB} Mo). Maximum autorisé: 10 Mo`);
          return;
        }
        
        if (photo.size === 0) {
          setError(`L'image ${i + 1} est vide`);
          return;
        }
      }
    }

    setIsLoading(true);

    try {
      const targetProductId = productSnapshot?.id ?? product?.id;

      if (!targetProductId) {
        throw new Error("Produit non trouvé");
      }

      // Convertir le status de "actif"/"inactif" vers "1"/"0"
      const statusValue = finalStatus.toLowerCase();
      const apiStatus = statusValue === "actif" ? "1" : statusValue === "inactif" ? "0" : statusValue;

      // Trier les photos existantes pour mettre l'image principale en premier
      // L'API pourrait utiliser l'ordre pour déterminer quelle image est principale
      const sortedExistingPhotos = [...existingPhotos].sort((a, b) => {
        if (a.isPrimary && !b.isPrimary) return -1;
        if (!a.isPrimary && b.isPrimary) return 1;
        return 0;
      });

      const existingPhotosPayload: ExistingProductPhotoPayload[] | undefined =
        sortedExistingPhotos.length > 0
          ? sortedExistingPhotos.map((photo, index) => ({
              id: photo.id,
              // La première image (index 0) est toujours principale si elle est marquée comme telle
              // Sinon, utiliser le flag isPrimary
              is_primary: index === 0 && sortedExistingPhotos[0].isPrimary ? 1 : photo.isPrimary ? 1 : 0,
            }))
          : undefined;

      if (import.meta.env.DEV && existingPhotosPayload) {
        console.log("[EditProductModal] Nombre de photos existantes à envoyer:", existingPhotosPayload.length);
      }

      // Préparer les données
      const productData: UpdateProductData = {
        libelle: finalLibelle,
        unite_poids: finalUnitePoids,
        valeur_poids: valeurPoidsNum,
        categorie_id: finalCategorie,
        prix_achat: prixAchatNum,
        prix_vente_normale: prixVenteNormaleNum,
        prix_vente_reduit: prixVenteReduitNum,
        description: finalDescription,
        status: apiStatus,
        photos: photos.length > 0 ? photos : undefined,
        existingPhotos: existingPhotosPayload,
      };

      if (import.meta.env.DEV) {
        // Ne pas logger les données complètes du produit pour éviter d'exposer des informations
        console.log("[EditProductModal] Envoi de la modification avec", productData.photos?.length ?? 0, "nouvelle(s) photo(s)");
      }

      const result = await productService.updateProduct(targetProductId, productData);

      if (import.meta.env.DEV) {
        // Ne pas logger la réponse API complète pour éviter d'exposer des informations sensibles
        console.log("[EditProductModal] Modification réussie:", result.success);
      }

      // Vérifier que la modification a vraiment réussi
      if (!result.success) {
        throw new Error(result.error || "La modification du produit a échoué");
      }

      // Appeler le callback de succès
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Une erreur est survenue lors de la modification du produit";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (!product) {
    return null;
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-4">
          Modifier le produit
        </h3>

        {error && (
          <div className="mb-4">
            <Alert variant="error" title="Erreur" message={error} />
          </div>
        )}

        {showWarningAlert && (
          <div
            className={`mb-4 transition-opacity duration-300 ${
              isWarningAlertVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            <Alert variant="warning" title="Attention" message="Tous les champs sont requis" />
          </div>
        )}

        {isLoadingProductDetails && (
          <div className="mb-4 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 dark:border-white/10 dark:bg-dark-900 dark:text-gray-300">
            Chargement des informations complètes du produit...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Grille responsive pour les champs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Libellé */}
            <div className="sm:col-span-2">
              <Label htmlFor="libelle">
                Libellé <span className="text-red-500">*</span>
              </Label>
              <Input
                id="libelle"
                type="text"
                value={libelle}
                onChange={(e) => setLibelle(e.target.value)}
                placeholder="Ex: Sac de pommes de terre"
                disabled={isFormDisabled}
              />
            </div>

            {/* Unité de poids */}
            <div>
              <Label htmlFor="unitePoids">
                Unité de poids <span className="text-red-500">*</span>
              </Label>
              <Select
                options={unitePoidsOptions}
                placeholder="Sélectionner une unité"
                value={unitePoids}
                onChange={(value) => setUnitePoids(value)}
                disabled={isFormDisabled}
                className="cursor-pointer"
              />
            </div>

            {/* Valeur du poids */}
            <div>
              <Label htmlFor="valeurPoids">
                Valeur du poids <span className="text-red-500">*</span>
              </Label>
              <Input
                id="valeurPoids"
                type="number"
                value={valeurPoids}
                onChange={(e) => setValeurPoids(e.target.value)}
                placeholder="Ex: 10"
                min="0"
                step={0.01}
                disabled={isFormDisabled}
              />
            </div>

            {/* Catégorie */}
            <div className="sm:col-span-2">
              <Label htmlFor="categorie">
                Catégorie <span className="text-gray-500 text-xs font-normal">(optionnel si inchangé)</span>
              </Label>
              {isLoadingCategories ? (
                <div className="h-11 w-full rounded-lg border border-gray-300 bg-gray-50 dark:border-gray-700 dark:bg-gray-900 flex items-center justify-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    Chargement des catégories...
                  </span>
                </div>
              ) : (
                <Select
                  options={categorieOptions}
                  placeholder={
                    categorieOptions.length > 0
                      ? "Sélectionner une catégorie (laisser vide pour conserver l'ancienne)"
                      : "Aucune catégorie disponible"
                  }
                  value={categorie}
                  onChange={(value) => setCategorie(value)}
                  disabled={isFormDisabled || isLoadingCategories}
                  className="cursor-pointer"
                />
              )}
            </div>

            {/* Prix d'achat */}
            <div>
              <Label htmlFor="prixAchat">
                Prix d'achat (FCFA) <span className="text-gray-500 text-xs font-normal">(optionnel si inchangé)</span>
              </Label>
              <Input
                id="prixAchat"
                type="number"
                value={prixAchat}
                onChange={(e) => setPrixAchat(e.target.value)}
                placeholder="Ex: 3000 (laisser vide pour conserver l'ancien)"
                min="0"
                step={0.01}
                disabled={isFormDisabled}
              />
            </div>

            {/* Prix de vente normale */}
            <div>
              <Label htmlFor="prixVenteNormale">
                Prix de vente normale (FCFA) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="prixVenteNormale"
                type="number"
                value={prixVenteNormale}
                onChange={(e) => setPrixVenteNormale(e.target.value)}
                placeholder="Ex: 3500"
                min="0"
                step={0.01}
                disabled={isFormDisabled}
              />
            </div>

            {/* Prix de vente réduit */}
            <div>
              <Label htmlFor="prixVenteReduit">
                Prix de vente réduit (FCFA) <span className="text-gray-500 text-xs font-normal">(optionnel si inchangé)</span>
              </Label>
              <Input
                id="prixVenteReduit"
                type="number"
                value={prixVenteReduit}
                onChange={(e) => setPrixVenteReduit(e.target.value)}
                placeholder="Ex: 3300 (laisser vide pour conserver l'ancien)"
                min="0"
                step={0.01}
                disabled={isFormDisabled}
              />
            </div>

            {/* Status */}
            <div>
              <Label htmlFor="status">
                Status <span className="text-red-500">*</span>
              </Label>
              <Select
                options={statusOptions}
                placeholder="Sélectionner un status"
                value={status}
                onChange={(value) => setStatus(value)}
                disabled={isFormDisabled}
                className="cursor-pointer"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <Label htmlFor="description">
                Description <span className="text-red-500">*</span>
              </Label>
              <TextArea
                id="description"
                value={description}
                onChange={(value) => setDescription(value)}
                placeholder="Description du produit"
                rows={4}
                disabled={isFormDisabled}
              />
            </div>

            {/* Gestion des photos */}
            <div className="sm:col-span-2 space-y-5">
              <div>
                <Label>Photos publiées</Label>
                {existingPhotos.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {existingPhotos.map((photo) => (
                      <div
                        key={photo.id}
                        className="relative group overflow-hidden rounded-xl border border-gray-200 dark:border-white/10"
                      >
                        {photo.isPrimary && (
                          <span className="absolute top-2 left-2 z-10 rounded bg-[#04b05d] px-2 py-1 text-xs font-semibold text-white">
                            Principale
                          </span>
                        )}
                        <img
                          src={photo.url}
                          alt="Photo publiée"
                          className="h-40 w-full object-cover"
                        />
                        <div className="absolute inset-0 flex flex-col gap-2 bg-black/60 px-3 py-3 opacity-0 transition-opacity group-hover:opacity-100">
                          {!photo.isPrimary && (
                            <Button
                              type="button"
                              variant="none"
                              className="w-full bg-[#04b05d] hover:bg-[#039a52] text-white text-xs"
                              onClick={() => setExistingPhotoAsPrimary(photo.id)}
                               disabled={photo.isDeleting || isFormDisabled}
                            >
                              Définir comme principale
                            </Button>
                          )}
                          {photo.isPrimary && (
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full text-xs"
                              onClick={() => unsetExistingPhotoPrimary(photo.id)}
                               disabled={photo.isDeleting || isFormDisabled}
                            >
                              Rendre secondaire
                            </Button>
                          )}
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full border-red-500 text-red-500 text-xs hover:bg-red-500/10"
                            onClick={() => deleteExistingPhoto(photo.id)}
                             disabled={photo.isDeleting || isFormDisabled}
                          >
                            {photo.isDeleting ? "Suppression..." : "Supprimer"}
                          </Button>
                        </div>
                        {photo.isDeleting && (
                          <div className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-medium text-gray-700 dark:bg-black/60 dark:text-gray-100">
                            Suppression...
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                    Aucune photo n'est actuellement publiée pour ce produit.
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="photos">Ajouter de nouvelles photos</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive
                      ? "border-[#04b05d] bg-[#04b05d]/10"
                      : "border-gray-300 dark:border-white/10 hover:border-[#04b05d]/50"
                  }`}
                >
                  <input {...getInputProps()} id="photos" disabled={isFormDisabled} />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive
                      ? "Déposez les images ici..."
                      : "Glissez-déposez des images ici, ou cliquez pour sélectionner"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPEG, JPG, WEBP (max 10 Mo)
                  </p>
                </div>

                {photos.length > 0 && (
                  <div className="mt-4">
                    <p className="mb-2 text-sm text-gray-600 dark:text-gray-400">
                      {photos.length} image(s) ajoutée(s) — La première sera utilisée comme image principale si aucune photo publiée n'est définie comme principale.
                    </p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                      {photos.map((photo, index) => (
                        <div key={`${photo.name}-${index}`} className="group relative">
                          {index === 0 && !existingPhotos.some((p) => p.isPrimary) && (
                            <span className="absolute top-2 left-2 z-10 rounded bg-[#04b05d] px-2 py-1 text-xs font-semibold text-white">
                              Principale
                            </span>
                          )}
                          <img
                            src={URL.createObjectURL(photo)}
                            alt={`Aperçu ${index + 1}`}
                            className={`h-32 w-full rounded-lg object-cover border ${
                              index === 0 && !existingPhotos.some((p) => p.isPrimary)
                                ? "border-[#04b05d]"
                                : "border-gray-200 dark:border-white/10"
                            }`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                            {index !== 0 && (
                              <button
                                type="button"
                                onClick={() => setNewPhotoAsPrimary(index)}
                                className="rounded bg-[#04b05d] px-2 py-1 text-xs text-white hover:bg-[#039a52]"
                                disabled={isFormDisabled}
                              >
                                Mettre en premier
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removePhoto(index)}
                              className="rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                              disabled={isFormDisabled}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-white/10">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isFormDisabled}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="none"
              className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 disabled:opacity-50"
              disabled={isFormDisabled}
            >
              {isLoading ? "Modification..." : "Modifier le produit"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

