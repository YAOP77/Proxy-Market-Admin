import { useState } from "react";

export type ChartPeriod = "monthly" | "quarterly" | "annually";

interface ChartTabProps {
  selected?: ChartPeriod;
  onPeriodChange?: (period: ChartPeriod) => void;
}

const ChartTab: React.FC<ChartTabProps> = ({ selected: externalSelected, onPeriodChange }) => {
  const [internalSelected, setInternalSelected] = useState<ChartPeriod>("monthly");
  
  // Utiliser la sélection externe si fournie, sinon utiliser la sélection interne
  const selected = externalSelected ?? internalSelected;

  const handleSelection = (period: ChartPeriod) => {
    if (onPeriodChange) {
      onPeriodChange(period);
    } else {
      setInternalSelected(period);
    }
  };

  const getButtonClass = (option: ChartPeriod) =>
    selected === option
      ? "shadow-theme-xs text-gray-900 dark:text-white bg-white dark:bg-gray-800"
      : "text-gray-500 dark:text-gray-400";

  return (
    <div className="flex items-center gap-0.5 rounded-lg bg-gray-100 p-0.5 dark:bg-gray-900">
      <button
        onClick={() => handleSelection("monthly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "monthly"
        )}`}
      >
        Monthly
      </button>

      <button
        onClick={() => handleSelection("quarterly")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "quarterly"
        )}`}
      >
        Quarterly
      </button>

      <button
        onClick={() => handleSelection("annually")}
        className={`px-3 py-2 font-medium w-full rounded-md text-theme-sm hover:text-gray-900 dark:hover:text-white ${getButtonClass(
          "annually"
        )}`}
      >
        Annually
      </button>
    </div>
  );
};

export default ChartTab;
