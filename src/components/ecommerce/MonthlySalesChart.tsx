import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";
import { useState, useEffect, useMemo } from "react";
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

  // Mémoriser les options pour éviter les re-renders inutiles
  const options: ApexOptions = useMemo(
    () => ({
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
        formatter: (val: number) => {
          // Formater le nombre de ventes sans FCFA (c'est un nombre, pas un montant)
          if (val === 0) return "0";
          return val.toLocaleString("fr-FR");
        },
      },
    },
    }),
    []
  );

  /**
   * Calcule les données mensuelles en utilisant uniquement les valeurs réelles de l'API
   * Utilise le nombre de commandes (commandemois, commandeMoisPasse) pour les ventes
   * Affiche uniquement les mois avec des données réelles (mois actuel et mois passé)
   * Les autres mois restent à 0 pour éviter toute estimation
   */
  const getMonthlyData = useMemo((): number[] => {
    if (!reportsData) {
      return [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    }

    const currentDate = new Date();
    const currentMonthIndex = currentDate.getMonth(); // 0-11 (janvier = 0)

    // Créer un tableau de 12 mois initialisé à 0
    const monthlyData = new Array(12).fill(0);

    // Utiliser uniquement les valeurs réelles de l'API
    // Ventes = nombre de commandes (pas le montant)
    const currentMonthVentes = reportsData.commandemois || 0;
    const lastMonthVentes = reportsData.commandeMoisPasse || 0;

    // Mois actuel (mois en cours) - Valeur réelle
    if (currentMonthIndex < 12) {
      monthlyData[currentMonthIndex] = currentMonthVentes;
    }

    // Mois passé (mois précédent) - Valeur réelle
    if (currentMonthIndex > 0) {
      monthlyData[currentMonthIndex - 1] = lastMonthVentes;
    } else {
      // Si on est en janvier (index 0), le mois passé est décembre (index 11)
      monthlyData[11] = lastMonthVentes;
    }

    // Les autres mois restent à 0 car nous n'avons pas de données réelles pour eux
    // Cela garantit que seules les valeurs réelles de l'API sont affichées

    return monthlyData;
  }, [reportsData]);

  const series = useMemo(
    () => [
      {
        name: "Ventes",
        data: getMonthlyData,
      },
    ],
    [getMonthlyData]
  );
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
