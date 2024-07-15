import { useTranslation } from "react-i18next";
import { FaHistory } from "react-icons/fa";
import { HiOutlineTrash } from "react-icons/hi2";
import { PiArrowsDownUpBold } from "react-icons/pi";
import Keypad from "./KeyPad";

type Props = {};

const OrderTotal = (props: Props) => {
  const { t } = useTranslation();
  const collections = [
    {
      _id: "1",
      paymentMethod: "Cash",
      amount: 40.0,
    },
    {
      _id: "2",
      paymentMethod: "Credit Card",
      amount: 80.0,
    },
  ];
  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4 __className_a182b8">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Total")}</h1>
        <div className="flex flex-row gap-2 justify-center items-center ">
          <div className="flex flex-row gap-1 text-sm justify-center items-center">
            <FaHistory className="text-red-600" />
            <p>{t("Collection History")}</p>
          </div>
          <p>0.00₺</p>
        </div>
      </div>
      {/* collections */}
      <div className="flex flex-col h-52 overflow-scroll no-scrollbar ">
        {collections.map((collection) => (
          <div
            key={collection._id}
            className="flex flex-row justify-between items-center border-b border-gray-200 pb-2 mt-1 px-4"
          >
            <div className="flex flex-row gap-2 justify-center items-center text-sm font-medium">
              <PiArrowsDownUpBold className="text-white text-xl bg-blue-gray-800 p-1 rounded-full " />
              <p>{t(collection.paymentMethod)}</p>
            </div>
            <div className="flex flex-row gap-2 justify-center items-center text-sm">
              <p>{collection.amount}₺</p>
              <HiOutlineTrash className="cursor-pointer hover:text-red-600 text-lg" />
            </div>
          </div>
        ))}
      </div>
      {/* keyPad */}
      <Keypad />
    </div>
  );
};

export default OrderTotal;
