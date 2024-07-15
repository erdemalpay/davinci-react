import { useTranslation } from "react-i18next";
import { useUserContext } from "../../../context/User.context";
import OrderLists from "./OrderLists";
import OrderPaymentTypes from "./OrderPaymentTypes";
import OrderTotal from "./OrderTotal";

type Props = {};

const OrderPayment = (props: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  if (!user) return null;
  return (
    <div className="flex flex-col gap-4 border border-gray-200  rounded-lg __className_a182b8">
      {/* header& buttons */}
      <div className="flex flex-row justify-between items-center px-4 bg-blue-gray-50 rounded-t-lg py-1">
        {/* header */}
        <div className="flex flex-col gap-1  ">
          <h1 className="font-medium">
            <span className="font-semibold">{t("Table")}</span>: TableName
          </h1>
          <h1 className="font-medium">{user.name}</h1>
        </div>
      </div>
      {/* payment part */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-2 ">
        <OrderLists />
        <OrderTotal />
        <OrderPaymentTypes />
      </div>
    </div>
  );
};

export default OrderPayment;
