import { useTranslation } from "react-i18next";
import bankTransfer from "../../../assets/order/bank_transfer.png";
import cash from "../../../assets/order/cash.png";
import creditCard from "../../../assets/order/credit_card.png";
import { useOrderContext } from "../../../context/Order.context";
import { useGetAccountPaymentMethods } from "../../../utils/api/account/paymentMethod";

type Props = {};

const OrderPaymentTypes = (props: Props) => {
  const { t } = useTranslation();
  const paymentTypes = useGetAccountPaymentMethods();
  const { setPaymentMethod } = useOrderContext();
  const paymentTypeImage = (paymentType: string) => {
    switch (paymentType) {
      case "cash":
        return cash;
      case "credit_card":
        return creditCard;
      case "bank_transfer":
        return bankTransfer;
      default:
        return cash;
    }
  };
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8 ">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Payment Types")}</h1>
      </div>
      {/* payment types */}
      <div className="grid grid-cols-3 gap-2">
        {paymentTypes?.map((paymentType) => (
          <div
            key={paymentType._id}
            onClick={() => setPaymentMethod(paymentType._id)}
            className="flex flex-col justify-center items-center border border-gray-200 p-2 rounded-md cursor-pointer hover:bg-gray-100 gap-2"
          >
            <img
              className="w-16 h-16"
              src={paymentTypeImage(paymentType._id)}
              alt={paymentType.name}
            />
            <p className="font-medium text-center">{t(paymentType.name)}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderPaymentTypes;
