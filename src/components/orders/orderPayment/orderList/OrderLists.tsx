import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useOrderContext } from "../../../../context/Order.context";
import { Order, Table } from "../../../../types";
import {
  useCreateOrderForDiscountMutation,
  useCreateOrderForDivideMutation,
  useSelectedOrderTransferMutation,
} from "../../../../utils/api/order/order";
import DiscountNoteScreen from "./DiscountNoteScreen";
import DiscountScreen from "./DiscountScreen";
import OrderSelect from "./OrderSelect";
import PaidOrders from "./PaidOrders";
import TransferTableScreen from "./TransferTableScreen";
import UnpaidOrders from "./UnpaidOrders";

type Props = {
  table: Table;
  tableOrders: Order[];
  collectionsTotalAmount: number;
  tables: Table[];
};
type OrderListButton = {
  label: string;
  onClick: () => void;
  isActive: boolean;
};
const OrderLists = ({
  tableOrders,
  collectionsTotalAmount,
  table,
  tables,
}: Props) => {
  const { t } = useTranslation();
  const { mutate: createOrderForDiscount } =
    useCreateOrderForDiscountMutation();
  const { mutate: createOrderForDivide } = useCreateOrderForDivideMutation();
  const { mutate: selectedOrderTransfer } = useSelectedOrderTransferMutation();
  const {
    setSelectedOrders,
    setDiscountNote,
    isDiscountNoteOpen,
    setIsDiscountNoteOpen,
    isProductSelectionOpen,
    setIsProductSelectionOpen,
    isDiscountScreenOpen,
    setTemporaryOrders,
    selectedDiscount,
    selectedOrders,
    resetOrderContext,
    isProductDivideOpen,
    setIsProductDivideOpen,
    setIsOrderDivisionActive,
    isOrderDivisionActive,
    discountNote,
    setIsTransferProductOpen,
    isTransferProductOpen,
    isTableSelectOpen,
    setIsTableSelectOpen,
    setSelectedTableTransfer,
    selectedTableTransfer,
  } = useOrderContext();

  const discountAmount = tableOrders?.reduce((acc, order) => {
    if (!order.discount) {
      return acc;
    }
    const discountValue =
      (order.unitPrice * order.quantity * (order?.discountPercentage ?? 0)) /
        100 +
      (order?.discountAmount ?? 0) * order.quantity;
    return acc + discountValue;
  }, 0);
  const totalAmount = tableOrders?.reduce((acc, order) => {
    return acc + order.unitPrice * order.quantity;
  }, 0);
  const mainActiveCase =
    !(
      isTransferProductOpen ||
      isProductSelectionOpen ||
      isDiscountScreenOpen ||
      isOrderDivisionActive
    ) && !isProductDivideOpen;
  const buttons: OrderListButton[] = [
    {
      label: isOrderDivisionActive ? t("Close") : t("Cancel"),
      onClick: () => {
        resetOrderContext();
      },
      isActive:
        isDiscountScreenOpen ||
        isProductSelectionOpen ||
        isProductDivideOpen ||
        isOrderDivisionActive,
    },
    {
      label: t("Back"),
      onClick: () => {
        if (isProductDivideOpen) {
          setIsProductSelectionOpen(false);
          setSelectedOrders([]);
          return;
        }
        if (isTransferProductOpen && !isTableSelectOpen) {
          setIsTransferProductOpen(false);
          setSelectedOrders([]);
          setIsProductSelectionOpen(false);
          return;
        }
        if (discountNote) {
          setIsDiscountNoteOpen(true);
        }
        if (isDiscountNoteOpen) {
          setDiscountNote("");
          setIsDiscountNoteOpen(false);
        }
        if (setIsProductSelectionOpen && isDiscountScreenOpen) {
          setIsProductSelectionOpen(false);
          setSelectedOrders([]);
        }
        if (isTableSelectOpen) {
          setIsTableSelectOpen(false);
          setSelectedTableTransfer(0);
          setIsProductSelectionOpen(true);
        }
      },
      isActive:
        isProductSelectionOpen || isDiscountNoteOpen || isTransferProductOpen,
    },
    {
      label: t("Forward"),
      onClick: () => {
        if (selectedOrders.length === 0) {
          toast.error("Please select an order");
          return;
        }
        setIsTableSelectOpen(true);
      },
      isActive: isTransferProductOpen && !isTableSelectOpen,
    },
    {
      label: t("Move Order"),
      onClick: () => {
        setTemporaryOrders([]);
        setIsProductSelectionOpen(true);
        setIsTransferProductOpen(true);
      },
      isActive: mainActiveCase,
    },
    {
      label: t("Product Divide"),
      onClick: () => {
        setTemporaryOrders([]);
        setIsProductDivideOpen(true);
      },
      isActive: mainActiveCase,
    },
    {
      label: t("Order Select"),
      onClick: () => {
        if (!discountNote) {
          toast.error(t("Please enter a discount note"));
          return;
        }
        setIsDiscountNoteOpen(false);
        setIsProductSelectionOpen(true);
      },
      isActive: isDiscountNoteOpen,
    },
    {
      label: t("Product Based 1/n"),
      onClick: () => {
        setTemporaryOrders([]);
        setIsOrderDivisionActive(true);
      },
      isActive: mainActiveCase,
    },
    {
      label: t("Apply"),
      onClick: () => {
        if (
          !isTableSelectOpen &&
          (selectedOrders.length === 0 ||
            (isProductSelectionOpen && !selectedDiscount))
        ) {
          toast.error("Please select an order");
          return;
        }
        if (isProductDivideOpen) {
          createOrderForDivide({
            orders: selectedOrders.map((selectedOrder) => {
              return {
                totalQuantity: selectedOrder.totalQuantity,
                selectedQuantity: selectedOrder.selectedQuantity,
                orderId: selectedOrder.order._id,
              };
            }),
          });
        } else if (isProductSelectionOpen && selectedDiscount) {
          createOrderForDiscount({
            orders: selectedOrders.map((selectedOrder) => {
              return {
                totalQuantity: selectedOrder.totalQuantity,
                selectedQuantity: selectedOrder.selectedQuantity,
                orderId: selectedOrder.order._id,
              };
            }),
            discount: selectedDiscount._id,
            ...(selectedDiscount.percentage && {
              discountPercentage: selectedDiscount.percentage,
            }),
            ...(selectedDiscount.amount && {
              discountAmount: selectedDiscount.amount,
            }),
            ...(discountNote && {
              discountNote: discountNote,
            }),
          });
        } else if (isTableSelectOpen) {
          if (selectedTableTransfer === 0) {
            toast.error("Please select a table");
            return;
          }
          selectedOrderTransfer({
            orders: selectedOrders.map((selectedOrder) => {
              return {
                totalQuantity: selectedOrder.totalQuantity,
                selectedQuantity: selectedOrder.selectedQuantity,
                orderId: selectedOrder.order._id,
              };
            }),
            transferredTableId: selectedTableTransfer,
          });
        }
        resetOrderContext();
      },
      isActive:
        (isProductSelectionOpen && !isTransferProductOpen) ||
        isProductDivideOpen ||
        isTableSelectOpen,
    },
  ];
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8  ">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <div className="flex flex-row gap-2">
          <h1>{t("Total")}</h1>
          <p>{parseFloat(String(totalAmount - discountAmount)).toFixed(2)}₺</p>
        </div>
        <div className="flex flex-row gap-2 text-red-300">
          <h1>{t("Not Paid")}</h1>
          <p>
            {parseFloat(
              String(totalAmount - discountAmount - collectionsTotalAmount)
            ).toFixed(2)}
            ₺
          </p>
        </div>
      </div>
      {/* orders */}
      {!isProductDivideOpen &&
        !isProductSelectionOpen &&
        !isDiscountNoteOpen &&
        (isDiscountScreenOpen ? (
          <DiscountScreen tableOrders={tableOrders} table={table} />
        ) : (
          <UnpaidOrders
            tableOrders={tableOrders}
            collectionsTotalAmount={collectionsTotalAmount}
          />
        ))}
      {((isProductSelectionOpen && !isTableSelectOpen) ||
        isProductDivideOpen) && <OrderSelect tableOrders={tableOrders} />}
      {isTableSelectOpen && (
        <TransferTableScreen tables={tables} table={table} />
      )}
      {isDiscountNoteOpen && <DiscountNoteScreen />}
      <PaidOrders tableOrders={tableOrders} />
      {/* buttons */}
      <div className="flex flex-row gap-2 justify-end ml-auto items-center mb-2">
        {buttons.map((button) => {
          if (button.isActive) {
            return (
              <button
                key={button.label}
                onClick={button.onClick}
                className="w-fit  bg-gray-200 px-2 sm:px-4 py-1 sm:py-2 rounded-lg shadow-md focus:outline-none hover:bg-gray-300 text-red-300 hover:text-red-500 font-semibold "
              >
                {button.label}
              </button>
            );
          }
        })}
      </div>
    </div>
  );
};

export default OrderLists;
