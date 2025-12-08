/**
 * Page AddBanner - Creer une banniere
 *
 * Cette page permet de creer une nouvelle banniere sur Proxy Market.
 * Formulaire avec les champs requis :
 * - categorie (ID de la categorie de produit)
 * - titre1
 * - btn_action
 * - ordre
 * - photo
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { useDropzone } from "react-dropzone";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import ComponentCard from "../../components/common/ComponentCard";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import Select from "../../components/form/Select";
import Button from "../../components/ui/button/Button";
import Alert from "../../components/ui/alert/Alert";
import bannerService, { Category } from "../../services/api/bannerService";

export default function AddBanner() {
  const navigate = useNavigate();
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Etat du formulaire
  const [categorie, setCategorie] = useState("");
  const [titre1, setTitre1] = useState("");
  const [btnAction, setBtnAction] = useState("");
  const [ordre, setOrdre] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  // Etat pour les alertes
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isSuccessAlertVisible, setIsSuccessAlertVisible] = useState(false);
  const [error, setError] = useState("");

  // Etat pour le chargement
  const [isLoading, setIsLoading] = useState(false);

  // Etat pour les categories
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Configuration du dropzone pour l'image
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setPhoto(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [],
      "image/jpeg": [],
      "image/jpg": [],
      "image/webp": [],
    },
    multiple: false,
    maxFiles: 1,
  });

  // Nettoyer le timer de redirection lors du demontage du composant
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current);
      }
    };
  }, []);

  // Charger la liste des categories au montage du composant
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const categoriesList = await bannerService.getCategories();
        setCategories(categoriesList);
      } catch (err: unknown) {
        // En cas d'erreur, on continue sans categories
        setCategories([]);
        if (import.meta.env.DEV) {
          console.error("[AddBanner] Erreur chargement categories");
        }
      } finally {
        setIsLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Gere l'affichage et la disparition de l'alerte de succes avec transition
  useEffect(() => {
    if (showSuccessAlert) {
      // Afficher l'alerte avec un leger delai pour permettre la transition
      const showTimer = setTimeout(() => {
        setIsSuccessAlertVisible(true);
      }, 50);

      // Programmer la disparition de l'alerte apres 4 secondes
      const hideTimer = setTimeout(() => {
        setIsSuccessAlertVisible(false);
        // Attendre la fin de la transition avant de masquer completement
        setTimeout(() => {
          setShowSuccessAlert(false);
        }, 300);
      }, 4000);

      return () => {
        clearTimeout(showTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [showSuccessAlert]);

  /**
   * Valide le formulaire avant soumission
   */
  const validateForm = (): boolean => {
    if (!categorie.trim()) {
      setError("Veuillez selectionner une categorie.");
      return false;
    }

    if (!titre1.trim()) {
      setError("Veuillez saisir un titre pour la banniere.");
      return false;
    }

    if (!btnAction.trim()) {
      setError("Veuillez saisir un texte pour le bouton d'action.");
      return false;
    }

    if (!ordre.trim()) {
      setError("Veuillez saisir un ordre d'affichage.");
      return false;
    }

    const ordreNumber = parseInt(ordre, 10);
    if (isNaN(ordreNumber) || ordreNumber < 1) {
      setError("L'ordre doit etre un nombre positif.");
      return false;
    }

    if (!photo) {
      setError("Veuillez ajouter une image pour la banniere.");
      return false;
    }

    return true;
  };

  /**
   * Reinitialise le formulaire
   */
  const resetForm = () => {
    setCategorie("");
    setTitre1("");
    setBtnAction("");
    setOrdre("");
    setPhoto(null);
    setError("");
  };

  /**
   * Supprime la photo selectionnee
   */
  const removePhoto = () => {
    setPhoto(null);
  };

  /**
   * Gere la soumission du formulaire
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    if (!photo) {
      setError("Veuillez ajouter une image pour la banniere.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await bannerService.createBanner({
        categorie,
        titre1,
        btn_action: btnAction,
        ordre,
        photo,
      });

      // Si la reponse contient une banniere, c'est un succes
      if (response.banner && (response.retour === 1 || response.retour === undefined || response.cls === "success")) {
        // Succes : afficher l'alerte et reinitialiser le formulaire
        setShowSuccessAlert(true);
        resetForm();

        // Rediriger vers la liste des banniere apres 3 secondes
        redirectTimerRef.current = setTimeout(() => {
          navigate("/banners");
        }, 3000);
      } else {
        setError(response.msg || "Erreur lors de la creation de la banniere.");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erreur lors de la creation de la banniere";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Options pour le select de categories
   */
  const categoriesOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.libelle,
  }));

  return (
    <>
      <PageMeta
        title="Creer une banniere | Proxy Market"
        description="Creer une nouvelle banniere sur Proxy Market"
      />
      <PageBreadcrumb
        pageTitle="Creer une banniere"
        items={[
          { label: "Administration", href: "/" },
        ]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
      />

      <div className="space-y-6">
        {/* Alerte d'erreur */}
        {error && (
          <Alert variant="error" title="Erreur" message={error} />
        )}

        <form onSubmit={handleSubmit}>
          <ComponentCard title="Informations de la banniere">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Categorie */}
              <div>
                <Label htmlFor="categorie">
                  Categorie <span className="text-red-500">*</span>
                </Label>
                <Select
                  options={categoriesOptions}
                  placeholder={isLoadingCategories ? "Chargement..." : "Selectionner une categorie"}
                  onChange={(value) => setCategorie(value)}
                  defaultValue={categorie}
                  className="mt-1"
                />
              </div>

              {/* Titre */}
              <div>
                <Label htmlFor="titre1">
                  Titre <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="titre1"
                  type="text"
                  value={titre1}
                  onChange={(e) => setTitre1(e.target.value)}
                  placeholder="Ex: Offre speciale de la semaine"
                  className="mt-1"
                />
              </div>

              {/* Bouton d'action */}
              <div>
                <Label htmlFor="btn_action">
                  Texte du bouton <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="btn_action"
                  type="text"
                  value={btnAction}
                  onChange={(e) => setBtnAction(e.target.value)}
                  placeholder="Ex: Commander maintenant"
                  className="mt-1"
                />
              </div>

              {/* Ordre */}
              <div>
                <Label htmlFor="ordre">
                  Ordre d'affichage <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="ordre"
                  type="number"
                  value={ordre}
                  onChange={(e) => setOrdre(e.target.value)}
                  placeholder="Ex: 1"
                  min="1"
                  className="mt-1"
                />
              </div>
            </div>

            {/* Zone d'upload de photo */}
            <div className="mt-6">
              <Label>
                Image de la banniere <span className="text-red-500">*</span>
              </Label>
              <div
                {...getRootProps()}
                className={`mt-2 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-colors ${
                  isDragActive
                    ? "border-[#04b05d] bg-[#04b05d]/5"
                    : "border-gray-300 hover:border-[#04b05d] dark:border-gray-600 dark:hover:border-[#04b05d]"
                }`}
              >
                <input {...getInputProps()} />
                <div className="text-center">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                    aria-hidden="true"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {isDragActive
                      ? "Deposez l'image ici..."
                      : "Glissez-deposez une image ou cliquez pour selectionner"}
                  </p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    PNG, JPG, JPEG ou WEBP
                  </p>
                </div>
              </div>

              {/* Apercu de la photo selectionnee */}
              {photo && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    Apercu de l'image :
                  </p>
                  <div className="relative inline-block">
                    <img
                      src={URL.createObjectURL(photo)}
                      alt="Apercu banniere"
                      className="h-32 w-auto rounded-lg border border-gray-200 object-cover dark:border-gray-700"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600"
                      title="Supprimer l'image"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {photo.name}
                  </p>
                </div>
              )}
            </div>

            {/* Boutons d'action */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="none"
                className="bg-[#04b05d] hover:bg-[#039a52] text-white shadow-theme-xs disabled:bg-[#04b05d]/70 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Creation en cours...
                  </span>
                ) : (
                  "Creer la banniere"
                )}
              </Button>
            </div>
          </ComponentCard>
        </form>

        {/* Alerte de succes en bas du formulaire */}
        {showSuccessAlert && (
          <div
            className={`transition-all duration-300 ease-in-out ${
              isSuccessAlertVisible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
            }`}
          >
            <Alert
              variant="success"
              title="Banniere creee avec succes"
              message="La banniere a ete creee. Vous serez redirige vers la liste des bannieres."
            />
          </div>
        )}
      </div>
    </>
  );
}

