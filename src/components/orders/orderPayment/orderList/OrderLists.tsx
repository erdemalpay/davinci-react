import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useOrderContext } from "../../../../context/Order.context";
import { Order } from "../../../../types";
import {
  useCreateOrderForDiscountMutation,
  useCreateOrderForDivideMutation,
} from "../../../../utils/api/order/order";
import DiscountScreen from "./DiscountScreen";
import OrderSelect from "./OrderSelect";
import PaidOrders from "./PaidOrders";
import UnpaidOrders from "./UnpaidOrders";

type Props = {
  tableOrders: Order[];
  collectionsTotalAmount: number;
};
type OrderListButton = {
  label: string;
  onClick: () => void;
  isActive: boolean;
};
const OrderLists = ({ tableOrders, collectionsTotalAmount }: Props) => {
  const { t } = useTranslation();
  const { mutate: createOrderForDiscount } =
    useCreateOrderForDiscountMutation();
  const { mutate: createOrderForDivide } = useCreateOrderForDivideMutation();
  const {
    isProductSelectionOpen,
    setIsProductSelectionOpen,
    setIsDiscountScreenOpen,
    isDiscountScreenOpen,
    setTemporaryOrders,
    selectedDiscount,
    selectedOrders,
    resetOrderContext,
    isProductDivideOpen,
    setIsProductDivideOpen,
  } = useOrderContext();

  const discountAmount = tableOrders.reduce((acc, order) => {
    if (!order.discount) {
      return acc;
    }
    const discountValue =
      (order.unitPrice * order.quantity * (order.discountPercentage ?? 0)) /
      100;
    return acc + discountValue;
  }, 0);
  const totalAmount = tableOrders.reduce((acc, order) => {
    return acc + order.unitPrice * order.quantity;
  }, 0);
  const buttons: OrderListButton[] = [
    {
      label: t("Cancel"),
      onClick: () => {
        resetOrderContext();
      },
      isActive:
        isDiscountScreenOpen || isProductSelectionOpen || isProductDivideOpen,
    },
    {
      label: t("Back"),
      onClick: () => {
        setIsProductSelectionOpen(false);
      },
      isActive: isProductSelectionOpen,
    },
    {
      label: t("Product Divide"),
      onClick: () => {
        setTemporaryOrders([]);
        setIsProductDivideOpen(true);
      },
      isActive:
        !(isProductSelectionOpen || isDiscountScreenOpen) &&
        !isProductDivideOpen,
    },
    {
      label: t("Apply"),
      onClick: () => {
        if (
          selectedOrders.length === 0 ||
          (isProductSelectionOpen && !selectedDiscount)
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
            discountPercentage: selectedDiscount.percentage,
          });
        }
        resetOrderContext();
      },
      isActive: isProductSelectionOpen || isProductDivideOpen,
    },
  ];
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Total")}</h1>
        <p>{parseFloat(String(totalAmount - discountAmount)).toFixed(2)}₺</p>
      </div>
      {/* orders */}
      {!isProductDivideOpen &&
        !isProductSelectionOpen &&
        (isDiscountScreenOpen ? (
          <DiscountScreen tableOrders={tableOrders} />
        ) : (
          <UnpaidOrders
            tableOrders={tableOrders}
            collectionsTotalAmount={collectionsTotalAmount}
          />
        ))}
      {(isProductSelectionOpen || isProductDivideOpen) && (
        <OrderSelect tableOrders={tableOrders} />
      )}
      <PaidOrders tableOrders={tableOrders} />
      {/* buttons */}
      <div className="flex flex-row gap-2 justify-end ml-auto items-center">
        {buttons.map((button) => {
          if (button.isActive) {
            return (
              <button
                key={button.label}
                onClick={button.onClick}
                className=" w-fit ml-auto bg-gray-100 px-4 py-2 rounded-lg focus:outline-none  hover:bg-gray-200 text-red-300 hover:text-red-500 font-semibold "
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
