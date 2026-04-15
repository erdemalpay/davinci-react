import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import {
  ConcurrencyLog,
  ConcurrentRequest,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetConcurrencyLogs } from "../../utils/api/concurrencyLog";
import { formatAsLocalDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

export default function ConcurrencyLogs() {
  const { t } = useTranslation();
  const initialFilterPanelFormElements: FormElementsState = {
    endpoint: "",
    date: "thisMonth",
    endDate: dateRanges.thisMonth().before,
    startDate: dateRanges.thisMonth().after,
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const [showFilters, setShowFilters] = useState(false);
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();

  const { data, isLoading, error } = useGetConcurrencyLogs(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Method"), isSortable: true, correspondingKey: "method" },
      { key: t("Endpoint"), isSortable: true, correspondingKey: "endpoint" },
      {
        key: t("Eşzamanlı İstek Sayısı"),
        isSortable: true,
        correspondingKey: "inFlightCount",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "createdAt",
        className: "min-w-32",
        node: (row: ConcurrencyLog) => {
          const date = new Date(row.createdAt);
          return (
            <div>
              <div>{formatAsLocalDate(row.createdAt)}</div>
              <div className="text-xs text-gray-500">
                {format(date, "HH:mm:ss")}
              </div>
            </div>
          );
        },
      },
      {
        key: "method",
        className: "min-w-20",
        node: (row: ConcurrencyLog) => {
          const methodColors: Record<string, string> = {
            GET: "bg-blue-100 text-blue-700",
            POST: "bg-green-100 text-green-700",
            PATCH: "bg-yellow-100 text-yellow-700",
            DELETE: "bg-red-100 text-red-700",
          };
          const color =
            methodColors[row.method] ?? "bg-gray-100 text-gray-700";
          return (
            <span
              className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}
            >
              {row.method}
            </span>
          );
        },
      },
      {
        key: "endpoint",
        className: "min-w-48",
        node: (row: ConcurrencyLog) => (
          <span className="font-mono text-xs">{row.endpoint}</span>
        ),
      },
      {
        key: "inFlightCount",
        className: "min-w-24",
        node: (row: ConcurrencyLog) => (
          <span className="font-semibold text-orange-600">
            {row.inFlightCount}
          </span>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    return (data?.logs ?? []).map((log) => ({
      ...log,
      collapsible: {
        collapsibleHeader: t("Concurrent Requests ({{count}})", {
          count: log.requests?.length ?? 0,
        }),
        collapsibleColumns: [
          { key: t("User"), isSortable: false },
          { key: t("Payload"), isSortable: false },
        ],
        collapsibleRows: log.requests ?? [],
        collapsibleRowKeys: [
          {
            key: "userName",
            node: (req: ConcurrentRequest) => (
              <span className="font-medium min-w-32 inline-block">
                {req.userName ?? (
                  <span className="text-gray-400">{t("Unknown")}</span>
                )}
              </span>
            ),
          },
          {
            key: "requestBody",
            node: (req: ConcurrentRequest) =>
              req.requestBody &&
              Object.keys(req.requestBody).length > 0 ? (
                <pre className="text-xs bg-gray-50 rounded p-2 max-w-lg overflow-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(req.requestBody, null, 2)}
                </pre>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
        ],
      },
    }));
  }, [data, t]);

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "endpoint",
        label: t("Endpoint"),
        placeholder: t("Endpoint"),
        required: false,
        isDatePicker: false,
        isOnClearActive: false,
        isDebounce: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions?.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
        placeholder: t("Date"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "startDate",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "endDate",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
    ],
    [t]
  );

  const tableFilters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton checked={showFilters} onChange={setShowFilters} />
        ),
      },
    ],
    [t, showFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
      isApplyButtonActive: false,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [showFilters, filterPanelInputs, filterPanelFormElements]
  );

  const pagination = useMemo(
    () =>
      data
        ? {
            totalPages: Math.ceil(data.total / rowsPerPage),
            totalRows: data.total,
          }
        : null,
    [data, rowsPerPage]
  );

  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  if (isLoading) {
    return (
      <div className="w-[98%] mx-auto my-10 flex items-center justify-center h-64">
        <div className="text-gray-500">{t("Loading")}...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[98%] mx-auto my-10 flex items-center justify-center h-64">
        <div className="text-red-500">
          {t("Error loading concurrency logs")}
        </div>
      </div>
    );
  }

  return (
    <div className="w-[98%] mx-auto my-10">
      <GenericTable
        rowKeys={rowKeys}
        filters={tableFilters}
        columns={columns}
        filterPanel={filterPanel}
        rows={rows}
        isSearch={false}
        title={t("Concurrency Logs")}
        isActionsActive={false}
        isCollapsible={true}
        {...(pagination && { pagination })}
        isAllRowPerPageOption={false}
      />
    </div>
  );
}
