import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import {
  DateRangeKey,
  FormElementsState,
  IntegrationRequestLog,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetIntegrationRequestLogs } from "../../utils/api/integrationRequestLog";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const INTEGRATION_REQUEST_STATUSES = [
  { value: "success", label: "Success" },
  { value: "error", label: "Error" },
];

const initialFilterPanelFormElements = {
  status: "",
  date: "thisMonth",
  endDate: dateRanges.thisMonth().before,
  startDate: dateRanges.thisMonth().after,
};

export default function IntegrationRequestLogs() {
  const { t } = useTranslation();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const [
    showIntegrationRequestLogsFilters,
    setShowIntegrationRequestLogsFilters,
  ] = useState(false);
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();

  const { data } = useGetIntegrationRequestLogs(
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
        key: t("Status Code"),
        isSortable: true,
        correspondingKey: "statusCode",
      },
      { key: t("Duration"), isSortable: true, correspondingKey: "durationMs" },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "createdAt",
        className: "min-w-32",
        node: (row: IntegrationRequestLog) => (
          <span>{format(new Date(row.createdAt), "dd/MM/yyyy")}</span>
        ),
      },
      {
        key: "method",
        className: "min-w-20",
        node: (row: IntegrationRequestLog) => {
          const methodColors: Record<string, string> = {
            POST: "bg-green-100 text-green-700",
            PATCH: "bg-yellow-100 text-yellow-700",
            DELETE: "bg-red-100 text-red-700",
          };
          const color = methodColors[row.method] ?? "bg-gray-100 text-gray-700";
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
        node: (row: IntegrationRequestLog) => (
          <span className="font-mono text-xs">{row.endpoint}</span>
        ),
      },
      {
        key: "statusCode",
        className: "min-w-24",
        node: (row: IntegrationRequestLog) => {
          const statusCode = row.statusCode;
          // Cevap gelmediyse bos kalir; uydurma 500 gosterilmez.
          if (!statusCode) {
            return <span className="text-gray-400">-</span>;
          }
          let color = "bg-gray-500";
          if (statusCode >= 200 && statusCode < 300) {
            color = "bg-green-500";
          } else if (statusCode >= 300 && statusCode < 400) {
            color = "bg-blue-500";
          } else if (statusCode >= 400 && statusCode < 500) {
            color = "bg-yellow-500";
          } else if (statusCode >= 500) {
            color = "bg-red-500";
          }
          return (
            <div
              className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${color} text-white`}
            >
              {statusCode}
            </div>
          );
        },
      },
      {
        key: "durationMs",
        className: "min-w-24",
        node: (row: IntegrationRequestLog) => (
          <span>{row.durationMs} ms</span>
        ),
      },
    ],
    []
  );

  const rows = useMemo(() => {
    return (data?.logs ?? []).map((log) => ({
      ...log,
      collapsible: {
        collapsibleHeader: t("Request Detail"),
        collapsibleColumns: [
          { key: t("Request"), isSortable: false },
          { key: t("Response"), isSortable: false },
          { key: t("Error"), isSortable: false },
        ],
        collapsibleRows: [log],
        collapsibleRowKeys: [
          {
            key: "requestBody",
            node: (row: IntegrationRequestLog) =>
              row.requestBody ? (
                <pre className="text-xs bg-gray-50 rounded p-2 max-w-lg overflow-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(row.requestBody, null, 2)}
                </pre>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
          {
            key: "responseBody",
            node: (row: IntegrationRequestLog) =>
              row.responseBody ? (
                <pre className="text-xs bg-gray-50 rounded p-2 max-w-lg overflow-auto whitespace-pre-wrap break-all">
                  {JSON.stringify(row.responseBody, null, 2)}
                </pre>
              ) : (
                <span className="text-gray-400">-</span>
              ),
          },
          {
            key: "errorMessage",
            node: (row: IntegrationRequestLog) =>
              row.errorMessage ? (
                <span className="text-red-600 break-all">
                  {row.errorMessage}
                </span>
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
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: INTEGRATION_REQUEST_STATUSES.map((status) => ({
          value: status.value,
          label: t(status.label),
        })),
        placeholder: t("Status"),
        required: false,
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
        additionalOnChange: ({ value }: { value: string }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            const { before, after } = dateRange();
            setFilterPanelFormElements({
              ...filterPanelFormElements,
              startDate: after,
              endDate: before,
              date: value,
            });
          }
        },
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
    [t, filterPanelFormElements, setFilterPanelFormElements]
  );

  const tableFilters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showIntegrationRequestLogsFilters}
            onChange={setShowIntegrationRequestLogsFilters}
          />
        ),
      },
    ],
    [
      t,
      showIntegrationRequestLogsFilters,
      setShowIntegrationRequestLogsFilters,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showIntegrationRequestLogsFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowIntegrationRequestLogsFilters(false),
      isApplyButtonActive: false,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
        setCurrentPage(1);
      },
    }),
    [
      showIntegrationRequestLogsFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      setShowIntegrationRequestLogsFilters,
      setCurrentPage,
    ]
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

  return (
    <div className="w-[98%] mx-auto my-10">
      <GenericTable
        rowKeys={rowKeys}
        filters={tableFilters}
        columns={columns}
        filterPanel={filterPanel}
        rows={rows}
        isSearch={false}
        title={t("Trendyol Request Logs")}
        isActionsActive={false}
        isCollapsible={true}
        {...(pagination && { pagination })}
        isAllRowPerPageOption={false}
      />
    </div>
  );
}
