import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { IoIosClose } from "react-icons/io";
import { MenuItem } from "../../types";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";

type Props = {
  isOpen: boolean;
  closeModal: () => void;
  items: MenuItem[];
  itemId?: number;
  orderForm?: any;
  setOrderForm?: (item: any) => void;
  setFormElements?: React.Dispatch<React.SetStateAction<any> | undefined>;
  formElements?: any;
};

const SuggestedDiscountModal = ({
  isOpen,
  closeModal,
  items,
  itemId,
  orderForm,
  setOrderForm,
  setFormElements,
  formElements,
}: Props) => {
  const discounts = useGetOrderDiscounts();
  const { t } = useTranslation();
  const selectedItem = useMemo(
    () => items.find((item) => item._id === itemId),
    [items, itemId]
  );
  const suggestedDiscountName = useMemo(() => {
    const id = (selectedItem as any)?.suggestedDiscount;
    const list =
      (discounts as any)?.data ??
      (Array.isArray(discounts) ? discounts : undefined);
    const match =
      Array.isArray(list) && id
        ? (list as any[]).find((d: any) => d?._id === id)
        : undefined;
    return (
      match?.name ??
      (selectedItem as any)?.suggestedDiscountName ??
      (selectedItem as any)?.suggestedDiscount?.name ??
      undefined
    );
  }, [selectedItem, discounts]);

  if (!isOpen) return null;

  return (
    <div
      key={itemId}
      className="
        bg-white rounded-2xl shadow-lg p-4
        md:rounded-l-none md:shadow-none
        overflow-scroll no-scrollbar
        w-full max-w-lg mx-auto
      "
    >
      <div className="flex items-center justify-between pb-2 mb-6 mt-4">
        <h2 className="text-lg font-semibold">{t("Suggested Discount")}</h2>
        <button
          onClick={closeModal}
          className="p-1 rounded hover:bg-gray-100"
          aria-label="Close"
        >
          <IoIosClose className="w-7 h-7" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl bg-gray-50 p-3">
          <div className="text-xs text-gray-500">{t("Item")}</div>
          <div className="text-base font-medium">
            {(selectedItem as any)?.name ?? "—"}
          </div>
        </div>

        <div className="rounded-xl bg-blue-50 p-3">
          <div className="text-xs text-blue-700">{t("Suggested Discount")}</div>
          <div className="text-base font-semibold text-blue-900">
            {suggestedDiscountName ?? t("No discount found")}
          </div>
        </div>

        <p className="text-sm text-gray-700">
          {t("Apply the suggested discount to this item?")}
        </p>
      </div>
      <div className="mt-4 flex items-center justify-end gap-3  pt-3">
        <button
          onClick={closeModal}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          {t("No")}
        </button>

        <button
          onClick={() => {
            if (!setOrderForm || !setFormElements) return;
            setOrderForm({
              ...orderForm,
              discount: (selectedItem as any)?.suggestedDiscount,
            });
            setFormElements({
              ...formElements,
              ["discount"]: (selectedItem as any)?.suggestedDiscount,
            });
            closeModal();
          }}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {t("Yes")}
        </button>
      </div>
    </div>
  );
};

export default SuggestedDiscountModal;
