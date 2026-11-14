import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { getTabSlug } from "../../utils/slug";
import { FormElementsState } from "../../types";
import {
  LoyaltyAccount,
  LoyaltyCoupon,
  LoyaltyCouponStatus,
  loyaltyCouponStatusLabels,
  LoyaltyTransaction,
  LoyaltyTransactionType,
  loyaltyTransactionTypeLabels,
  Paginated,
  useGetLoyaltyAccounts,
  useGetLoyaltyCoupons,
  useGetLoyaltyTransactions,
} from "../../utils/api/loyalty";
import GenericTable from "../panelComponents/Tables/GenericTable";
import {
  CouponStatusBadge,
  formatLoyaltyDate,
  PointChange,
  TransactionDetailCell,
  TransactionTypeCell,
} from "./loyaltyTableParts";

type AccountRef = { name?: string; email?: string; shopifyCustomerId: string };

const paginationOf = <T,>(payload?: Paginated<T>) =>
  payload
    ? { totalPages: payload.totalPages, totalRows: payload.totalNumber }
    : undefined;

function CustomerLink({ account }: { account: number | AccountRef | undefined }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setCurrentPage, setSearchQuery, setSortConfigKey } = useGeneralContext();
  if (!account || typeof account === "number") return <span>-</span>;
  return (
    <p
      className="text-blue-700 w-fit cursor-pointer hover:text-blue-500"
      onClick={() => {
        setCurrentPage(1);
        setSearchQuery("");
        setSortConfigKey(null);
        navigate(
          `/shopify-customer/${account.shopifyCustomerId}?tab=${getTabSlug(t("Online Points"))}`
        );
      }}
    >
      {account.name || account.email || account.shopifyCustomerId}
    </p>
  );
}

function SelectFilter<T extends string>({
  value,
  onChange,
  options,
  allLabel,
}: {
  value: T | "";
  onChange: (value: T | "") => void;
  options: Record<T, string>;
  allLabel: string;
}) {
  const { t } = useTranslation();
  return (
    <select
      className="border border-gray-300 rounded px-2 py-1 text-sm"
      value={value}
      onChange={(e) => onChange(e.target.value as T | "")}
    >
      <option value="">{allLabel}</option>
      {(Object.keys(options) as T[]).map((key) => (
        <option key={key} value={key}>
          {t(options[key])}
        </option>
      ))}
    </select>
  );
}

export function LoyaltyAccounts() {
  const { t } = useTranslation();
  const { currentPage, setCurrentPage, rowsPerPage } = useGeneralContext();
  const [filterFormElements, setFilterFormElements] =
    useState<FormElementsState>({ search: "" });
  const search = filterFormElements.search?.trim() ?? "";
  useEffect(() => setCurrentPage(1), [search, setCurrentPage]);
  const payload = useGetLoyaltyAccounts(currentPage, rowsPerPage, search);

  const columns = useMemo(
    () => [
      { key: t("Customer"), isSortable: false },
      { key: t("Email"), isSortable: false },
      { key: t("Balance"), isSortable: false },
      { key: t("Total Earned"), isSortable: false },
      { key: t("Turned into Coupons"), isSortable: false },
    ],
    [t]
  );
  const rowKeys = useMemo(
    () => [
      { key: "name", node: (row: LoyaltyAccount) => <CustomerLink account={row} /> },
      { key: "email" },
      { key: "balance" },
      { key: "totalEarned" },
      { key: "totalRedeemed" },
    ],
    []
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={t("Customers with Points")}
        columns={columns}
        rowKeys={rowKeys as any}
        rows={payload?.data ?? []}
        isActionsActive={false}
        isColumnFilter={false}
        isSearch={false}
        outsideSearchProps={{
          t,
          filterPanelFormElements: filterFormElements,
          setFilterPanelFormElements: setFilterFormElements,
        }}
        {...(paginationOf(payload) && { pagination: paginationOf(payload) })}
      />
    </div>
  );
}

export function LoyaltyTransactions() {
  const { t } = useTranslation();
  const { currentPage, setCurrentPage, rowsPerPage } = useGeneralContext();
  const [type, setType] = useState<LoyaltyTransactionType | "">("");
  useEffect(() => setCurrentPage(1), [type, setCurrentPage]);
  const payload = useGetLoyaltyTransactions(currentPage, rowsPerPage, type || undefined);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: false },
      { key: t("Customer"), isSortable: false },
      { key: t("Type"), isSortable: false },
      { key: t("Points"), isSortable: false },
      { key: t("Balance"), isSortable: false },
      { key: t("Details"), isSortable: false },
    ],
    [t]
  );
  const rowKeys = useMemo(
    () => [
      { key: "createdAt", node: (row: LoyaltyTransaction) => formatLoyaltyDate(row.createdAt) },
      { key: "account", node: (row: LoyaltyTransaction) => <CustomerLink account={row.account} /> },
      { key: "type", node: (row: LoyaltyTransaction) => <TransactionTypeCell row={row} /> },
      { key: "change", node: (row: LoyaltyTransaction) => <PointChange change={row.change} /> },
      { key: "balanceAfter" },
      { key: "note", node: (row: LoyaltyTransaction) => <TransactionDetailCell row={row} /> },
    ],
    []
  );
  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <SelectFilter
            value={type}
            onChange={setType}
            options={loyaltyTransactionTypeLabels}
            allLabel={t("All types")}
          />
        ),
      },
    ],
    [t, type]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={t("Point History")}
        columns={columns}
        rowKeys={rowKeys as any}
        rows={payload?.data ?? []}
        isActionsActive={false}
        isColumnFilter={false}
        isSearch={false}
        filters={filters}
        {...(paginationOf(payload) && { pagination: paginationOf(payload) })}
      />
    </div>
  );
}

export function LoyaltyCoupons() {
  const { t } = useTranslation();
  const { currentPage, setCurrentPage, rowsPerPage } = useGeneralContext();
  const [status, setStatus] = useState<LoyaltyCouponStatus | "">("");
  useEffect(() => setCurrentPage(1), [status, setCurrentPage]);
  const payload = useGetLoyaltyCoupons(currentPage, rowsPerPage, status || undefined);

  const columns = useMemo(
    () => [
      { key: t("Created At"), isSortable: false },
      { key: t("Customer"), isSortable: false },
      { key: t("Code"), isSortable: false },
      { key: t("Amount"), isSortable: false },
      { key: t("Status"), isSortable: false },
      { key: t("Expires"), isSortable: false },
      { key: t("Order"), isSortable: false },
    ],
    [t]
  );
  const rowKeys = useMemo(
    () => [
      { key: "createdAt", node: (row: LoyaltyCoupon) => formatLoyaltyDate(row.createdAt) },
      { key: "account", node: (row: LoyaltyCoupon) => <CustomerLink account={row.account} /> },
      { key: "code" },
      { key: "value", node: (row: LoyaltyCoupon) => `${row.value} ₺` },
      { key: "status", node: (row: LoyaltyCoupon) => <CouponStatusBadge row={row} /> },
      { key: "expiresAt", node: (row: LoyaltyCoupon) => formatLoyaltyDate(row.expiresAt) },
      { key: "usedOrderName", node: (row: LoyaltyCoupon) => row.usedOrderName ?? "-" },
    ],
    []
  );
  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <SelectFilter
            value={status}
            onChange={setStatus}
            options={loyaltyCouponStatusLabels}
            allLabel={t("All statuses")}
          />
        ),
      },
    ],
    [t, status]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={t("Coupons")}
        columns={columns}
        rowKeys={rowKeys as any}
        rows={payload?.data ?? []}
        isActionsActive={false}
        isColumnFilter={false}
        isSearch={false}
        filters={filters}
        {...(paginationOf(payload) && { pagination: paginationOf(payload) })}
      />
    </div>
  );
}
