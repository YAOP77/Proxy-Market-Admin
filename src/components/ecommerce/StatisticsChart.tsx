import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import ChartTab from "../common/ChartTab";
import { useEffect, useState } from "react";
import reportService, { ReportsData } from "../../services/api/reportService";

export default function StatisticsChart() {
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);

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
  const options: ApexOptions = {
    legend: {
      show: false, // Hide legend
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#04b05d", "rgba(4, 176, 93, 0.5)"], // Define line colors - Proxy Market
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 310,
      type: "line", // Set the chart type to 'line'
      toolbar: {
        show: false, // Hide chart toolbar
      },
    },
    stroke: {
      curve: "straight", // Define the line style (straight, smooth, or step)
      width: [2, 2], // Line width for each dataset
    },

    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0, // Size of the marker points
      strokeColors: "#fff", // Marker border color
      strokeWidth: 2,
      hover: {
        size: 6, // Marker size on hover
      },
    },
    grid: {
      xaxis: {
        lines: {
          show: false, // Hide grid lines on x-axis
        },
      },
      yaxis: {
        lines: {
          show: true, // Show grid lines on y-axis
        },
      },
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    tooltip: {
      enabled: true, // Enable tooltip
      x: {
        format: "dd MMM yyyy", // Format for x-axis tooltip
      },
    },
    xaxis: {
      type: "category", // Category-based x-axis
      categories: [
        "Janv",
        "Fév",
        "Mars",
        "Avr",
        "Mai",
        "Juin",
        "Juil",
        "Août",
        "Sept",
        "Oct",
        "Nov",
        "Déc",
      ],
      axisBorder: {
        show: false, // Hide x-axis border
      },
      axisTicks: {
        show: false, // Hide x-axis ticks
      },
      tooltip: {
        enabled: false, // Disable tooltip for x-axis points
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px", // Adjust font size for y-axis labels
          colors: ["#6B7280"], // Color of the labels
        },
      },
      title: {
        text: "", // Remove y-axis title
        style: {
          fontSize: "0px",
        },
      },
    },
  };

  // Calculer les données mensuelles basées strictement sur les valeurs de l'API
  const getMonthlyData = (): { ventes: number[]; revenus: number[] } => {
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

    // Utiliser uniquement les valeurs réelles de l'API
    const currentMonthTotal = reportsData.commandemois_soustotal || 0;
    const lastMonthTotal = reportsData.commandeMoisPasse_soustotal || 0;
    const yearTotal = reportsData.commandeannee_soustotal || 0;

    // Mois actuel (mois en cours)
    if (currentMonthIndex < 12) {
      ventesData[currentMonthIndex] = currentMonthTotal;
      // Les revenus sont égaux aux ventes (soustotal) dans ce contexte
      revenusData[currentMonthIndex] = currentMonthTotal;
    }

    // Mois passé (mois précédent)
    if (currentMonthIndex > 0) {
      ventesData[currentMonthIndex - 1] = lastMonthTotal;
      revenusData[currentMonthIndex - 1] = lastMonthTotal;
    } else {
      // Si on est en janvier (index 0), le mois passé est décembre (index 11)
      ventesData[11] = lastMonthTotal;
      revenusData[11] = lastMonthTotal;
    }

    // Pour les autres mois, on peut utiliser une estimation basée sur le total annuel
    // mais seulement si on a des données réelles
    if (yearTotal > 0) {
      const knownMonthsTotal = currentMonthTotal + lastMonthTotal;
      const remainingTotal = Math.max(0, yearTotal - knownMonthsTotal);
      
      // Répartir le reste sur les autres mois de manière égale
      const monthsWithData = currentMonthIndex > 0 ? 2 : 1;
      const otherMonths = 12 - monthsWithData;
      
      if (otherMonths > 0 && remainingTotal > 0) {
        const avgPerMonth = Math.floor(remainingTotal / otherMonths);
        for (let i = 0; i < 12; i++) {
          // Ne pas écraser les mois avec données réelles
          if (i !== currentMonthIndex && !(currentMonthIndex > 0 && i === currentMonthIndex - 1)) {
            ventesData[i] = avgPerMonth;
            revenusData[i] = avgPerMonth;
          }
        }
      }
    }

    return { ventes: ventesData, revenus: revenusData };
  };

  const monthlyData = getMonthlyData();
  const series = [
    {
      name: "Ventes",
      data: monthlyData.ventes,
    },
    {
      name: "Revenus",
      data: monthlyData.revenus,
    },
  ];
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
          <ChartTab />
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
