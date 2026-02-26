import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { PointHistory, pointHistoryStatuses, PointHistoryStatusEnum, Table } from "../../types";
import { useGetConsumersWithFullNames } from "../../utils/api/consumer";
import { useGetSellLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetOrders } from "../../utils/api/order/order";
import { useGetCollectionByTableId } from "../../utils/api/order/orderCollection";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetPointHistories } from "../../utils/api/pointHistory";
import { useGetUsersMinimal } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const UsersPointHistoryComponent = () => {
  const { t } = useTranslation();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const {
    filterPointHistoryPanelFormElements,
    setFilterPointHistoryPanelFormElements,
    showPointHistoryFilters,
    setShowPointHistoryFilters,
  } = useFilterContext();
  const pointHistoriesPayload = useGetPointHistories(currentPage, rowsPerPage, {
    ...filterPointHistoryPanelFormElements,
    pointConsumer: -1,
  });
  const users = useGetUsersMinimal();
  const consumers = useGetConsumersWithFullNames();
  const pad = useMemo(() => (num: number) => num < 10 ? `0${num}` : num, []);

  // Modal states for collection details
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [selectedTableId, setSelectedTableId] = useState<number | undefined>(undefined);

  // Additional data for modal
  const sellLocations = useGetSellLocations();
  const paymentMethods = useGetAccountPaymentMethods();
  const orders = useGetOrders();
  const items = useGetMenuItems();
  const collectionDataRaw = useGetCollectionByTableId(selectedTableId);
  // API returns array, take first element
  const collectionData = Array.isArray(collectionDataRaw) ? collectionDataRaw[0] : collectionDataRaw;

  const rows = useMemo(() => {
    return pointHistoriesPayload?.data
      ?.map((pointHistory) => {
        if (!pointHistory?.createdAt) {
          return null;
        }
        const date = new Date(pointHistory.createdAt);
        return {
          ...pointHistory,
          usr: pointHistory?.pointUser?.name || "",
          consumer: pointHistory?.pointConsumer?.fullName || "",
          createdByUser: pointHistory?.createdBy?.name,
          oldAmount: parseFloat(
            (
              (pointHistory?.currentAmount ?? 0) -
              (pointHistory?.change ?? 0)
            ).toFixed(2)
          ),
          change: parseFloat((pointHistory?.change ?? 0).toFixed(2)),
          currentAmount: parseFloat(
            (pointHistory?.currentAmount ?? 0).toFixed(2)
          ),
          date: format(pointHistory?.createdAt, "yyyy-MM-dd"),
          formattedDate: formatAsLocalDate(
            format(pointHistory?.createdAt, "yyyy-MM-dd")
          ),
          hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
        };
      })
      .filter((item) => item !== null);
  }, [pointHistoriesPayload, pad]);

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "pointUser",
        label: t("Point User"),
        options: users.map((user) => {
          return {
            value: user._id,
            label: user.name,
          };
        }),
        placeholder: t("Point User"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: pointHistoryStatuses?.map((item) => {
          return {
            value: item.value,
            label: t(item.label),
          };
        }),
        placeholder: t("Status"),
        isMultiple: true,
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
      },
    ],
    [users, t, consumers]
  );

  const columns = useMemo(
    () => [
      {
        key: t("Date"),
        isSortable: false,
        correspondingKey: "createdAt",
      },
      { key: t("Hour"), isSortable: false },
      {
        key: t("Point User"),
        isSortable: false,
        correspondingKey: "pointUser",
      },
      {
        key: t("Created By"),
        isSortable: false,
        correspondingKey: "createdBy",
      },
      { key: t("Collection ID"), isSortable: false },
      { key: t("Table ID"), isSortable: false },
      { key: t("Old Amount"), isSortable: false },
      { key: t("Change"), isSortable: false },
      { key: t("Current Amount"), isSortable: false },
      {
        key: t("Status"),
        isSortable: false,
        correspondingKey: "status",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "date",
        className: "min-w-32 pr-1",
        node: (row: any) => {
          return <p>{row.formattedDate}</p>;
        },
      },
      {
        key: "hour",
        className: "min-w-32 pr-1",
      },
      {
        key: "usr",
        className: "min-w-32 pr-1",
      },
      {
        key: "createdByUser",
        className: "min-w-32 pr-1",
      },
      {
        key: "collectionId",
        className: "min-w-32 pr-1",
        node: (row: PointHistory) => {
          const isCollectionStatus =
            row.status === PointHistoryStatusEnum.COLLECTIONCREATED ||
            row.status === PointHistoryStatusEnum.COLLECTIONCANCELLED;
          if (!isCollectionStatus || !row.collectionId) return <p></p>;
          const hasTableId = row.tableId != null;
          return (
            <p
              className={`text-blue-500 underline w-fit ${hasTableId ? "cursor-pointer hover:text-blue-700" : "opacity-50 pointer-events-none"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (hasTableId) {
                  setSelectedTableId(row.tableId);
                  setIsCollectionModalOpen(true);
                }
              }}
            >
              {row.collectionId}
            </p>
          );
        }
      },
      {
        key: "tableId",
        className: "min-w-32 pr-1",
      },
      {
        key: "oldAmount",
        className: "min-w-32 pr-1",
      },
      {
        key: "change",
        className: "min-w-32 pr-1",
      },
      {
        key: "currentAmount",
        className: "min-w-32 pr-1",
      },
      {
        key: "status",
        className: "min-w-32 pr-1",
        node: (row: any) => {
          const status = pointHistoryStatuses.find(
            (item) => item.value === row.status
          );
          if (!status) return null;

          return (
            <div
              className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${status?.backgroundColor} text-white`}
            >
              {t(status?.label)}
            </div>
          );
        },
      },
    ],
    [t, setSelectedTableId, setIsCollectionModalOpen]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showPointHistoryFilters}
            onChange={() => {
              setShowPointHistoryFilters(!showPointHistoryFilters);
            }}
          />
        ),
      },
    ],
    [t, showPointHistoryFilters, setShowPointHistoryFilters]
  );

  const pagination = useMemo(() => {
    return pointHistoriesPayload
      ? {
          totalPages: pointHistoriesPayload.totalPages,
          totalRows: pointHistoriesPayload.totalNumber,
        }
      : null;
  }, [pointHistoriesPayload]);

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showPointHistoryFilters,
      inputs: filterPanelInputs,
      formElements: filterPointHistoryPanelFormElements,
      setFormElements: setFilterPointHistoryPanelFormElements,
      closeFilters: () => setShowPointHistoryFilters(false),
    }),
    [
      showPointHistoryFilters,
      filterPanelInputs,
      filterPointHistoryPanelFormElements,
      setFilterPointHistoryPanelFormElements,
      setShowPointHistoryFilters,
    ]
  );

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterPointHistoryPanelFormElements,
      setFilterPanelFormElements: setFilterPointHistoryPanelFormElements,
    };
  }, [
    t,
    filterPointHistoryPanelFormElements,
    setFilterPointHistoryPanelFormElements,
  ]);

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPointHistoryPanelFormElements,
      setFilterPanelFormElements: setFilterPointHistoryPanelFormElements,
    }),
    [
      filterPointHistoryPanelFormElements,
      setFilterPointHistoryPanelFormElements,
    ]
  );

  useMemo(() => {
    setCurrentPage(1);
  }, [filterPointHistoryPanelFormElements, setCurrentPage]);

  // Format collection data for modal display (similar to Collections.tsx)
  const formattedCollectionData = useMemo(() => {
    if (!collectionData || !collectionData.createdAt || !collectionData.tableDate) {
      return null;
    }

    const paymentMethod = paymentMethods.find(
      (method) => method._id === collectionData.paymentMethod
    );
    const zonedTime = toZonedTime(collectionData.tableDate, "UTC");
    const collectionDate = new Date(zonedTime);
    const istanbulTime = toZonedTime(collectionData.createdAt, "Europe/Istanbul");

    return {
      date: formatAsLocalDate(format(collectionDate, "yyyy-MM-dd")),
      tableId: (collectionData.table as Table)?._id,
      tableName: (collectionData.table as Table)?.name,
      hour: format(istanbulTime, "HH:mm"),
      locationName: getItem(collectionData.location, sellLocations)?.name,
      cashier: getItem(collectionData.createdBy, users)?.name,
      paymentMethod: paymentMethod ? t(paymentMethod.name) : "",
      amount: collectionData.amount,
      shopifyShippingAmount: collectionData.shopifyShippingAmount,
      shopifyDiscountAmount: collectionData.shopifyDiscountAmount,
      cancelledBy: getItem(collectionData.cancelledBy, users)?.name,
      cancelledAt: collectionData.cancelledAt
        ? format(collectionData.cancelledAt, "HH:mm")
        : "",
      cancelNote: collectionData.cancelNote,
      status: collectionData.status,
      orders:
        collectionData.orders?.map((orderCollectionItem: any) => ({
          product: getItem(
            orders?.find((order) => order._id === orderCollectionItem.order)?.item,
            items
          )?.name || "-",
          quantity: orderCollectionItem.paidQuantity ?? 0,
        })) || [],
    };
  }, [
    collectionData,
    paymentMethods,
    sellLocations,
    users,
    orders,
    items,
    t,
  ]);

  return (
    <>
      <div className="w-[95%] mx-auto">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows ?? []}
          filterPanel={filterPanel}
          filters={filters}
          isSearch={false}
          title={t("Users Point History")}
          isActionsActive={false}
          outsideSortProps={outsideSort}
          outsideSearchProps={outsideSearchProps}
          {...(pagination && { pagination })}
          isAllRowPerPageOption={false}
        />
      </div>

      {/* Collection Details Modal */}
      {isCollectionModalOpen && formattedCollectionData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
          onClick={() => {
            setIsCollectionModalOpen(false);
            setSelectedTableId(undefined);
          }}
        >
          <div
            className="bg-white rounded-lg w-11/12 md:w-3/4 lg:w-3/5 xl:w-2/5 max-w-3xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 flex-1 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4">{t("Collection Details")}</h3>

              {/* Collection Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Date")}</label>
                  <p className="text-sm text-gray-900">{formattedCollectionData.date}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Create Hour")}</label>
                  <p className="text-sm text-gray-900">{formattedCollectionData.hour}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Table Id")}</label>
                  <p className="text-sm text-gray-900">{formattedCollectionData.tableId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Table Name")}</label>
                  <p className="text-sm text-gray-900">{formattedCollectionData.tableName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Location")}</label>
                  <p className="text-sm text-gray-900">{formattedCollectionData.locationName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Created By")}</label>
                  <p className="text-sm text-gray-900">{formattedCollectionData.cashier}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Amount")}</label>
                  <p className="text-sm text-gray-900">{formattedCollectionData.amount?.toFixed(2)} ₺</p>
                </div>
                {formattedCollectionData.shopifyShippingAmount !== undefined && formattedCollectionData.shopifyShippingAmount !== null && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t("Shipping Cost")}</label>
                    <p className="text-sm text-gray-900">{formattedCollectionData.shopifyShippingAmount?.toFixed(2)} ₺</p>
                  </div>
                )}
                {formattedCollectionData.shopifyDiscountAmount !== undefined && formattedCollectionData.shopifyDiscountAmount !== null && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t("Discount")}</label>
                    <p className="text-sm text-gray-900">{formattedCollectionData.shopifyDiscountAmount?.toFixed(2)} ₺</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-gray-700">{t("Status")}</label>
                  <p className="text-sm text-gray-900">{t(formattedCollectionData.status)}</p>
                </div>
                {formattedCollectionData.cancelledBy && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t("Cancelled By")}</label>
                    <p className="text-sm text-gray-900">{formattedCollectionData.cancelledBy}</p>
                  </div>
                )}
                {formattedCollectionData.cancelledAt && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">{t("Cancelled At")}</label>
                    <p className="text-sm text-gray-900">{formattedCollectionData.cancelledAt}</p>
                  </div>
                )}
                {formattedCollectionData.cancelNote && (
                  <div className="col-span-2">
                    <label className="text-sm font-medium text-gray-700">{t("Cancel Note")}</label>
                    <p className="text-sm text-gray-900">{formattedCollectionData.cancelNote}</p>
                  </div>
                )}
              </div>

              {/* Orders Table */}
              {formattedCollectionData.orders && formattedCollectionData.orders.length > 0 && (
                <div className="border-t pt-4">
                  <h4 className="text-md font-semibold mb-3">{t("Orders")}</h4>
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("Product")}
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t("Quantity")}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {formattedCollectionData.orders.map((order: any, index: number) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{order.product}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{order.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer with Close button on the right */}
            <div className="px-6 py-4 border-t flex justify-end">
              <button
                onClick={() => {
                  setIsCollectionModalOpen(false);
                  setSelectedTableId(undefined);
                }}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
              >
                {t("Close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UsersPointHistoryComponent;
