import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab, { ChartPeriod } from "../common/ChartTab";
import { useEffect, useState, useMemo } from "react";
import reportService, { ReportsData } from "../../services/api/reportService";

export default function StatisticsChart() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>("monthly");

  useEffect(() => {
    const loadReports = async () => {
      try {
        const data = await reportService.getReports();
        setReportsData(data);
      } catch (error) {
        // En cas d'erreur, on garde les données par défaut
        setReportsData(null);
      }
    };

    loadReports();
  }, []);

  /**
   * Calcule les données mensuelles en utilisant uniquement les valeurs réelles de l'API
   * - Ventes : nombre de commandes (commandemois, commandeMoisPasse)
   * - Revenus : montant total (commandemois_soustotal, commandeMoisPasse_soustotal)
   */
  const getMonthlyData = useMemo((): { ventes: number[]; revenus: number[] } => {
    if (!reportsData) {
      return {
        ventes: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        revenus: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
    }

    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0-11 (janvier = 0)

    // Créer des tableaux de 12 mois initialisés à 0
    const ventesData = new Array(12).fill(0);
    const revenusData = new Array(12).fill(0);

    // Utiliser les valeurs réelles de l'API
    // Ventes = nombre de commandes
    const currentMonthVentes = reportsData.commandemois || 0;
    const lastMonthVentes = reportsData.commandeMoisPasse || 0;
    
    // Revenus = montant total (soustotal)
    const currentMonthRevenus = reportsData.commandemois_soustotal || 0;
    const lastMonthRevenus = reportsData.commandeMoisPasse_soustotal || 0;

    // Mois actuel (mois en cours) - Valeurs réelles
    if (currentMonthIndex < 12) {
      ventesData[currentMonthIndex] = currentMonthVentes;
      revenusData[currentMonthIndex] = currentMonthRevenus;
    }

    // Mois passé (mois précédent) - Valeurs réelles
    if (currentMonthIndex > 0) {
      ventesData[currentMonthIndex - 1] = lastMonthVentes;
      revenusData[currentMonthIndex - 1] = lastMonthRevenus;
    } else {
      // Si on est en janvier (index 0), le mois passé est décembre (index 11)
      ventesData[11] = lastMonthVentes;
      revenusData[11] = lastMonthRevenus;
    }

    // Les autres mois restent à 0 car nous n'avons pas de données réelles pour eux

    return { ventes: ventesData, revenus: revenusData };
  }, [reportsData]);

  /**
   * Calcule les données trimestrielles en regroupant les mois par trimestre
   * Q1: Jan-Mar, Q2: Avr-Juin, Q3: Juil-Sept, Q4: Oct-Déc
   */
  const getQuarterlyData = useMemo((): { ventes: number[]; revenus: number[] } => {
    if (!reportsData) {
      return {
        ventes: [0, 0, 0, 0],
        revenus: [0, 0, 0, 0],
      };
    }

    const monthlyData = getMonthlyData;
    const quarterlyVentes = [0, 0, 0, 0];
    const quarterlyRevenus = [0, 0, 0, 0];

    // Q1: Janvier (0), Février (1), Mars (2)
    quarterlyVentes[0] = monthlyData.ventes[0] + monthlyData.ventes[1] + monthlyData.ventes[2];
    quarterlyRevenus[0] = monthlyData.revenus[0] + monthlyData.revenus[1] + monthlyData.revenus[2];

    // Q2: Avril (3), Mai (4), Juin (5)
    quarterlyVentes[1] = monthlyData.ventes[3] + monthlyData.ventes[4] + monthlyData.ventes[5];
    quarterlyRevenus[1] = monthlyData.revenus[3] + monthlyData.revenus[4] + monthlyData.revenus[5];

    // Q3: Juillet (6), Août (7), Septembre (8)
    quarterlyVentes[2] = monthlyData.ventes[6] + monthlyData.ventes[7] + monthlyData.ventes[8];
    quarterlyRevenus[2] = monthlyData.revenus[6] + monthlyData.revenus[7] + monthlyData.revenus[8];

    // Q4: Octobre (9), Novembre (10), Décembre (11)
    quarterlyVentes[3] = monthlyData.ventes[9] + monthlyData.ventes[10] + monthlyData.ventes[11];
    quarterlyRevenus[3] = monthlyData.revenus[9] + monthlyData.revenus[10] + monthlyData.revenus[11];

    return { ventes: quarterlyVentes, revenus: quarterlyRevenus };
  }, [getMonthlyData]);

  /**
   * Calcule les données annuelles en utilisant les valeurs réelles de l'API
   * - Ventes : nombre de commandes (commandeannee, commandeAnneePasse)
   * - Revenus : montant total (commandeannee_soustotal, commandeAnneePasse_soustotal)
   */
  const getAnnuallyData = useMemo((): { ventes: number[]; revenus: number[] } => {
    if (!reportsData) {
      return {
        ventes: [0, 0],
        revenus: [0, 0],
      };
    }

    // Ventes = nombre de commandes
    const currentYearVentes = reportsData.commandeannee || 0;
    const lastYearVentes = reportsData.commandeAnneePasse || 0;
    
    // Revenus = montant total (soustotal)
    const currentYearRevenus = reportsData.commandeannee_soustotal || 0;
    const lastYearRevenus = reportsData.commandeAnneePasse_soustotal || 0;

    return {
      ventes: [lastYearVentes, currentYearVentes],
      revenus: [lastYearRevenus, currentYearRevenus],
    };
  }, [reportsData]);

  // Sélectionner les données selon la période choisie
  const chartData = useMemo(() => {
    switch (selectedPeriod) {
      case "quarterly":
        return getQuarterlyData;
      case "annually":
        return getAnnuallyData;
      case "monthly":
      default:
        return getMonthlyData;
    }
  }, [selectedPeriod, getMonthlyData, getQuarterlyData, getAnnuallyData]);

  // Configurer les catégories selon la période
  const categories = useMemo(() => {
    switch (selectedPeriod) {
      case "quarterly":
        return ["Q1", "Q2", "Q3", "Q4"];
      case "annually":
        const currentYear = new Date().getFullYear();
        return [`${currentYear - 1}`, `${currentYear}`];
      case "monthly":
      default:
        return ["Janv", "Fév", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];
    }
  }, [selectedPeriod]);

  // Mémoriser les options pour éviter les re-renders inutiles
  const options: ApexOptions = useMemo(
    () => ({
      legend: {
        show: false,
        position: "top",
        horizontalAlign: "left",
      },
      colors: ["#04b05d", "rgba(4, 176, 93, 0.5)"],
      chart: {
        fontFamily: "Outfit, sans-serif",
        height: 310,
        type: "line",
        toolbar: {
          show: false,
        },
      },
      stroke: {
        curve: "straight",
        width: [2, 2],
      },
      fill: {
        type: "gradient",
        gradient: {
          opacityFrom: 0.55,
          opacityTo: 0,
        },
      },
      markers: {
        size: 0,
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6,
        },
      },
      grid: {
        xaxis: {
          lines: {
            show: false,
          },
        },
        yaxis: {
          lines: {
            show: true,
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      tooltip: {
        enabled: true,
        y: {
          formatter: (val: number) => {
            if (val === 0) return "0 FCFA";
            return `${val.toLocaleString("fr-FR")} FCFA`;
          },
        },
      },
      xaxis: {
        type: "category",
        categories: categories,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        tooltip: {
          enabled: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            fontSize: "12px",
            colors: ["#6B7280"],
          },
        },
        title: {
          text: "",
          style: {
            fontSize: "0px",
          },
        },
      },
    }),
    [categories]
  );

  const series = useMemo(
    () => [
      {
        name: "Ventes",
        data: chartData.ventes,
      },
      {
        name: "Revenus",
        data: chartData.revenus,
      },
    ],
    [chartData]
  );
  return (
    <div className="rounded-2xl border border-neutral-300 bg-white px-5 pb-5 pt-5 dark:border-neutral-400 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Statistiques
          </h3>
          <p className="mt-1 text-gray-500 text-theme-sm dark:text-gray-400">
            Objectifs que vous avez définis pour chaque mois
          </p>
        </div>
        <div className="flex items-start w-full gap-3 sm:justify-end">
          <ChartTab selected={selectedPeriod} onPeriodChange={setSelectedPeriod} />
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart options={options} series={series} type="area" height={310} />
        </div>
      </div>
    </div>
  );
}
