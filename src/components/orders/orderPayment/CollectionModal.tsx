import { format } from "date-fns";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import {
  AccountPaymentMethod,
  OrderCollectionStatus,
  User,
} from "../../../types";
import { useGetOrderCollections } from "../../../utils/api/order/orderCollection";
import GenericTable from "../../panelComponents/Tables/GenericTable";

type Props = {
  orderCollections: number[];
  setIsCollectionModalOpen: (isOpen: boolean) => void;
};

const CollectionModal = ({
  orderCollections,
  setIsCollectionModalOpen,
}: Props) => {
  const collections = useGetOrderCollections();
  const { t } = useTranslation();
  if (!collections) {
    return null;
  }
  const rows = orderCollections.map((collectionId) => {
    const collection = collections.find((item) => item._id === collectionId);
    if (!collection) {
      return null;
    }
    return {
      _id: collection._id,
      cashier: (collection.createdBy as User).name,
      hour: format(collection.createdAt, "HH:mm"),
      paymentMethod: (collection.paymentMethod as AccountPaymentMethod).name,
      amount: collection.amount,
      status: collection.status,
    };
  });
  const columns = [
    { key: t("Cashier"), isSortable: true },
    { key: t("Hour"), isSortable: true },
    { key: t("Payment Method"), isSortable: true },
    { key: t("Amount"), isSortable: true },
    { key: t("Status"), isSortable: true },
  ];
  const rowKeys = [
    { key: "cashier" },
    { key: "hour" },
    {
      key: "paymentMethod",
      node: (row: any) => (
        <p key={row._id + "paymentMethod"}>{t(row.paymentMethod)}</p>
      ),
    },
    {
      key: "amount",
      node: (row: any) => <p key={row._id + "amount"}>{row.amount} ₺</p>,
    },
    {
      key: "status",
      node: (row: any) =>
        row.status === OrderCollectionStatus.PAID ? (
          <IoCheckmark className={`text-blue-500 text-2xl `} />
        ) : (
          <IoCloseOutline className={`text-red-800 text-2xl `} />
        ),
    },
  ];

  return (
    <div className="flex flex-col gap-2">
      {orderCollections.map((collectionId) => {
        const collection = collections.find(
          (item) => item._id === collectionId
        );
        if (!collection) {
          return null;
        }

        const filters = [
          {
            isUpperSide: false,
            node: (
              <button
                onClick={() => {
                  setIsCollectionModalOpen(false);
                }}
                className=" bg-gray-100 px-4 py-2 rounded-lg focus:outline-none  hover:bg-gray-200 text-red-300 hover:text-red-500 font-semibold "
              >
                {t("Back")}
              </button>
            ),
          },
        ];
        return (
          <div className="flex  flex-row  justify-start items-center absolute top-[3.8rem] left-0 right-0 bottom-0 bg-white shadow-lg p-2 gap-2  overflow-scroll no-scrollbar">
            <div className="w-[95%] mx-auto mb-auto ">
              <GenericTable
                title={t("Collection History")}
                columns={columns}
                rowKeys={rowKeys}
                rows={rows}
                isActionsActive={false}
                isSearch={false}
                filters={filters}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CollectionModal;
