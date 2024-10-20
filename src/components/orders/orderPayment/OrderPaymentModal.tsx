import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { toast } from "react-toastify";
import { useUserContext } from "../../../context/User.context";
import {
  Order,
  OrderCollection,
  OrderCollectionStatus,
  OrderStatus,
  Table,
  TURKISHLIRA,
} from "../../../types";

import { useIsMutating } from "@tanstack/react-query";
import {
  useCloseTableMutation,
  useReopenTableMutation,
} from "../../../utils/api/table";
import { ConfirmationDialog } from "../../common/ConfirmationDialog";
import OrderLists from "./orderList/OrderLists";
import OrderPaymentTypes from "./OrderPaymentTypes";
import OrderTotal from "./OrderTotal";

type Props = {
  close: () => void;
  table: Table;
  orders?: Order[];
  collections?: OrderCollection[];
  tables: Table[];
};
type ButtonType = {
  label: string;
  onClick: () => void;
  isActive: boolean;
};
const OrderPaymentModal = ({
  close,
  table,
  orders,
  collections,
  tables,
}: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const isMutating = useIsMutating();
  const { mutate: reopenTable } = useReopenTableMutation();
  const [isCloseConfirmationDialogOpen, setIsCloseConfirmationDialogOpen] =
    useState(false);
  const { mutate: closeTable } = useCloseTableMutation();
  if (!user || !orders || !collections) return null;
  const tableOrders = orders?.filter(
    (order) =>
      (order?.table as Table)?._id === table?._id &&
      order.status !== OrderStatus.CANCELLED
  );
  const collectionsTotalAmount = Number(
    collections
      .filter((collection) => (collection?.table as Table)?._id === table._id)
      ?.reduce((acc, collection) => {
        if (collection?.status === OrderCollectionStatus.CANCELLED) {
          return acc;
        }
        return acc + (collection?.amount ?? 0);
      }, 0)
  );
  const discountAmount = tableOrders.reduce((acc, order) => {
    if (!order.discount) {
      return acc;
    }
    const discountValue =
      (order.unitPrice * order.quantity * (order?.discountPercentage ?? 0)) /
        100 +
      (order?.discountAmount ?? 0) * order.quantity;
    return acc + discountValue;
  }, 0);
  const totalAmount = tableOrders.reduce((acc, order) => {
    return acc + order.unitPrice * order.quantity;
  }, 0);
  const isAllItemsPaid =
    tableOrders?.every((order) => order.paidQuantity === order.quantity) &&
    collectionsTotalAmount >= totalAmount - discountAmount;
  const buttons: ButtonType[] = [
    {
      label: t("Close Table"),
      onClick: () => {
        const refundAmount =
          collectionsTotalAmount - (totalAmount - discountAmount);
        if (refundAmount > 0) {
          toast.error(
            t("Please refund {{refundAmount}}{{TURKISHLIRA}}", {
              refundAmount,
              TURKISHLIRA,
            })
          );
          return;
        }
        setIsCloseConfirmationDialogOpen(true);
      },
      isActive: (isAllItemsPaid && !table?.finishHour) ?? false,
    },
    {
      label: t("Open Table"),
      onClick: () => {
        reopenTable({ id: table._id });
      },
      isActive: table?.finishHour ? true : false,
    },
  ];

  function finishTable() {
    closeTable({
      id: table._id,
      updates: { finishHour: format(new Date(), "HH:mm") },
    });
    setIsCloseConfirmationDialogOpen(false);
    toast.success(t("Table {{tableName}} closed", { tableName: table.name }));
  }
  return (
    <div
      id="popup"
      className="z-[99999] fixed w-full h-full inset-0 flex justify-center items-center"
    >
      <div
        onClick={close}
        className="w-full h-full bg-gray-900 bg-opacity-50 absolute inset-0"
      />
      {isMutating ? (
        <div className="fixed inset-0 w-full h-full z-50">
          -
          <div className="absolute inset-0 w-full h-full z-50 opacity-50 bg-black text-white">
            <div className="flex justify-center w-full h-full items-center">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <h1 className="text-2xl">Loading...</h1>
            </div>
          </div>
        </div>
      ) : null}
      <div className="relative w-6/7 lg:w-4/5 max-h-full overflow-y-auto">
        <div className="bg-white rounded-md shadow overflow-y-auto max-h-full">
          <div className="border border-gray-200 rounded-lg pb-3 __className_a182b8">
            <IoMdCloseCircleOutline
              className="absolute top-2 right-2 text-2xl text-red-300 hover:text-red-500 cursor-pointer "
              onClick={close}
            />
            <div className="flex flex-col gap-4 ">
              {/* header & buttons */}
              <div className="flex flex-row justify-between items-center px-4 bg-blue-gray-50 rounded-t-lg py-1">
                {/* header */}
                <div className="flex flex-col gap-1">
                  <h1 className="font-medium">
                    <span className="font-semibold">{t("Table")}</span>:{" "}
                    {table.name}
                  </h1>
                  <h1 className="font-medium">{user.name}</h1>
                </div>
                {/* buttons */}
                {buttons?.map((button) => {
                  if (button.isActive) {
                    return (
                      <button
                        key={button.label}
                        onClick={button.onClick}
                        className="w-fit ml-auto bg-gray-200 px-4 py-2 rounded-lg shadow-md focus:outline-none hover:bg-gray-300 text-red-300 hover:text-red-500 font-semibold mr-6"
                      >
                        {button.label}
                      </button>
                    );
                  }
                })}
              </div>
              {/* payment part */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-2">
                <OrderLists
                  table={table}
                  tableOrders={tableOrders}
                  collectionsTotalAmount={collectionsTotalAmount}
                  givenDateOrders={orders ?? []}
                  givenDateCollections={collections ?? []}
                  tables={tables}
                />
                <OrderTotal
                  tableOrders={tableOrders}
                  table={table}
                  collectionsTotalAmount={collectionsTotalAmount}
                  givenDateOrders={orders ?? []}
                  givenDateCollections={collections ?? []}
                />
                <OrderPaymentTypes
                  table={table}
                  tableOrders={tableOrders}
                  collectionsTotalAmount={collectionsTotalAmount}
                  givenDateOrders={orders ?? []}
                  givenDateCollections={collections ?? []}
                />
              </div>
            </div>
          </div>
          <ConfirmationDialog
            isOpen={isCloseConfirmationDialogOpen}
            close={() => {
              setIsCloseConfirmationDialogOpen(false);
            }}
            confirm={() => {
              finishTable();
              close();
            }}
            title={t("Close Table")}
            text={t("Table is being closed. Are you sure?")}
          />
        </div>
      </div>
    </div>
  );
};

export default OrderPaymentModal;
