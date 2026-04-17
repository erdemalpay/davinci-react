import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { commonDateOptions, PriceCompareLog } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetQueryPriceCompareLogs } from "../../utils/api/priceCompareLog";
import { formatAsLocalDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

const PRICE_COMPARE_TYPES = [
  { value: "CRON", label: "Cron" },
  { value: "SITE", label: "Site" },
];

const PRICE_COMPARE_STATUSES = [
  { value: "PENDING", label: "Pending" },
  { value: "SUCCESS", label: "Success" },
  { value: "PARTIAL_SUCCESS", label: "Partial Success" },
  { value: "FAILED", label: "Failed" },
];

export default function PriceCompareLogs() {
  const { t } = useTranslation();
  const initialFilterPanelFormElements: FormElementsState = {
    type: "",
    status: "",
    target: "",
    date: "thisMonth",
    endDate: dateRanges.thisMonth().before,
    startDate: dateRanges.thisMonth().after,
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const {
    data: priceCompareLogsPayload,
    isLoading,
    error,
  } = useGetQueryPriceCompareLogs(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const [showPriceCompareLogsFilters, setShowPriceCompareLogsFilters] =
    useState(false);

  // Helper function to get status color
  const getStatusColor = (status: string): string => {
    const statusColors: Record<string, string> = {
      pending: "bg-yellow-500",
      success: "bg-green-500",
      partial_success: "bg-blue-500",
      failed: "bg-red-500",
    };
    return statusColors[status?.toLowerCase()] || "bg-gray-500";
  };

  // Group logs by target
  const groupedRows = useMemo(() => {
    const allLogs = priceCompareLogsPayload?.logs || [];
    const grouped = new Map<string, PriceCompareLog[]>();

    allLogs.forEach((log) => {
      const target = log.target || "unknown";

      if (!grouped.has(target)) {
        grouped.set(target, []);
      }
      grouped.get(target)?.push(log);
    });

    return grouped;
  }, [priceCompareLogsPayload]);

  const rows = useMemo(() => {
    const result: any[] = [];

    groupedRows.forEach((logs, target) => {
      if (logs.length === 0) return;

      // Sort logs by createdAt (newest first)
      const sortedLogs = [...logs].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });

      // First log is the main row
      const mainLog = sortedLogs[0];

      const mainRow: any = {
        ...mainLog,
        statusDisplay: mainLog.status || "unknown",
        hasError: !!mainLog.errorMessage,
        requestCount: sortedLogs.length,
        collapsible: {
          collapsibleHeader: t("Price Compare Logs for {{target}}", {
            target,
          }),
          collapsibleColumns: [
            { key: t("Date"), isSortable: true },
            { key: t("Type"), isSortable: true },
            { key: t("Status"), isSortable: true },
            { key: t("Items"), isSortable: true },
            { key: t("Processing Time"), isSortable: true },
            { key: t("Error"), isSortable: false },
          ],
          collapsibleRows: sortedLogs.map((log) => ({
            ...log,
            statusDisplay: log.status || "unknown",
            hasError: !!log.errorMessage,
          })),
          collapsibleRowKeys: [
            {
              key: "createdAt",
              node: (row: PriceCompareLog) => {
                const date = new Date(row.createdAt);
                const offset = date.getTimezoneOffset();
                const adjustedDate = new Date(
                  date.getTime() + offset * 60 * 1000
                );
                return (
                  <div>
                    <div>{formatAsLocalDate(row.createdAt.toString())}</div>
                    <div className="text-xs text-gray-500">
                      {format(adjustedDate, "HH:mm:ss")}
                    </div>
                  </div>
                );
              },
            },
            {
              key: "type",
              node: (row: PriceCompareLog) => (
                <div className="capitalize font-medium">{row.type || "-"}</div>
              ),
            },
            {
              key: "status",
              node: (row: any) => {
                const status = row.status || "unknown";
                const color = getStatusColor(status);
                return (
                  <div
                    className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${color} text-white capitalize`}
                  >
                    {status.replace(/_/g, " ")}
                  </div>
                );
              },
            },
            {
              key: "totalItems",
              node: (row: PriceCompareLog) => (
                <div className="font-medium">{row.totalItems || "-"}</div>
              ),
            },
            {
              key: "processingTimeMs",
              node: (row: PriceCompareLog) => (
                <div className="font-medium">
                  {row.processingTimeMs ? `${row.processingTimeMs}ms` : "-"}
                </div>
              ),
            },
            {
              key: "errorMessage",
              node: (row: PriceCompareLog) => {
                if (row.errorMessage) {
                  return (
                    <div
                      className="truncate text-red-600"
                      title={row.errorMessage}
                    >
                      {row.errorMessage}
                    </div>
                  );
                }
                return <span className="text-gray-400">-</span>;
              },
            },
          ],
        },
      };

      result.push(mainRow);
    });

    return result;
  }, [groupedRows, t]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Target"), isSortable: true, correspondingKey: "target" },
      {
        key: t("Type"),
        isSortable: true,
        correspondingKey: "type",
      },
      { key: t("Status"), isSortable: true, correspondingKey: "status" },
      {
        key: t("Items"),
        isSortable: true,
        correspondingKey: "totalItems",
      },
      {
        key: t("Processing Time"),
        isSortable: true,
        correspondingKey: "processingTimeMs",
      },
      {
        key: t("Logs Count"),
        isSortable: true,
        correspondingKey: "requestCount",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "createdAt",
        className: "min-w-32",
        node: (row: any) => {
          return formatAsLocalDate(row.createdAt);
        },
      },
      {
        key: "target",
        className: "min-w-40",
        node: (row: any) => {
          return (
            <div
              className="font-medium text-blue-600 truncate"
              title={row.target}
            >
              {row.target || "-"}
            </div>
          );
        },
      },
      {
        key: "type",
        className: "min-w-24",
        node: (row: any) => {
          return (
            <div className="capitalize font-medium">{row.type || "-"}</div>
          );
        },
      },
      {
        key: "status",
        className: "min-w-32",
        node: (row: any) => {
          const status = row.status || "unknown";
          const color = getStatusColor(status);
          return (
            <div
              className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${color} text-white capitalize`}
            >
              {status.replace(/_/g, " ")}
            </div>
          );
        },
      },
      {
        key: "totalItems",
        className: "min-w-24",
        node: (row: any) => {
          return <div className="font-medium">{row.totalItems || "-"}</div>;
        },
      },
      {
        key: "processingTimeMs",
        className: "min-w-32",
        node: (row: any) => {
          return (
            <div className="font-medium">
              {row.processingTimeMs ? `${row.processingTimeMs}ms` : "-"}
            </div>
          );
        },
      },
      {
        key: "requestCount",
        className: "min-w-24",
        node: (row: any) => {
          const count = row.requestCount || 0;
          return <div className="font-medium">{count}</div>;
        },
      },
    ],
    [t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "type",
        label: t("Type"),
        options: PRICE_COMPARE_TYPES.map((type) => ({
          value: type.value,
          label: type.label,
        })),
        placeholder: t("Type"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: PRICE_COMPARE_STATUSES.map((status) => ({
          value: status.value,
          label: status.label,
        })),
        placeholder: t("Status"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "target",
        label: t("Target"),
        placeholder: t("Target"),
        required: false,
        isDatePicker: false,
        isOnClearActive: false,
        isDebounce: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions?.map((option) => {
          return {
            value: option.value,
            label: t(option.label),
          };
        }),
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
          <SwitchButton
            checked={showPriceCompareLogsFilters}
            onChange={setShowPriceCompareLogsFilters}
          />
        ),
      },
    ],
    [t, showPriceCompareLogsFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showPriceCompareLogsFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowPriceCompareLogsFilters(false),
      isApplyButtonActive: false,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showPriceCompareLogsFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
    ]
  );

  const pagination = useMemo(() => {
    return priceCompareLogsPayload
      ? {
          totalPages: Math.ceil(priceCompareLogsPayload.total / rowsPerPage),
          totalRows: priceCompareLogsPayload.total,
        }
      : null;
  }, [priceCompareLogsPayload, rowsPerPage]);

  // Effect to reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  if (isLoading) {
    return (
      <div className="w-[98%] mx-auto my-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">{t("Loading")}...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-[98%] mx-auto my-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            {t("Error loading price compare logs")}:{" "}
            {error instanceof Error ? error.message : String(error)}
          </div>
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
        rows={rows ?? []}
        isSearch={false}
        title={t("Price Compare Logs")}
        isActionsActive={false}
        isCollapsible={true}
        {...(pagination && { pagination })}
        isAllRowPerPageOption={false}
      />
    </div>
  );
}
