import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { IoMdCloseCircleOutline } from "react-icons/io";
import { toast } from "react-toastify";
import { useUserContext } from "../../../context/User.context";
import { OrderCollectionStatus, OrderStatus, Table } from "../../../types";
import { useGetGivenDateOrders } from "../../../utils/api/order/order";
import { useGetOrderCollections } from "../../../utils/api/order/orderCollection";
import { useCloseTableMutation } from "../../../utils/api/table";
import { ConfirmationDialog } from "../../common/ConfirmationDialog";
import OrderLists from "./orderList/OrderLists";
import OrderPaymentTypes from "./OrderPaymentTypes";
import OrderTotal from "./OrderTotal";

type Props = {
  close: () => void;
  table: Table;
};
type ButtonType = {
  label: string;
  onClick: () => void;
  isActive: boolean;
};
const OrderPaymentModal = ({ close, table }: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const [isCloseConfirmationDialogOpen, setIsCloseConfirmationDialogOpen] =
    useState(false);
  const orders = useGetGivenDateOrders();
  const collections = useGetOrderCollections();
  const { mutate: closeTable } = useCloseTableMutation();
  if (!user || !orders) return null;
  const tableOrders = orders.filter(
    (order) =>
      (order.table as Table)._id === table._id &&
      order.status !== OrderStatus.CANCELLED
  );
  const collectionsTotalAmount = Number(
    collections
      .filter((collection) => (collection.table as Table)._id === table._id)
      ?.reduce((acc, collection) => {
        if (collection.status === OrderCollectionStatus.CANCELLED) {
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
        setIsCloseConfirmationDialogOpen(true);
      },
      isActive: isAllItemsPaid ?? false,
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
                  tableOrders={tableOrders}
                  collectionsTotalAmount={collectionsTotalAmount}
                />
                <OrderTotal
                  tableOrders={tableOrders}
                  table={table}
                  collectionsTotalAmount={collectionsTotalAmount}
                />
                <OrderPaymentTypes
                  table={table}
                  tableOrders={tableOrders}
                  collectionsTotalAmount={collectionsTotalAmount}
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
