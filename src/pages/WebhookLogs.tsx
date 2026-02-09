import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { commonDateOptions, WebhookLog } from "../types";
import { useGetQueryWebhookLogs } from "../utils/api/webhookLog";
import { dateRanges } from "../utils/api/dateRanges";
import { formatAsLocalDate } from "../utils/format";

type FormElementsState = {
  [key: string]: any;
};

// WebhookSource ve WebhookStatus enum değerlerini backend'den öğrenmeniz gerekiyor
// Şimdilik genel değerler kullanıyoruz, backend enum'larına göre güncelleyin
const WEBHOOK_SOURCES = [
  { value: "SHOPIFY", label: "Shopify" },
  { value: "TRENDYOL", label: "Trendyol" },
  { value: "IKAS", label: "Ikas" },
  { value: "HEPSIBURADA", label: "Hepsiburada" },
];

const WEBHOOK_STATUSES = [
  { value: "SUCCESS", label: "Success" },
  { value: "FAILED", label: "Failed" },
  { value: "PENDING", label: "Pending" },
];

export default function WebhookLogs() {
  const { t } = useTranslation();
  const initialFilterPanelFormElements: FormElementsState = {
    source: "",
    status: "",
    endpoint: "",
    date: "thisMonth",
    endDate: dateRanges.thisMonth().before,
    startDate: dateRanges.thisMonth().after,
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const {
    data: webhookLogsPayload,
    isLoading,
    error,
  } = useGetQueryWebhookLogs(currentPage, rowsPerPage, filterPanelFormElements);
  const [showWebhookLogsFilters, setShowWebhookLogsFilters] = useState(false);

  // Helper function to extract products from requestBody based on source
  const extractProducts = (log: WebhookLog) => {
    if (!log.requestBody) return [];
    
    try {
      const body = typeof log.requestBody === 'string' 
        ? JSON.parse(log.requestBody) 
        : log.requestBody;
      
      // Shopify format
      if (log.source === 'SHOPIFY' || log.source === 'shopify') {
        return body.line_items || body.items || [];
      }
      
      // Trendyol format
      if (log.source === 'TRENDYOL' || log.source === 'trendyol') {
        return body.items || body.orderLines || [];
      }
      
      // Ikas format
      if (log.source === 'IKAS' || log.source === 'ikas') {
        return body.items || body.products || [];
      }
      
      // Hepsiburada format
      if (log.source === 'HEPSIBURADA' || log.source === 'hepsiburada') {
        return body.items || body.orderItems || [];
      }
      
      // Generic fallback
      return body.items || body.line_items || body.products || [];
    } catch (e) {
      return [];
    }
  };

  // Helper function to get order ID from log
  const getOrderId = (log: WebhookLog) => {
    if (log.externalOrderId) return log.externalOrderId;
    if (log.orderIds && log.orderIds.length > 0) return String(log.orderIds[0]);
    
    try {
      const body = typeof log.requestBody === 'string' 
        ? JSON.parse(log.requestBody) 
        : log.requestBody;
      
      return body.order_id || body.orderId || body.id || body.number || '-';
    } catch (e) {
      return '-';
    }
  };

  // Group logs by order ID
  const groupedRows = useMemo(() => {
    const allLogs = webhookLogsPayload?.logs || [];
    const grouped = new Map<string, WebhookLog[]>();
    
    allLogs.forEach((log) => {
      const orderId = getOrderId(log);
      if (!grouped.has(orderId)) {
        grouped.set(orderId, []);
      }
      grouped.get(orderId)?.push(log);
    });
    
    return grouped;
  }, [webhookLogsPayload]);

  const rows = useMemo(() => {
    const result: any[] = [];
    
    groupedRows.forEach((logs, orderId) => {
      if (logs.length === 0) return;
      
      // Sort logs by createdAt (newest first)
      const sortedLogs = [...logs].sort((a, b) => {
        const dateA = new Date(a.createdAt).getTime();
        const dateB = new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
      
      // First log is the main row
      const mainLog = sortedLogs[0];
      const products = extractProducts(mainLog);
      
      // Combine all products from all logs for this order
      const allProducts = new Map<string, any>();
      sortedLogs.forEach((log) => {
        const logProducts = extractProducts(log);
        logProducts.forEach((product: any) => {
          const productKey = product.sku || product.variant_sku || product.productCode || product.name || product.title;
          if (productKey && !allProducts.has(productKey)) {
            allProducts.set(productKey, {
              name: product.name || product.title || product.productName || '-',
              sku: product.sku || product.variant_sku || product.productCode || '-',
              quantity: product.quantity || product.qty || 0,
              price: product.price || product.unit_price || product.unitPrice || 0,
            });
          }
        });
      });
      
      const productsArray = Array.from(allProducts.values());
      
      const mainRow: any = {
        ...mainLog,
        statusDisplay: mainLog.status || "unknown",
        hasError: !!mainLog.errorMessage,
        orderId: orderId,
        products: productsArray, // Store products for display in main row
        requestCount: sortedLogs.length, // Store request count
        // Make it collapsible always
        collapsible: {
          collapsibleHeader: t("Webhook Requests for Order {{orderId}}", { orderId }),
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
                const offset = date.getTimezoneOffset();
                const adjustedDate = new Date(date.getTime() + offset * 60 * 1000);
                return (
                  <div>
                    <div>{formatAsLocalDate(row.createdAt)}</div>
                    <div className="text-xs text-gray-500">
                      {format(adjustedDate, "HH:mm:ss")}
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
      };
      
      result.push(mainRow);
    });
    
    return result;
  }, [groupedRows, t]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Order ID"), isSortable: true, correspondingKey: "orderId" },
      { key: t("Products"), isSortable: false, correspondingKey: "products" },
      { key: t("Requests"), isSortable: true, correspondingKey: "requestCount" },
      { key: t("Source"), isSortable: true, correspondingKey: "source" },
      { key: t("Endpoint"), isSortable: true, correspondingKey: "endpoint" },
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
        key: "orderId",
        className: "min-w-32",
        node: (row: any) => {
          return (
            <div className="font-medium text-blue-600">{row.orderId || "-"}</div>
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
                    <span className="text-gray-600 ml-2">x{product.quantity}</span>
                  )}
                  {product.price > 0 && (
                    <span className="text-gray-600 ml-2">
                      ({typeof product.price === 'number' ? product.price.toFixed(2) : product.price} ₺)
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
          return (
            <div className="font-medium text-center">
              {count}
            </div>
          );
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
      {
        key: "endpoint",
        className: "min-w-48 max-w-96 truncate",
        node: (row: WebhookLog) => {
          return (
            <div className="truncate" title={row.endpoint}>
              {row.endpoint || "-"}
            </div>
          );
        },
      },
    ],
    [t]
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
            checked={showWebhookLogsFilters}
            onChange={setShowWebhookLogsFilters}
          />
        ),
      },
    ],
    [t, showWebhookLogsFilters]
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

  // Effect to reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  if (isLoading) {
    return (
      <>
        <Header showLocationSelector={false} />
        <div className="w-[98%] mx-auto my-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500">{t("Loading")}...</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header showLocationSelector={false} />
        <div className="w-[98%] mx-auto my-10">
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">
              {t("Error loading webhook logs")}:{" "}
              {error instanceof Error ? error.message : String(error)}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header showLocationSelector={false} />
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
    </>
  );
}
