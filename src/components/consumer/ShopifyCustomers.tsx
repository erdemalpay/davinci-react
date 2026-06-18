import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { FormElementsState, RowPerPageEnum, ShopifyAdminCustomer } from "../../types";
import {
  useGetShopifyCustomers,
  useRefreshShopifyCustomersMutation,
} from "../../utils/api/shopify";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";

const ShopifyCustomers = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentPage, setCurrentPage, rowsPerPage, setRowsPerPage, setSearchQuery, setSortConfigKey } = useGeneralContext();
  const [filterFormElements, setFilterFormElements] =
    useState<FormElementsState>({ search: "" });
  const { mutate: refreshCache, isPending: isRefreshing } =
    useRefreshShopifyCustomersMutation();

  const search = filterFormElements.search?.trim() || undefined;

  useEffect(() => {
    const prev = rowsPerPage;
    if (rowsPerPage > RowPerPageEnum.THIRD) {
      setRowsPerPage(RowPerPageEnum.THIRD);
    }
    return () => {
      setRowsPerPage(prev);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, setCurrentPage]);

  const safeLimit = rowsPerPage > RowPerPageEnum.THIRD ? RowPerPageEnum.THIRD : rowsPerPage;
  const payload = useGetShopifyCustomers(currentPage, safeLimit, search);

  const rows = useMemo(() => {
    if (!payload?.data) return [];
    return payload.data;
  }, [payload]);

  const pagination = useMemo(
    () =>
      payload
        ? { totalPages: payload.totalPages, totalRows: payload.totalCount }
        : undefined,
    [payload]
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: false },
      { key: t("Orders"), isSortable: false },
      { key: t("Total Spent"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "firstName",
        node: (row: ShopifyAdminCustomer) => (
          <p
            className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              setCurrentPage(1);
              setSearchQuery("");
              setSortConfigKey(null);
              navigate(`/shopify-customer/${row.id.split("/").pop()}`, { state: { customer: row } });
            }}
          >
            {[row.firstName, row.lastName].filter(Boolean).join(" ") || "-"}
          </p>
        ),
      },
      {
        key: "numberOfOrders",
        node: (row: ShopifyAdminCustomer) =>
          new Set(row.orders.map((o) => o.shopifyOrderNumber).filter(Boolean)).size,
      },
      {
        key: "amountSpent",
        node: (row: ShopifyAdminCustomer) =>
          `${parseFloat(row.amountSpent?.amount ?? "0").toFixed(2)} ${row.amountSpent?.currencyCode ?? ""}`,
      },
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <ButtonFilter
            buttonName={isRefreshing ? t("Refreshing...") : t("Refresh Data")}
            onclick={() => refreshCache()}
          />
        ),
      },
    ],
    [t, refreshCache, isRefreshing]
  );

  return (
    <div className="w-[95%] mx-auto">
      <p className="text-base text-gray-500 italic mb-2">
        * {t("Due to Shopify API rate limits, data may not load immediately. If the table appears empty, please wait a moment and try again.")}
      </p>
      <GenericTable
        title={t("Shopify Customers")}
        columns={columns}
        rowKeys={rowKeys as any}
        rows={rows}
        isActionsActive={false}
        filters={filters}
        rowsPerPageOptions={[RowPerPageEnum.FIRST, RowPerPageEnum.SECOND, RowPerPageEnum.THIRD]}
        isSearch={false}
        outsideSearchProps={{
          t,
          filterPanelFormElements: filterFormElements,
          setFilterPanelFormElements: setFilterFormElements,
        }}
        {...(pagination && { pagination })}
      />
    </div>
  );
};

export default ShopifyCustomers;
