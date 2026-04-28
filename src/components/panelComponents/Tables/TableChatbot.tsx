import { Tooltip } from "@material-tailwind/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BsStars } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import { toast } from "react-toastify";
import {
  FilterSchemaField,
  TableColumn,
  useAITableFilter,
} from "../../../utils/api/ai";
import { useGeneralContext } from "../../../context/General.context";

export interface ChatbotProps {
  tableName: string;
  schema: Record<string, FilterSchemaField>;
  filterFormElements: Record<string, any>;
  setFilterFormElements: (v: Record<string, any>) => void;
  initialFilterFormElements: Record<string, any>;
  tableColumns?: TableColumn[];
}

const TableChatbot = ({
  tableName,
  schema,
  filterFormElements,
  setFilterFormElements,
  initialFilterFormElements,
  tableColumns,
}: ChatbotProps) => {
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState("");
  const [lastExplanation, setLastExplanation] = useState("");
  const { mutate: getFilters, isPending } = useAITableFilter();
  const { setSearchQuery, setCurrentPage } = useGeneralContext();

  const handleSubmit = () => {
    const query = inputValue.trim();
    if (!query) return;

    getFilters(
      { query, tableName, schema, tableColumns },
      {
        onSuccess: (data) => {
          const hasFilters = Object.keys(data.filters).length > 0;
          const hasSearchQuery = !!data.searchQuery;
          if (hasFilters || hasSearchQuery) {
            if (hasFilters) {
              setFilterFormElements({
                ...filterFormElements,
                ...data.filters,
              });
            }
            if (hasSearchQuery) {
              setSearchQuery(data.searchQuery!);
              setCurrentPage(1);
            }
            setLastExplanation(data.explanation);
            setInputValue("");
          } else {
            toast.info(
              <div className="flex flex-col gap-1">
                <span className="font-medium">{t(data.explanation)}</span>
                <span className="text-sm">{t("You can filter by the following fields:")}</span>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {Object.values(schema).map((field) => (
                    <li key={field.label} className="flex items-center gap-1">
                      <span className="text-purple-400">•</span>
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>,
              { autoClose: 12000 }
            );
          }
        },
        onError: () => {
          toast.error(t("AI filter request failed. Please try again."));
        },
      }
    );
  };

  const handleClear = () => {
    setLastExplanation("");
    setInputValue("");
    setFilterFormElements(initialFilterFormElements);
    setSearchQuery("");
  };

  return (
    <div className="flex flex-row items-center gap-2">
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder={t("Filter with AI...")}
          disabled={isPending}
          className="border border-purple-300 rounded-md py-2 px-3 pr-8 focus:outline-none focus:border-purple-500 text-sm disabled:opacity-50 w-52"
        />
        <button
          onClick={handleSubmit}
          disabled={isPending || !inputValue.trim()}
          className="absolute right-2 text-purple-400 hover:text-purple-600 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label={t("Filter")}
        >
          <BsStars size={16} />
        </button>
      </div>
      {isPending && (
        <span className="text-xs text-purple-500 animate-pulse">
          {t("Filtering...")}
        </span>
      )}
      {lastExplanation && !isPending && (
        <Tooltip content={lastExplanation} placement="bottom" animate={{ mount: { opacity: 1 }, unmount: { opacity: 0 } }}>
          <div className="flex items-center gap-1 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 cursor-default">
            <span className="text-xs text-purple-700 max-w-xs truncate">
              {lastExplanation}
            </span>
            <button
              onClick={handleClear}
              className="text-purple-400 hover:text-purple-700 flex-shrink-0"
              aria-label={t("Close explanation")}
            >
              <MdClose size={14} />
            </button>
          </div>
        </Tooltip>
      )}
    </div>
  );
};

export default TableChatbot;
