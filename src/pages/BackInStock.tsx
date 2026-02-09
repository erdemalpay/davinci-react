import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import {
  SubscriptionStatus,
  useGetBackInStockSubscriptions,
} from "../utils/api/backInStock";
import { formatAsLocalDate } from "../utils/format";

type FormElementsState = {
  [key: string]: any;
};

export default function BackInStock() {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      email: "",
      shop: "",
      productId: "",
      variantId: "",
      status: "",
      after: "",
      before: "",
      sort: "createdAt",
      asc: -1,
    });
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();

  const subscriptionsPayload = useGetBackInStockSubscriptions(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );

  const columns = useMemo(
    () => [
      { key: t("Email"), isSortable: true, correspondingKey: "email" },
      { key: t("Product"), isSortable: true, correspondingKey: "productTitle" },
      { key: t("Variant"), isSortable: true, correspondingKey: "variantTitle" },
      { key: t("Price"), isSortable: false },
      { key: t("Status"), isSortable: true, correspondingKey: "status" },
      {
        key: t("Subscribed At"),
        isSortable: true,
        correspondingKey: "subscribedAt",
      },
      { key: t("Shop"), isSortable: true, correspondingKey: "shop" },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "email",
        className: "min-w-48",
      },
      {
        key: "productTitle",
        className: "min-w-48",
      },
      {
        key: "variantTitle",
        className: "min-w-32",
      },
      {
        key: "variantPrice",
        className: "min-w-24",
      },
      {
        key: "status",
        className: "min-w-32",
        node: (row: any) => {
          const statusColors = {
            [SubscriptionStatus.ACTIVE]: "bg-green-500",
            [SubscriptionStatus.NOTIFIED]: "bg-blue-500",
            [SubscriptionStatus.CANCELLED]: "bg-red-500",
          };
          return (
            <span
              className={`${
                statusColors[row.status as SubscriptionStatus]
              } w-fit px-2 py-1 rounded-md text-white`}
            >
              {row.status}
            </span>
          );
        },
      },
      {
        key: "subscribedAt",
        className: "min-w-32",
        node: (row: any) => formatAsLocalDate(row.subscribedAt),
      },
      {
        key: "shop",
        className: "min-w-32",
      },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "email",
        label: t("Email"),
        placeholder: t("Email"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "shop",
        label: t("Shop"),
        placeholder: t("Shop"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "productId",
        label: t("Product ID"),
        placeholder: t("Product ID"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "variantId",
        label: t("Variant ID"),
        placeholder: t("Variant ID"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        placeholder: t("Status"),
        required: false,
        options: [
          { value: "", label: t("All") },
          { value: SubscriptionStatus.ACTIVE, label: t("Active") },
          { value: SubscriptionStatus.NOTIFIED, label: t("Notified") },
          { value: SubscriptionStatus.CANCELLED, label: t("Cancelled") },
        ],
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: false,
        isDatePicker: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: false,
        isDatePicker: true,
      },
    ],
    [t]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
    }),
    [showFilters, filterPanelInputs, filterPanelFormElements]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );

  const pagination = useMemo(() => {
    return subscriptionsPayload
      ? {
          totalPages: subscriptionsPayload.totalPages,
          totalRows: subscriptionsPayload.total,
        }
      : null;
  }, [subscriptionsPayload]);

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements]);

  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={subscriptionsPayload?.subscriptions || []}
        outsideSearchProps={outsideSearchProps}
        isSearch={false}
        title={t("Back In Stock Subscriptions")}
        filterPanel={filterPanel}
        filters={filters}
        isActionsActive={false}
        outsideSortProps={outsideSort}
        {...(pagination && { pagination })}
        isAllRowPerPageOption={false}
      />
    </div>
  );
}
