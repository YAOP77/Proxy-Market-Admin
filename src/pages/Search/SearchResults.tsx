/**
 * Page SearchResults - Résultats de recherche globale
 * 
 * Affiche les résultats de recherche groupés par type (produits, boutiques, franchisés, admins)
 * et permet de rediriger vers les vues spécifiques
 */

import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Alert from "../../components/ui/alert/Alert";
import searchService, { GroupedSearchResults, SearchResult } from "../../services/api/searchService";

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get("q") || "";

  const [results, setResults] = useState<GroupedSearchResults | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const performSearch = async () => {
      if (!query || query.trim().length === 0) {
        setResults({
          products: [],
          boutiques: [],
          franchises: [],
          admins: [],
          total: 0,
        });
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError("");
        const searchResults = await searchService.globalSearch(query);
        setResults(searchResults);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors de la recherche";
        setError(errorMessage);
        setResults({
          products: [],
          boutiques: [],
          franchises: [],
          admins: [],
          total: 0,
        });
      } finally {
        setIsLoading(false);
      }
    };

    performSearch();
  }, [query]);

  /**
   * Gère le clic sur un résultat de recherche
   * Redirige vers la vue spécifique correspondante
   */
  const handleResultClick = (result: SearchResult) => {
    navigate(result.url);
  };

  /**
   * Affiche un groupe de résultats
   */
  const renderResultGroup = (title: string, results: SearchResult[]) => {
    if (results.length === 0) {
      return null;
    }

    return (
      <div className="mb-8">
        <h3 className="mb-4 flex items-center gap-2 text-2xl font-semibold">
          <span className="text-gray-600 dark:text-gray-400">{title}</span>
          <span className="text-xl font-normal text-[#04b05d] dark:text-[#04b05d]">({results.length})</span>
        </h3>
        <div className="space-y-2">
          {results.map((result) => (
            <button
              key={`${result.type}-${result.id}`}
              onClick={() => handleResultClick(result)}
              className="w-full rounded-lg border border-gray-200 bg-white p-4 text-left transition-all hover:border-[#04b05d] hover:bg-gray-50 dark:border-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.05]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="mb-1 font-semibold text-gray-900 dark:text-white/90">{result.title}</h4>
                  {result.subtitle && (
                    <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">{result.subtitle}</p>
                  )}
                  {result.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-500 line-clamp-2">{result.description}</p>
                  )}
                </div>
                <svg
                  className="h-5 w-5 flex-shrink-0 text-gray-400 dark:text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <PageMeta title={`Recherche: ${query} | Proxy Market`} description={`Résultats de recherche pour "${query}"`} />
      <PageBreadcrumb
        pageTitle={`Recherche: "${query}"`}
        items={[{ label: "Recherche", href: "/search" }]}
        titleClassName="text-[#04b05d] dark:text-[#04b05d] text-4xl font-bold"
      />

      <div className="space-y-6">
        {error && <Alert variant="error" title="Erreur" message={error} />}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-[#04b05d] border-t-transparent" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Recherche en cours...</p>
            </div>
          </div>
        ) : results && results.total > 0 ? (
          <>
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {results.total} résultat{results.total > 1 ? "s" : ""} trouvé{results.total > 1 ? "s" : ""} pour "
                {query}"
              </p>
            </div>

            {renderResultGroup("Produits", results.products)}
            {renderResultGroup("Boutiques", results.boutiques)}
            {renderResultGroup("Franchisés", results.franchises)}
            {renderResultGroup("Administrateurs", results.admins)}
          </>
        ) : query ? (
          <div className="flex flex-col items-center justify-center py-12">
            <img
              src="/images/oups/File searching-bro.png"
              alt="Aucun résultat"
              className="w-80 h-80 object-contain"
            />
            <p className="mt-4 text-center text-gray-500 dark:text-gray-400">
              Aucun résultat trouvé pour "{query}"
            </p>
            <p className="mt-2 text-center text-sm text-gray-400 dark:text-gray-500">
              Essayez avec d'autres mots-clés
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-gray-500 dark:text-gray-400">Entrez un terme de recherche</p>
          </div>
        )}
      </div>
    </>
  );
}

