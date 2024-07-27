import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useOrderContext } from "../../../../context/Order.context";
import { OrderPayment } from "../../../../types";
import { useCreateOrderForDiscountMutation } from "../../../../utils/api/order/order";
import DiscountScreen from "./DiscountScreen";
import OrderSelect from "./OrderSelect";
import PaidOrders from "./PaidOrders";
import UnpaidOrders from "./UnpaidOrders";

type Props = {
  orderPayment: OrderPayment;
  collectionsTotalAmount: number;
};
type OrderListButton = {
  label: string;
  onClick: () => void;
  isActive: boolean;
};
const OrderLists = ({ orderPayment, collectionsTotalAmount }: Props) => {
  const { t } = useTranslation();
  const { mutate: createOrderForDiscount } =
    useCreateOrderForDiscountMutation();

  const {
    isProductSelectionOpen,
    setIsProductSelectionOpen,
    setIsDiscountScreenOpen,
    isDiscountScreenOpen,
    setTemporaryOrders,
    selectedDiscount,
    selectedOrders,
    resetOrderContext,
  } = useOrderContext();

  const buttons: OrderListButton[] = [
    {
      label: t("Cancel"),
      onClick: () => {
        resetOrderContext();
      },
      isActive: isDiscountScreenOpen || isProductSelectionOpen,
    },
    {
      label: t("Back"),
      onClick: () => {
        setIsProductSelectionOpen(false);
      },
      isActive: isProductSelectionOpen,
    },
    {
      label: t("Product Based Discount"),
      onClick: () => {
        setTemporaryOrders([]);
        setIsDiscountScreenOpen(true);
      },
      isActive: !(isProductSelectionOpen || isDiscountScreenOpen),
    },
    {
      label: t("Apply"),
      onClick: () => {
        if (
          selectedOrders.length === 0 ||
          selectedDiscount === null ||
          !selectedDiscount
        ) {
          toast.error("Please select an order to apply discount");
          return;
        }
        createOrderForDiscount({
          orders: selectedOrders.map((selectedOrder) => {
            return {
              totalQuantity: selectedOrder.totalQuantity,
              selectedQuantity: selectedOrder.selectedQuantity,
              orderId: selectedOrder.order._id,
            };
          }),
          orderPaymentId: orderPayment._id,
          discount: selectedDiscount._id,
          discountPercentage: selectedDiscount.percentage,
        });
        resetOrderContext();
      },
      isActive: isProductSelectionOpen,
    },
  ];
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Total")}</h1>
        <p>
          {parseFloat(
            String(orderPayment.totalAmount - orderPayment.discountAmount)
          ).toFixed(2)}
          ₺
        </p>
      </div>
      {/* orders */}
      {!isProductSelectionOpen &&
        (isDiscountScreenOpen ? (
          <DiscountScreen orderPayment={orderPayment} />
        ) : (
          <UnpaidOrders
            orderPayment={orderPayment}
            collectionsTotalAmount={collectionsTotalAmount}
          />
        ))}
      {isProductSelectionOpen && <OrderSelect orderPayment={orderPayment} />}
      <PaidOrders orderPayment={orderPayment} />
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
