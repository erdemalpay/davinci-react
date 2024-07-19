import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useUserContext } from "../../../context/User.context";
import {
  AccountPaymentMethod,
  MenuItem,
  OrderCollectionStatus,
  User,
} from "../../../types";
import { useGetOrders } from "../../../utils/api/order/order";
import {
  useGetOrderCollections,
  useOrderCollectionMutations,
} from "../../../utils/api/order/orderCollection";
import { useOrderPaymentMutations } from "../../../utils/api/order/orderPayment";
import GenericAddEditPanel from "../../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../../panelComponents/shared/types";

type Props = {
  orderCollections: number[];
  setIsCollectionModalOpen: (isOpen: boolean) => void;
};

const CollectionModal = ({
  orderCollections,
  setIsCollectionModalOpen,
}: Props) => {
  const collections = useGetOrderCollections();
  const orders = useGetOrders();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const [rowToAction, setRowToAction] = useState<any>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { t } = useTranslation();
  const { updateOrderCollection } = useOrderCollectionMutations();
  const { updateOrderPayment } = useOrderPaymentMutations();
  const [inputForm, setInputForm] = useState({
    note: "",
  });
  if (!collections || !orders || !user) {
    return null;
  }
  const allRows = orderCollections.map((collectionId) => {
    const collection = collections.find((item) => item._id === collectionId);
    if (!collection) {
      return null;
    }
    return {
      _id: collection._id,
      orderPayment: collection.orderPayment,
      cashier: (collection.createdBy as User)?.name,
      orders: collection.orders,
      cancelledBy: (collection?.cancelledBy as User)?.name,
      cancelledAt: collection?.cancelledAt
        ? format(collection.cancelledAt, "HH:mm")
        : "",
      hour: format(collection.createdAt, "HH:mm"),
      paymentMethod: (collection.paymentMethod as AccountPaymentMethod)?.name,
      amount: collection.amount,
      cancelNote: collection.cancelNote ?? "",
      status: collection.status,
      collapsible: {
        collapsibleHeader: t("Orders"),
        collapsibleColumns: [
          { key: t("Product"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
        ],
        collapsibleRows: collection?.orders?.map((orderCollectionItem) => ({
          product: (
            orders?.find((order) => order._id === orderCollectionItem.order)
              ?.item as MenuItem
          )?.name,
          quantity: orderCollectionItem.paidQuantity,
        })),
        collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
      },
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Cashier"), isSortable: true },
    { key: t("Create Hour"), isSortable: true },
    { key: t("Payment Method"), isSortable: true },
    { key: t("Amount"), isSortable: true },
    { key: t("Cancelled By"), isSortable: true },
    { key: t("Cancelled At"), isSortable: true },
    { key: t("Cancel Note"), isSortable: true },
    { key: t("Status"), isSortable: true },
    { key: t("Action"), isSortable: false, className: "text-center" },
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
    { key: "cancelledBy" },
    { key: "cancelledAt" },
    { key: "cancelNote" },
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
  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "note",
      label: t("Note"),
      placeholder: t("Note"),
      required: true,
    },
  ];
  const formKeys = [{ key: "note", type: FormKeyTypeEnum.STRING }];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [collections, orders]);
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
        const actions = [
          {
            name: t("Edit"),
            icon: <HiOutlineTrash />,
            className: "text-red-600 cursor-pointer text-xl",
            isModal: true,
            setRow: setRowToAction,
            modal: rowToAction ? (
              <GenericAddEditPanel
                isOpen={isEditModalOpen}
                generalClassName="overflow-visible"
                topClassName="flex flex-col gap-2 "
                setForm={setInputForm}
                close={() => setIsEditModalOpen(false)}
                inputs={inputs}
                formKeys={formKeys}
                submitItem={updateOrderCollection as any}
                isEditMode={false}
                submitFunction={() => {
                  if (!rowToAction) {
                    return;
                  }
                  if (rowToAction?.orders?.length > 0) {
                    const newOrderPaymentOrders =
                      rowToAction?.orderPayment?.orders?.map(
                        (orderPaymentItem: any) => {
                          const orderCollectionItem = rowToAction.orders.find(
                            (orderCollectionItem: any) =>
                              orderCollectionItem.order ===
                              orderPaymentItem.order
                          );
                          if (orderCollectionItem) {
                            return {
                              ...orderPaymentItem,
                              paidQuantity:
                                orderPaymentItem.paidQuantity -
                                orderCollectionItem.paidQuantity,
                            };
                          }
                          return orderPaymentItem;
                        }
                      );
                    updateOrderPayment({
                      id: rowToAction?.orderPayment?._id,
                      updates: {
                        orders: newOrderPaymentOrders,
                      },
                    });
                  }
                  updateOrderCollection({
                    id: rowToAction._id,
                    updates: {
                      cancelNote: inputForm.note,
                      cancelledAt: new Date(),
                      cancelledBy: user._id,
                      status: OrderCollectionStatus.CANCELLED,
                    },
                  });
                }}
              />
            ) : null,
            isModalOpen: isEditModalOpen,
            setIsModal: setIsEditModalOpen,
            isPath: false,
          },
        ];
        return (
          <div className="flex  flex-row  justify-start items-center absolute top-[3.8rem] left-0 right-0 bottom-0 bg-white shadow-lg p-2 gap-2  overflow-scroll no-scrollbar">
            <div className="w-[95%] mx-auto mb-auto ">
              <GenericTable
                key={tableKey}
                title={t("Collection History")}
                columns={columns}
                rowKeys={rowKeys}
                rows={rows}
                isActionsActive={true}
                isSearch={false}
                filters={filters}
                isCollapsible={true}
                actions={actions}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CollectionModal;
