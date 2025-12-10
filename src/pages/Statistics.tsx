/**
 * Page Statistique - Vue complète des statistiques
 * 
 * Cette page affiche toutes les statistiques basées sur les données de l'API
 * avec une organisation professionnelle et intuitive
 */

import { useEffect, useState } from "react";
import PageBreadcrumb from "../components/common/PageBreadCrumb";
import PageMeta from "../components/common/PageMeta";
import reportService, { ReportsData } from "../services/api/reportService";
import franchiseService, { Boutique } from "../services/api/franchiseService";
import productService, { Product } from "../services/api/productService";
import clientService, { Client } from "../services/api/clientService";
import livreurService, { Livreur } from "../services/api/livreurService";
import { useNavigate } from "react-router";
import { getStatusLabel, getStatusColor } from "../utils/productUtils";

interface AccordionItemProps {
  title: string;
  count: number;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionItem({ title, count, icon, isOpen, onToggle, children }: AccordionItemProps) {
  return (
    <div className="border border-[#04b05d]/20 dark:border-[#04b05d]/30 rounded-lg overflow-hidden bg-[#04b05d]/3 dark:bg-[#04b05d]/10 transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#04b05d]/10 dark:hover:bg-[#04b05d]/15 transition-colors duration-200"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#04b05d]/20 dark:bg-[#04b05d]/30 flex items-center justify-center">
            {icon}
          </div>
          <div className="text-left">
            <h3 className="text-base font-semibold text-gray-800 dark:text-white/90">{title}</h3>
            <p className="text-xs font-medium text-neutral-500 dark:text-white">{count} {count > 1 ? "éléments" : "élément"}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-[#04b05d] dark:text-[#04b05d] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-[#04b05d]/20 dark:border-[#04b05d]/30 bg-white dark:bg-white/[0.02]">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Statistics() {
  const navigate = useNavigate();
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // États pour les accordéons
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  // États pour les listes
  const [boutiques, setBoutiques] = useState<Boutique[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);

  // États de chargement pour chaque liste
  const [loadingBoutiques, setLoadingBoutiques] = useState<boolean>(false);
  const [loadingProducts, setLoadingProducts] = useState<boolean>(false);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);
  const [loadingLivreurs, setLoadingLivreurs] = useState<boolean>(false);

  useEffect(() => {
    const loadReports = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await reportService.getReports();
        setReportsData(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Erreur lors du chargement des statistiques";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadReports();
  }, []);

  // Fonction pour charger toutes les boutiques
  const loadBoutiques = async () => {
    if (boutiques.length > 0) return; // Déjà chargées
    try {
      setLoadingBoutiques(true);
      const allBoutiques = await franchiseService.getAllBoutiques();
      setBoutiques(allBoutiques);
    } catch (err) {
      console.error("Erreur lors du chargement des boutiques:", err);
    } finally {
      setLoadingBoutiques(false);
    }
  };

  // Fonction pour charger tous les produits (toutes les pages)
  const loadProducts = async () => {
    if (products.length > 0) return; // Déjà chargés
    try {
      setLoadingProducts(true);
      const allProducts: Product[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await productService.getProducts(currentPage);
        allProducts.push(...response.data);

        if (response.meta.current_page >= response.meta.last_page) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      }

      setProducts(allProducts);
    } catch (err) {
      console.error("Erreur lors du chargement des produits:", err);
    } finally {
      setLoadingProducts(false);
    }
  };

  // Fonction pour charger tous les clients (toutes les pages)
  const loadClients = async () => {
    if (clients.length > 0) return; // Déjà chargés
    try {
      setLoadingClients(true);
      const allClients: Client[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await clientService.getClients(currentPage);
        allClients.push(...response.data);

        if (response.meta.current_page >= response.meta.last_page) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      }

      setClients(allClients);
    } catch (err) {
      console.error("Erreur lors du chargement des clients:", err);
    } finally {
      setLoadingClients(false);
    }
  };

  // Fonction pour charger tous les livreurs (toutes les pages)
  const loadLivreurs = async () => {
    if (livreurs.length > 0) return; // Déjà chargés
    try {
      setLoadingLivreurs(true);
      const allLivreurs: Livreur[] = [];
      let currentPage = 1;
      let hasMorePages = true;

      while (hasMorePages) {
        const response = await livreurService.getLivreurs(currentPage);
        allLivreurs.push(...response.data);

        if (response.meta.current_page >= response.meta.last_page) {
          hasMorePages = false;
        } else {
          currentPage++;
        }
      }

      setLivreurs(allLivreurs);
    } catch (err) {
      console.error("Erreur lors du chargement des livreurs:", err);
    } finally {
      setLoadingLivreurs(false);
    }
  };

  // Gérer l'ouverture/fermeture des accordéons
  const handleToggleAccordion = (accordionId: string) => {
    if (openAccordion === accordionId) {
      setOpenAccordion(null);
    } else {
      setOpenAccordion(accordionId);
      // Charger les données si nécessaire
      if (accordionId === "boutiques") {
        loadBoutiques();
      } else if (accordionId === "produits") {
        loadProducts();
      } else if (accordionId === "clients") {
        loadClients();
      } else if (accordionId === "livreurs") {
        loadLivreurs();
      }
    }
  };

  // Fonction pour formater les montants
  const formatAmount = (amount: number): string => {
    return amount.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  // Fonction pour calculer le pourcentage de variation
  const calculatePercentageChange = (current: number, previous: number): { value: number; isPositive: boolean } => {
    if (previous === 0) {
      return { value: current > 0 ? 100 : 0, isPositive: current > 0 };
    }
    const change = ((current - previous) / previous) * 100;
    return { value: Math.round(change * 100) / 100, isPositive: change >= 0 };
  };

  // Fonction pour formater les nombres
  const formatNumber = (num: number): string => {
    return num.toLocaleString("fr-FR");
  };

  if (isLoading) {
    return (
      <>
        <PageMeta
          title="Statistique | Proxy Market"
          description="Statistiques et analyses de l'application"
        />
        <PageBreadcrumb
          pageTitle="Statistique"
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
          items={[
            { label: "Dashboard", href: "/" },
          ]}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#04b05d] border-r-transparent"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Chargement des statistiques...</p>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <PageMeta
          title="Statistique | Proxy Market"
          description="Statistiques et analyses de l'application"
        />
        <PageBreadcrumb
          pageTitle="Statistique"
          titleClassName="text-[#04b05d] dark:text-[#04b05d]"
          items={[
            { label: "Dashboard", href: "/" },
          ]}
        />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4 px-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Erreur</h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
          </div>
        </div>
      </>
    );
  }

  if (!reportsData) {
    return null;
  }

  // Calculer les variations
  const todayVsYesterday = calculatePercentageChange(
    reportsData.commande_to_day_soustotal,
    reportsData.commandehier_soustotal
  );
  const weekVsLastWeek = calculatePercentageChange(
    reportsData.commandesemaine_soustotal,
    reportsData.commandeSemainePasse_soustotal
  );
  const monthVsLastMonth = calculatePercentageChange(
    reportsData.commandemois_soustotal,
    reportsData.commandeMoisPasse_soustotal
  );
  const yearVsLastYear = calculatePercentageChange(
    reportsData.commandeannee_soustotal,
    reportsData.commandeAnneePasse_soustotal
  );

  return (
    <>
      <PageMeta
        title="Statistique | Proxy Market"
        description="Statistiques et analyses de l'application"
      />
      <PageBreadcrumb
        pageTitle="Statistique"
        titleClassName="text-[#04b05d] dark:text-[#04b05d]"
        items={[
          { label: "Dashboard", href: "/" },
        ]}
      />

      <div className="space-y-6">
        {/* Section 1: Vue d'ensemble des commandes */}
        <div className="rounded-2xl border border-neutral-300 bg-white dark:border-neutral-400 dark:bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Vue d'ensemble des commandes</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Comparaison des performances par période</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/50">
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Période
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Nombre de commandes
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Montant total (FCFA)
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Évolution
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-700">
                {/* Aujourd'hui */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#04b05d] mr-3"></div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">Aujourd'hui</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatNumber(reportsData.commande_to_day)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatAmount(reportsData.commande_to_day_soustotal)} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {todayVsYesterday.value !== 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        todayVsYesterday.isPositive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {todayVsYesterday.isPositive ? "↑" : "↓"} {Math.abs(todayVsYesterday.value).toFixed(1)}%
                      </span>
                    )}
                    {todayVsYesterday.value === 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>

                {/* Hier */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">Hier</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatNumber(reportsData.commandehier)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatAmount(reportsData.commandehier_soustotal)} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Référence</span>
                  </td>
                </tr>

                {/* Cette semaine */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">Cette semaine</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatNumber(reportsData.commandesemaine)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatAmount(reportsData.commandesemaine_soustotal)} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {weekVsLastWeek.value !== 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        weekVsLastWeek.isPositive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {weekVsLastWeek.isPositive ? "↑" : "↓"} {Math.abs(weekVsLastWeek.value).toFixed(1)}%
                      </span>
                    )}
                    {weekVsLastWeek.value === 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>

                {/* Semaine passée */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">Semaine passée</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatNumber(reportsData.commandeSemainePasse)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatAmount(reportsData.commandeSemainePasse_soustotal)} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Référence</span>
                  </td>
                </tr>

                {/* Ce mois */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors bg-[#04b05d]/5 dark:bg-[#04b05d]/10">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-[#04b05d] mr-3"></div>
                      <span className="text-sm font-semibold text-gray-800 dark:text-white/90">Ce mois</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {formatNumber(reportsData.commandemois)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm font-semibold text-gray-800 dark:text-white/90">
                      {formatAmount(reportsData.commandemois_soustotal)} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {monthVsLastMonth.value !== 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        monthVsLastMonth.isPositive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {monthVsLastMonth.isPositive ? "↑" : "↓"} {Math.abs(monthVsLastMonth.value).toFixed(1)}%
                      </span>
                    )}
                    {monthVsLastMonth.value === 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>

                {/* Mois passé */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-teal-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">Mois passé</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatNumber(reportsData.commandeMoisPasse)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatAmount(reportsData.commandeMoisPasse_soustotal)} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Référence</span>
                  </td>
                </tr>

                {/* Cette année */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-pink-500 mr-3"></div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">Cette année</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatNumber(reportsData.commandeannee)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatAmount(reportsData.commandeannee_soustotal)} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    {yearVsLastYear.value !== 0 && (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        yearVsLastYear.isPositive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                      }`}>
                        {yearVsLastYear.isPositive ? "↑" : "↓"} {Math.abs(yearVsLastYear.value).toFixed(1)}%
                      </span>
                    )}
                    {yearVsLastYear.value === 0 && (
                      <span className="text-xs text-gray-400 dark:text-gray-500">-</span>
                    )}
                  </td>
                </tr>

                {/* Année passée */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-2 h-2 rounded-full bg-gray-400 mr-3"></div>
                      <span className="text-sm font-medium text-gray-800 dark:text-white/90">Année passée</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatNumber(reportsData.commandeAnneePasse)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className="text-sm text-gray-800 dark:text-white/90 font-medium">
                      {formatAmount(reportsData.commandeAnneePasse_soustotal)} FCFA
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className="text-xs text-gray-400 dark:text-gray-500">Référence</span>
                  </td>
                </tr>
              </tbody>
            </table>
            </div>
          </div>

        {/* Section 2: Ressources de la plateforme avec accordéons */}
        <div className="rounded-2xl border border-neutral-300 bg-white dark:border-neutral-400 dark:bg-white/[0.03] overflow-hidden">
          <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">Ressources de la plateforme</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cliquez sur une ressource pour voir la liste détaillée</p>
          </div>
          
          <div className="p-6 space-y-4">
            {/* Accordéon Boutiques */}
            <AccordionItem
              title="Boutiques"
              count={reportsData.all_boutique}
              icon={
                <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
              isOpen={openAccordion === "boutiques"}
              onToggle={() => handleToggleAccordion("boutiques")}
            >
              <div className="p-4">
                {loadingBoutiques ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#04b05d] border-r-transparent"></div>
                  </div>
                ) : boutiques.length > 0 ? (
                  <div className="space-y-2">
                    {boutiques.map((boutique) => (
                      <div
                        key={boutique.id}
                        onClick={() => navigate(`/boutiques/${boutique.id}`)}
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-[#04b05d] hover:bg-[#04b05d]/5 dark:hover:bg-[#04b05d]/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#04b05d]/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{boutique.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{boutique.adresse || "Aucune adresse"}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          boutique.status === 1
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          {boutique.status === 1 ? "Active" : "Inactive"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucune boutique disponible</p>
                )}
              </div>
            </AccordionItem>

            {/* Accordéon Produits */}
            <AccordionItem
              title="Produits"
              count={reportsData.all_produit}
              icon={
                <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              }
              isOpen={openAccordion === "produits"}
              onToggle={() => handleToggleAccordion("produits")}
            >
              <div className="p-4">
                {loadingProducts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#04b05d] border-r-transparent"></div>
                  </div>
                ) : products.length > 0 ? (
                  <div className="space-y-2">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => navigate(`/products/${product.id}`)}
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-[#04b05d] hover:bg-[#04b05d]/5 dark:hover:bg-[#04b05d]/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {product.photo_prymary ? (
                            <img
                              src={product.photo_prymary}
                              alt={product.libelle}
                              className="w-10 h-10 rounded-lg object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/images/user/User.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-[#04b05d]/10 flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                              </svg>
                            </div>
                          )}
          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">{product.libelle}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {product.prix_vente_normale 
                                ? `${typeof product.prix_vente_normale === 'string' ? product.prix_vente_normale : product.prix_vente_normale.toLocaleString('fr-FR')} FCFA` 
                                : "Prix non défini"}
            </p>
          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          getStatusColor(product.status) === "success"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border border-green-300 dark:border-green-600"
                            : "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border border-red-300 dark:border-red-600"
                        }`}>
                          {getStatusLabel(product)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucun produit disponible</p>
                )}
              </div>
            </AccordionItem>

            {/* Accordéon Clients */}
            <AccordionItem
              title="Clients"
              count={reportsData.all_client}
              icon={
                <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
              isOpen={openAccordion === "clients"}
              onToggle={() => handleToggleAccordion("clients")}
            >
              <div className="p-4">
                {loadingClients ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#04b05d] border-r-transparent"></div>
                  </div>
                ) : clients.length > 0 ? (
                  <div className="space-y-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        onClick={() => navigate(`/users-table`)}
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-[#04b05d] hover:bg-[#04b05d]/5 dark:hover:bg-[#04b05d]/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {client.photo ? (
                            <img
                              src={client.photo}
                              alt={`${client.nom} ${client.prenoms}`}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/images/user/User.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#04b05d]/10 flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {client.nom} {client.prenoms}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{client.contact1 || "Aucun contact"}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          client.status === 1
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          {client.status === 1 ? "Actif" : "Inactif"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucun client disponible</p>
                )}
              </div>
            </AccordionItem>

            {/* Accordéon Livreurs */}
            <AccordionItem
              title="Livreurs"
              count={reportsData.all_livreur}
              icon={
                <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              }
              isOpen={openAccordion === "livreurs"}
              onToggle={() => handleToggleAccordion("livreurs")}
            >
              <div className="p-4">
                {loadingLivreurs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#04b05d] border-r-transparent"></div>
                  </div>
                ) : livreurs.length > 0 ? (
                  <div className="space-y-2">
                    {livreurs.map((livreur) => (
                      <div
                        key={livreur.id}
                        onClick={() => navigate(`/livreurs/${livreur.id}`)}
                        className="flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-[#04b05d] hover:bg-[#04b05d]/5 dark:hover:bg-[#04b05d]/10 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {livreur.photo ? (
                            <img
                              src={livreur.photo}
                              alt={`${livreur.nom} ${livreur.prenoms}`}
                              className="w-10 h-10 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/images/user/User.jpg";
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#04b05d]/10 flex items-center justify-center">
                              <svg className="w-5 h-5 text-[#04b05d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                              {livreur.nom} {livreur.prenoms}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{livreur.contact1 || "Aucun contact"}</p>
                          </div>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          livreur.status === 1
                            ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        }`}>
                          {livreur.status === 1 ? "Actif" : "Inactif"}
              </span>
            </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucun livreur disponible</p>
                )}
              </div>
            </AccordionItem>
          </div>
        </div>
      </div>
    </>
  );
}
