import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShopifyAdminCustomer } from "../../types";
import {
  LoyaltyCoupon,
  LoyaltyTransaction,
  useAdjustLoyaltyPointsMutation,
  useGetLoyaltyAccountDetail,
} from "../../utils/api/loyalty";
import GenericTable from "../panelComponents/Tables/GenericTable";
import {
  CouponStatusBadge,
  formatLoyaltyDate,
  PointChange,
  StatCard,
  TransactionDetailCell,
  TransactionTypeCell,
} from "./loyaltyTableParts";

type Props = { customer?: ShopifyAdminCustomer };

// Online points of one Shopify customer, with a manual add/remove.
export default function ShopifyCustomerLoyalty({ customer }: Props) {
  const { t } = useTranslation();
  const customerId = customer?.id.split("/").pop();
  const detail = useGetLoyaltyAccountDetail(customerId);
  const { mutate: adjust, isPending } = useAdjustLoyaltyPointsMutation(customerId);
  const [change, setChange] = useState("");
  const [note, setNote] = useState("");

  const account = detail?.account;
  const parsedChange = Number(change);
  const canSubmit =
    !isPending &&
    Number.isInteger(parsedChange) &&
    parsedChange !== 0 &&
    note.trim().length > 0;

  const transactionColumns = useMemo(
    () => [
      { key: t("Date"), isSortable: false },
      { key: t("Type"), isSortable: false },
      { key: t("Points"), isSortable: false },
      { key: t("Balance"), isSortable: false },
      { key: t("Details"), isSortable: false },
    ],
    [t]
  );
  const transactionRowKeys = useMemo(
    () => [
      {
        key: "createdAt",
        node: (row: LoyaltyTransaction) => formatLoyaltyDate(row.createdAt),
      },
      { key: "type", node: (row: LoyaltyTransaction) => <TransactionTypeCell row={row} /> },
      { key: "change", node: (row: LoyaltyTransaction) => <PointChange change={row.change} /> },
      { key: "balanceAfter" },
      { key: "note", node: (row: LoyaltyTransaction) => <TransactionDetailCell row={row} /> },
    ],
    []
  );

  const couponColumns = useMemo(
    () => [
      { key: t("Code"), isSortable: false },
      { key: t("Amount"), isSortable: false },
      { key: t("Status"), isSortable: false },
      { key: t("Created At"), isSortable: false },
      { key: t("Expires"), isSortable: false },
      { key: t("Order"), isSortable: false },
    ],
    [t]
  );
  const couponRowKeys = useMemo(
    () => [
      { key: "code" },
      { key: "value", node: (row: LoyaltyCoupon) => `${row.value} ₺` },
      { key: "status", node: (row: LoyaltyCoupon) => <CouponStatusBadge row={row} /> },
      { key: "createdAt", node: (row: LoyaltyCoupon) => formatLoyaltyDate(row.createdAt) },
      { key: "expiresAt", node: (row: LoyaltyCoupon) => formatLoyaltyDate(row.expiresAt) },
      { key: "usedOrderName", node: (row: LoyaltyCoupon) => row.usedOrderName ?? "-" },
    ],
    []
  );

  if (!customerId) return null;

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label={t("Online Points Balance")} value={account?.balance ?? 0} hint={t("1 point = 1 ₺")} />
        <StatCard label={t("Total Earned")} value={account?.totalEarned ?? 0} />
        <StatCard label={t("Turned into Coupons")} value={account?.totalRedeemed ?? 0} />
      </div>

      <div className="border border-gray-200 rounded-md p-4 bg-white flex flex-col gap-3">
        <p className="font-medium text-gray-700">{t("Add or remove points")}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            step={1}
            className="border border-gray-300 rounded px-3 py-2 sm:w-40"
            placeholder={t("e.g. 50 or -50")}
            value={change}
            onChange={(e) => setChange(e.target.value)}
          />
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 flex-1"
            placeholder={t("Reason (required)")}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <button
            type="button"
            disabled={!canSubmit}
            className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-300"
            onClick={() =>
              adjust(
                { change: parsedChange, note: note.trim() },
                {
                  onSuccess: () => {
                    setChange("");
                    setNote("");
                  },
                }
              )
            }
          >
            {t("Save")}
          </button>
        </div>
      </div>

      <GenericTable
        title={t("Point History")}
        columns={transactionColumns}
        rowKeys={transactionRowKeys as any}
        rows={detail?.transactions ?? []}
        isActionsActive={false}
        isColumnFilter={false}
        isSearch={false}
      />
      <GenericTable
        title={t("Coupons")}
        columns={couponColumns}
        rowKeys={couponRowKeys as any}
        rows={detail?.coupons ?? []}
        isActionsActive={false}
        isColumnFilter={false}
        isSearch={false}
      />
    </div>
  );
}
