import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../../context/User.context";
import { Table } from "../../../types";
import { useGetOrderCollections } from "../../../utils/api/order/orderCollection";
import { useGetOrderPayments } from "../../../utils/api/order/orderPayment";
import OrderLists from "./OrderLists";
import OrderPaymentTypes from "./OrderPaymentTypes";
import OrderTotal from "./OrderTotal";

type Props = {
  close: () => void;
  table: Table;
};

const OrderPaymentModal = ({ close, table }: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const orderPayments = useGetOrderPayments();
  const [componentKey, setComponentKey] = useState(0);
  const currentOrderPayment = orderPayments?.find(
    (orderPayment) => (orderPayment.table as Table)?._id === table?._id
  );
  const collections = useGetOrderCollections();
  if (!user || !currentOrderPayment || !collections || !orderPayments)
    return null;

  return (
    <div
      id="popup"
      className="z-[99999] fixed w-full flex justify-center inset-0"
    >
      <div
        onClick={close}
        className="w-full h-full bg-gray-900 bg-opacity-50 z-0 absolute inset-0"
      />
      <div className="mx-auto container">
        <div className="flex items-center justify-center h-full w-full">
          <div className="bg-white rounded-md shadow fixed overflow-y-auto sm:h-auto w-10/12 lg:w-4/5">
            <div className="flex flex-col gap-4 border border-gray-200  rounded-lg pb-3 __className_a182b8">
              {/* header& buttons */}
              <div className="flex flex-row justify-between items-center px-4 bg-blue-gray-50 rounded-t-lg py-1">
                {/* header */}
                <div className="flex flex-col gap-1  ">
                  <h1 className="font-medium">
                    <span className="font-semibold">{t("Table")}</span>:
                    {table.name}
                  </h1>
                  <h1 className="font-medium">{user.name}</h1>
                </div>
              </div>
              {/* payment part */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-4 py-2 overflow-scroll no-scroll ">
                <OrderLists orderPayment={currentOrderPayment} />
                <OrderTotal orderPayment={currentOrderPayment} />
                <OrderPaymentTypes orderPayment={currentOrderPayment} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPaymentModal;
