import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState, useEffect } from "react";
import reportService, { ReportsData } from "../../services/api/reportService";

export default function MonthlySalesChart() {
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
    colors: ["#04b05d"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "bar",
      height: 180,
      toolbar: {
        show: false,
      },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "39%",
        borderRadius: 5,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      show: true,
      width: 4,
      colors: ["transparent"],
    },
    xaxis: {
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
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "left",
      fontFamily: "Outfit",
    },
    yaxis: {
      title: {
        text: undefined,
      },
    },
    grid: {
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      opacity: 1,
    },

    tooltip: {
      x: {
        show: false,
      },
      y: {
        formatter: (val: number) => `${val}`,
      },
    },
  };
  // Calculer les données mensuelles basées strictement sur les valeurs de l'API
  const getMonthlyData = (): number[] => {
    if (!reportsData) {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0-11 (janvier = 0)

    // Créer un tableau de 12 mois initialisé à 0
    const monthlyData = new Array(12).fill(0);

    // Utiliser uniquement les valeurs réelles de l'API
    const currentMonthTotal = reportsData.commandemois_soustotal || 0;
    const lastMonthTotal = reportsData.commandeMoisPasse_soustotal || 0;
    const yearTotal = reportsData.commandeannee_soustotal || 0;

    // Mois actuel (mois en cours)
    if (currentMonthIndex < 12) {
      monthlyData[currentMonthIndex] = currentMonthTotal;
    }

    // Mois passé (mois précédent)
    if (currentMonthIndex > 0) {
      monthlyData[currentMonthIndex - 1] = lastMonthTotal;
    } else {
      // Si on est en janvier (index 0), le mois passé est décembre (index 11)
      monthlyData[11] = lastMonthTotal;
    }

    // Pour les autres mois, utiliser une répartition basée sur le total annuel
    // seulement si on a des données réelles
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
            monthlyData[i] = avgPerMonth;
          }
        }
      }
    }

    return monthlyData;
  };

  const series = [
    {
      name: "Ventes",
      data: getMonthlyData(),
    },
  ];
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-300 bg-white px-5 pt-5 dark:border-neutral-400 dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Ventes mensuelles
        </h3>
        <div className="relative inline-block">
          <button className="dropdown-toggle" onClick={toggleDropdown}>
            <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
          </button>
          <Dropdown
            isOpen={isOpen}
            onClose={closeDropdown}
            className="w-40 p-2"
          >
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Voir plus
            </DropdownItem>
            <DropdownItem
              onItemClick={closeDropdown}
              className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
            >
              Supprimer
            </DropdownItem>
          </Dropdown>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
          <Chart options={options} series={series} type="bar" height={180} />
        </div>
      </div>
    </div>
  );
}
