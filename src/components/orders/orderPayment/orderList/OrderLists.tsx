import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../../../context/Order.context";
import { OrderPayment } from "../../../../types";
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
  const {
    isProductSelectionOpen,
    setIsProductSelectionOpen,
    setIsDiscountScreenOpen,
    isDiscountScreenOpen,
    setTemporaryOrders,
  } = useOrderContext();

  const buttons: OrderListButton[] = [
    {
      label: t("Cancel"),
      onClick: () => {
        setIsProductSelectionOpen(false);
        setIsDiscountScreenOpen(false);
      },
      isActive: isProductSelectionOpen,
    },
    {
      label: t("Back"),
      onClick: () => {
        setIsDiscountScreenOpen(false);
      },
      isActive: isDiscountScreenOpen,
    },
    {
      label: t("Discounts"),
      onClick: () => {
        setIsDiscountScreenOpen(true);
      },
      isActive: isProductSelectionOpen,
    },
    {
      label: t("Product Based Discount"),
      onClick: () => {
        setTemporaryOrders([]);
        setIsProductSelectionOpen(true);
      },
      isActive: !isProductSelectionOpen,
    },
  ];
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Total")}</h1>
        <p>{parseFloat(String(orderPayment.totalAmount)).toFixed(2)}₺</p>
      </div>
      {/* orders */}
      {!isDiscountScreenOpen &&
        (isProductSelectionOpen ? (
          <OrderSelect orderPayment={orderPayment} />
        ) : (
          <UnpaidOrders
            orderPayment={orderPayment}
            collectionsTotalAmount={collectionsTotalAmount}
          />
        ))}
      {isDiscountScreenOpen && <DiscountScreen />}
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
