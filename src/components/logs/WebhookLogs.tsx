import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { DateRangeKey, FormElementsState, WebhookLog, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import {
  useGetQueryWebhookLogs,
  useGetWebhookLogEndpoints,
} from "../../utils/api/webhookLog";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const WEBHOOK_SOURCES = [
  { value: "shopify", label: "Shopify" },
  { value: "trendyol", label: "Trendyol" },
  { value: "hepsiburada", label: "Hepsiburada" },
];

const WEBHOOK_STATUSES = [
  { value: "success", label: "Success" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
  { value: "error", label: "Error" },
  { value: "order_not_created", label: "Order Not Created" },
];

const initialFilterPanelFormElements = {
  source: "",
  status: "",
  endpoint: "",
  date: "thisMonth",
  endDate: dateRanges.thisMonth().before,
  startDate: dateRanges.thisMonth().after,
};

export default function WebhookLogs() {
  const { t } = useTranslation();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const [showWebhookLogsFilters, setShowWebhookLogsFilters] = useState(false);
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const { data: webhookLogsPayload } = useGetQueryWebhookLogs(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const { data: endpointList } = useGetWebhookLogEndpoints();


  // Helper function to extract products from requestBody based on source
  const extractProducts = (log: WebhookLog) => {
    if (!log.requestBody) return [];

    try {
      const body =
        typeof log.requestBody === "string"
          ? JSON.parse(log.requestBody)
          : log.requestBody;

      if (log.source === "SHOPIFY" || log.source === "shopify") {
        return body.line_items || body.items || [];
      }

      if (log.source === "TRENDYOL" || log.source === "trendyol") {
        return body.lines || body.items || body.orderLines || [];
      }

      if (log.source === "HEPSIBURADA" || log.source === "hepsiburada") {
        return body.items || body.orderItems || [];
      }

      return body.items || body.line_items || body.products || [];
    } catch (e) {
      return [];
    }
  };

  const getOrderId = (log: WebhookLog) => {
    if (log.externalOrderId) return log.externalOrderId;
    if (log.orderIds && log.orderIds.length > 0) return String(log.orderIds[0]);

    try {
      const body =
        typeof log.requestBody === "string"
          ? JSON.parse(log.requestBody)
          : log.requestBody;

      return body.order_id || body.orderId || body.id || body.number || "-";
    } catch (e) {
      return "-";
    }
  };

  const getOrderNumber = (log: WebhookLog) => {
    try {
      const body =
        typeof log.requestBody === "string"
          ? JSON.parse(log.requestBody)
          : log.requestBody;

      if (log.source === "TRENDYOL" || log.source === "trendyol") {
        return body.orderNumber || "-";
      }

      if (log.source === "SHOPIFY" || log.source === "shopify") {
        return body.order_number || body.name || body.number || "-";
      }

      return (
        body.orderNumber || body.order_number || body.name || body.number || "-"
      );
    } catch (e) {
      return "-";
    }
  };

  const groupedRows = useMemo(() => {
    const allLogs = webhookLogsPayload?.logs || [];
    const grouped = new Map<string, WebhookLog[]>();

    allLogs.forEach((log) => {
      const orderId = getOrderId(log);
      const groupKey = orderId && orderId !== "-" ? orderId : `log_${log._id}`;
      if (!grouped.has(groupKey)) grouped.set(groupKey, []);
      grouped.get(groupKey)?.push(log);
    });

    return grouped;
  }, [webhookLogsPayload]);

  const rows = useMemo(() => {
    const result: any[] = [];

    groupedRows.forEach((logs, orderId) => {
      if (logs.length === 0) return;

      const sortedLogs = [...logs].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const mainLog = sortedLogs[0];

      const allProducts = new Map<string, any>();
      sortedLogs.forEach((log) => {
        extractProducts(log).forEach((product: any) => {
          const productKey =
            product.sku ||
            product.barcode ||
            product.variant_sku ||
            product.productCode ||
            product.name ||
            product.title ||
            product.productName;
          if (productKey && !allProducts.has(productKey)) {
            allProducts.set(productKey, {
              name: product.name || product.title || product.productName || "-",
              sku:
                product.sku ||
                product.barcode ||
                product.variant_sku ||
                product.productCode ||
                "-",
              quantity: product.quantity || product.qty || 0,
              price:
                product.price ||
                product.unit_price ||
                product.unitPrice ||
                product.lineUnitPrice ||
                0,
            });
          }
        });
      });

      result.push({
        ...mainLog,
        statusDisplay: mainLog.status || "unknown",
        hasError: !!mainLog.errorMessage,
        orderId,
        orderNumber: getOrderNumber(mainLog),
        products: Array.from(allProducts.values()),
        requestCount: sortedLogs.length,
        collapsible: {
          collapsibleHeader: t("Webhook Requests for Order {{orderId}}", {
            orderId,
          }),
          collapsibleColumns: [
            { key: t("Date"), isSortable: true },
            { key: t("Endpoint"), isSortable: true },
            { key: t("Status"), isSortable: true },
            { key: t("Status Code"), isSortable: true },
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
              node: (row: WebhookLog) => {
                const date = new Date(row.createdAt);
                return (
                  <div>
                    <div>{format(new Date(row.createdAt), "dd/MM/yyyy")}</div>
                    <div className="text-xs text-gray-500">
                      {format(date, "HH:mm:ss")}
                    </div>
                  </div>
                );
              },
            },
            {
              key: "endpoint",
              node: (row: WebhookLog) => (
                <div className="truncate" title={row.endpoint}>
                  {row.endpoint || "-"}
                </div>
              ),
            },
            {
              key: "status",
              node: (row: any) => {
                const status = row.status || "unknown";
                const statusColors: Record<string, string> = {
                  success: "bg-green-500",
                  order_not_created: "bg-yellow-500",
                  error: "bg-red-500",
                  failed: "bg-red-500",
                };
                const color =
                  statusColors[status.toLowerCase()] || "bg-gray-500";
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
              key: "statusCode",
              node: (row: WebhookLog) => {
                const statusCode = row.statusCode;
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
              key: "errorMessage",
              node: (row: WebhookLog) => {
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
      });
    });

    return result;
  }, [groupedRows, t]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Order ID"), isSortable: true, correspondingKey: "orderId" },
      {
        key: t("Order Number"),
        isSortable: true,
        correspondingKey: "orderNumber",
      },
      { key: t("Products"), isSortable: false, correspondingKey: "products" },
      {
        key: t("Requests"),
        isSortable: true,
        correspondingKey: "requestCount",
      },
      { key: t("Source"), isSortable: true, correspondingKey: "source" },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "createdAt",
        className: "min-w-32",
        node: (row: any) => {
          return format(new Date(row.createdAt), "dd/MM/yyyy");
        },
      },
      {
        key: "orderId",
        className: "min-w-32",
        node: (row: any) => {
          return (
            <div className="font-medium text-blue-600">
              {row.orderId || "-"}
            </div>
          );
        },
      },
      {
        key: "orderNumber",
        className: "min-w-32",
        node: (row: any) => {
          return (
            <div className="font-medium text-gray-700">
              {row.orderNumber || "-"}
            </div>
          );
        },
      },
      {
        key: "products",
        className: "min-w-64 max-w-96",
        node: (row: any) => {
          const products = row.products || [];
          if (products.length === 0) {
            return <span className="text-gray-400">-</span>;
          }
          return (
            <div className="flex flex-col gap-1">
              {products.slice(0, 3).map((product: any, index: number) => (
                <div key={index} className="text-sm">
                  <span className="font-medium">{product.name || "-"}</span>
                  {product.quantity > 0 && (
                    <span className="text-gray-600 ml-2">
                      x{product.quantity}
                    </span>
                  )}
                  {product.price > 0 && (
                    <span className="text-gray-600 ml-2">
                      (
                      {typeof product.price === "number"
                        ? product.price.toFixed(2)
                        : product.price}{" "}
                      ₺)
                    </span>
                  )}
                </div>
              ))}
              {products.length > 3 && (
                <div className="text-xs text-gray-500 italic">
                  +{products.length - 3} {t("more products")}
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: "requestCount",
        className: "min-w-24",
        node: (row: any) => {
          const count = row.requestCount || 0;
          return <div className="font-medium ">{count}</div>;
        },
      },
      {
        key: "source",
        className: "min-w-24",
        node: (row: any) => {
          return (
            <div className="capitalize font-medium">{row.source || "-"}</div>
          );
        },
      },
    ],
    [t]
  );

  const endpointOptions = useMemo(
    () => (endpointList ?? []).map((ep) => ({ value: ep, label: ep })),
    [endpointList]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "source",
        label: t("Source"),
        options: WEBHOOK_SOURCES.map((source) => ({
          value: source.value,
          label: source.label,
        })),
        placeholder: t("Source"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: WEBHOOK_STATUSES.map((status) => ({
          value: status.value,
          label: status.label,
        })),
        placeholder: t("Status"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "endpoint",
        label: t("Endpoint"),
        options: endpointOptions,
        placeholder: t("Endpoint"),
        required: false,
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
        additionalOnChange: ({ value }: { value: string }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            const { before, after } = dateRange();
            setFilterPanelFormElements((prev) => ({
              ...prev,
              startDate: after,
              endDate: before,
              date: value,
            }));
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
    [t, endpointOptions, setFilterPanelFormElements]
  );

  const tableFilters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showWebhookLogsFilters}
            onChange={setShowWebhookLogsFilters}
          />
        ),
      },
    ],
    [t, showWebhookLogsFilters, setShowWebhookLogsFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showWebhookLogsFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowWebhookLogsFilters(false),
      isApplyButtonActive: false,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showWebhookLogsFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      setShowWebhookLogsFilters,
      initialFilterPanelFormElements,
    ]
  );

  const pagination = useMemo(() => {
    return webhookLogsPayload
      ? {
          totalPages: Math.ceil(webhookLogsPayload.total / rowsPerPage),
          totalRows: webhookLogsPayload.total,
        }
      : null;
  }, [webhookLogsPayload, rowsPerPage]);

  return (
    <div className="w-[98%] mx-auto my-10">
      <GenericTable
        rowKeys={rowKeys}
        filters={tableFilters}
        columns={columns}
        filterPanel={filterPanel}
        rows={rows ?? []}
        isSearch={false}
        title={t("Webhook Logs")}
        isActionsActive={false}
        isCollapsible={true}
        {...(pagination && { pagination })}
        isAllRowPerPageOption={false}
      />
    </div>
  );
}
