import { Dialog, Transition } from "@headlessui/react";
import { FormEvent, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Order, OrderDiscount } from "../../../../types";
import { GenericButton } from "../../../common/GenericButton";
import {
  CustomDiscountValues,
  validateCustomDiscountValues,
} from "./customDiscount";

type Props = {
  isOpen: boolean;
  order: Order;
  itemName: string;
  discount: OrderDiscount;
  isPending: boolean;
  close: () => void;
  submit: (values: CustomDiscountValues) => void;
};

const CustomDiscountDialog = ({
  isOpen,
  order,
  itemName,
  discount,
  isPending,
  close,
  submit,
}: Props) => {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const maxQuantity = order.quantity - order.paidQuantity;

  useEffect(() => {
    if (!isOpen) return;
    setAmount("");
    setQuantity("1");
    setNote("");
    setError(null);
  }, [isOpen, order._id]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values: CustomDiscountValues = {
      totalDiscountAmount: amount.trim() === "" ? NaN : Number(amount),
      affectedQuantity: quantity.trim() === "" ? NaN : Number(quantity),
      note,
    };
    const validationError = validateCustomDiscountValues(values, {
      maxQuantity,
      unitPrice: order.unitPrice,
      noteRequired: Boolean(discount.isNoteRequired),
    });

    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    submit(values);
  };

  return (
    <Transition
      show={isOpen}
      enter="transition duration-100 ease-out"
      enterFrom="transform scale-95 opacity-0"
      enterTo="transform scale-100 opacity-100"
      leave="transition duration-75 ease-out"
      leaveFrom="transform scale-100 opacity-100"
      leaveTo="transform scale-95 opacity-0"
    >
      <Dialog onClose={close}>
        <Dialog.Overlay />
        <div className="z-[99999] fixed w-full flex justify-center inset-0">
          <div
            onClick={close}
            className="w-full h-full bg-gray-900 bg-opacity-50 z-0 absolute inset-0"
          />
          <div className="mx-auto container">
            <div className="flex items-center justify-center h-full w-full">
              <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 lg:w-2/5">
                <Dialog.Title className="bg-gray-100 rounded-t-md px-4 md:px-8 md:py-4 py-7 text-base font-semibold">
                  {t("Apply Custom Discount")}
                </Dialog.Title>
                <form className="p-6" onSubmit={handleSubmit}>
                  <div className="mb-5">
                    <p className="font-medium">{itemName}</p>
                    <p className="text-sm text-gray-600">
                      {t("Remaining quantity")}: {maxQuantity}
                    </p>
                  </div>

                  <div className="flex flex-col gap-4">
                    <label className="flex flex-col gap-1" htmlFor="custom-discount-amount">
                      <span>{t("Total Discount Amount")}</span>
                      <input
                        id="custom-discount-amount"
                        type="number"
                        min="0"
                        step="any"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2"
                      />
                    </label>

                    <label className="flex flex-col gap-1" htmlFor="custom-discount-quantity">
                      <span>{t("Affected Quantity")}</span>
                      <input
                        id="custom-discount-quantity"
                        type="number"
                        min="1"
                        max={maxQuantity}
                        step="1"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2"
                      />
                    </label>

                    {discount.isNoteRequired && (
                      <label className="flex flex-col gap-1" htmlFor="custom-discount-note">
                        <span>{t("Discount Note")}</span>
                        <textarea
                          id="custom-discount-note"
                          value={note}
                          onChange={(event) => setNote(event.target.value)}
                          className="rounded-md border border-gray-300 px-3 py-2"
                        />
                      </label>
                    )}
                  </div>

                  {error && (
                    <p className="mt-4 text-sm text-red-600" role="alert">
                      {t(error)}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-6">
                    <GenericButton onClick={close} variant="danger" size="sm">
                      {t("Cancel")}
                    </GenericButton>
                    <GenericButton
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isPending}
                      isLoading={isPending}
                      aria-label={t("Apply")}
                    >
                      {t("Apply")}
                    </GenericButton>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default CustomDiscountDialog;
