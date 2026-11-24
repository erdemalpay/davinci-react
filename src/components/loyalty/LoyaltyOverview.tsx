import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  LoyaltyCouponStatus,
  LoyaltyTransactionType,
  useGetLoyaltySettings,
  useGetLoyaltySummary,
  useUpdateLoyaltySettingsMutation,
} from "../../utils/api/loyalty";
import { formatLoyaltyDate, StatCard } from "./loyaltyTableParts";

type SettingsForm = {
  isActive: boolean;
  earnRate: string;
  couponValidityDays: string;
  minRedeemPoints: string;
};

// Program totals and the settings (rate, coupon validity, minimum to redeem).
export default function LoyaltyOverview() {
  const { t } = useTranslation();
  const summary = useGetLoyaltySummary();
  const settings = useGetLoyaltySettings();
  const { mutate: updateSettings, isPending } =
    useUpdateLoyaltySettingsMutation();
  const [form, setForm] = useState<SettingsForm | null>(null);

  useEffect(() => {
    if (!settings) return;
    setForm({
      isActive: settings.isActive,
      earnRate: String(settings.earnRate),
      couponValidityDays: String(settings.couponValidityDays),
      minRedeemPoints: String(settings.minRedeemPoints),
    });
  }, [settings]);

  const month = summary?.thisMonth ?? {};
  const coupons = summary?.coupons ?? {};
  const monthEarned =
    (month[LoyaltyTransactionType.EARN]?.points ?? 0) +
    (month[LoyaltyTransactionType.EARN_REVERSAL]?.points ?? 0);
  const monthRedeemed = -(month[LoyaltyTransactionType.REDEEM]?.points ?? 0);

  const numberField = (
    key: "earnRate" | "couponValidityDays" | "minRedeemPoints",
    label: string,
    hint: string,
    step: string
  ) => (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-gray-700">{label}</span>
      <input
        type="number"
        step={step}
        min={0}
        className="border border-gray-300 rounded px-3 py-2"
        value={form?.[key] ?? ""}
        onChange={(e) =>
          setForm((prev) => (prev ? { ...prev, [key]: e.target.value } : prev))
        }
      />
      <span className="text-xs text-gray-400">{hint}</span>
    </label>
  );

  return (
    <div className="w-[95%] mx-auto flex flex-col gap-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t("Unused Points")}
          value={`${summary?.outstandingPoints ?? 0} ₺`}
          hint={t("What the points customers hold are worth")}
        />
        <StatCard
          label={t("Customers with Points")}
          value={summary?.accountCount ?? 0}
        />
        <StatCard
          label={t("Earned This Month")}
          value={monthEarned}
          hint={t("After refunds and cancellations")}
        />
        <StatCard label={t("Turned into Coupons This Month")} value={monthRedeemed} />
        <StatCard
          label={t("Active Coupons")}
          value={coupons[LoyaltyCouponStatus.ACTIVE]?.count ?? 0}
          hint={`${coupons[LoyaltyCouponStatus.ACTIVE]?.value ?? 0} ₺`}
        />
        <StatCard
          label={t("Used Coupons")}
          value={coupons[LoyaltyCouponStatus.USED]?.count ?? 0}
          hint={`${coupons[LoyaltyCouponStatus.USED]?.value ?? 0} ₺`}
        />
        <StatCard
          label={t("Expired Coupons")}
          value={coupons[LoyaltyCouponStatus.EXPIRED]?.count ?? 0}
          hint={`${coupons[LoyaltyCouponStatus.EXPIRED]?.value ?? 0} ₺`}
        />
        <StatCard label={t("Total Earned")} value={summary?.totalEarned ?? 0} />
      </div>

      {form && (
        <div className="border border-gray-200 rounded-md p-4 bg-white flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-700">{t("Program Settings")}</p>
            {settings?.updatedAt && (
              <p className="text-xs text-gray-400">
                {t("Last change")}: {formatLoyaltyDate(settings.updatedAt)}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((prev) =>
                  prev ? { ...prev, isActive: e.target.checked } : prev
                )
              }
            />
            <span className="text-sm text-gray-700">
              {t("Program is on (points are earned and coupons can be created)")}
            </span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {numberField(
              "earnRate",
              t("Earn rate (%)"),
              t("Of the order after discounts, without shipping. Applies to orders fulfilled from now on."),
              "0.1"
            )}
            {numberField(
              "couponValidityDays",
              t("Coupon validity (days)"),
              t("Unused points of an expired coupon are not given back."),
              "1"
            )}
            {numberField(
              "minRedeemPoints",
              t("Minimum points for a coupon"),
              t("1 point = 1 ₺ off."),
              "1"
            )}
          </div>
          <div>
            <button
              type="button"
              disabled={isPending}
              className="px-4 py-2 rounded bg-blue-600 text-white disabled:bg-gray-300"
              onClick={() =>
                updateSettings({
                  isActive: form.isActive,
                  earnRate: Number(form.earnRate),
                  couponValidityDays: Number(form.couponValidityDays),
                  minRedeemPoints: Number(form.minRedeemPoints),
                })
              }
            >
              {t("Save")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
