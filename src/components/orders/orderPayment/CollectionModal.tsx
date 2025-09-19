import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useOrderContext } from "../../../context/Order.context";
import { useUserContext } from "../../../context/User.context";
import {
  Order,
  OrderCollection,
  OrderCollectionItem,
  OrderCollectionStatus,
  Table,
} from "../../../types";
import { useGetAccountPaymentMethods } from "../../../utils/api/account/paymentMethod";
import { useGetAllMenuItems } from "../../../utils/api/menu/menu-item";
import { useOrderCollectionMutations } from "../../../utils/api/order/orderCollection";
import { useGetUsers } from "../../../utils/api/user";
import { getItem } from "../../../utils/getItem";
import GenericAddEditPanel from "../../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../../panelComponents/Tables/GenericTable";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../../panelComponents/shared/types";

type Props = {
  table: Table;
  setIsCollectionModalOpen: (isOpen: boolean) => void;
  orders: Order[];
  collections: OrderCollection[];
};

const CollectionModal = ({
  table,
  setIsCollectionModalOpen,
  orders,
  collections,
}: Props) => {
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const [rowToAction, setRowToAction] = useState<any>();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const paymentMethods = useGetAccountPaymentMethods();
  const users = useGetUsers();
  const items = useGetAllMenuItems();
  const { t } = useTranslation();
  const { resetOrderContext } = useOrderContext();
  const { updateOrderCollection } = useOrderCollectionMutations(table._id);
  const [inputForm, setInputForm] = useState({
    note: "",
  });
  if (!collections || !orders || !user) {
    return null;
  }
  const allRows = collections
    .filter((collection) => (collection?.table as Table)?._id === table._id)
    .map((collection) => {
      const paymentMethod = paymentMethods.find(
        (method) => method._id === collection.paymentMethod
      );
      return {
        _id: collection._id,
        table: (collection?.table as Table)?._id,
        cashier: getItem(collection?.createdBy, users)?.name,
        orders: collection.orders,
        cancelledBy: getItem(collection?.cancelledBy, users)?.name,
        cancelledAt: collection?.cancelledAt
          ? format(collection.cancelledAt, "HH:mm")
          : "",
        hour: format(collection.createdAt, "HH:mm"),
        paymentMethod: paymentMethod?.name,
        amount: collection.amount.toFixed(2),
        cancelNote: collection.cancelNote ?? "",
        status: collection.status,
        collapsible: {
          collapsibleHeader: t("Orders"),
          collapsibleColumns: [
            { key: t("Product"), isSortable: true },
            { key: t("Quantity"), isSortable: true },
          ],
          collapsibleRows: collection?.orders?.map((orderCollectionItem) => ({
            product: getItem(
              orders?.find((order) => order._id === orderCollectionItem.order)
                ?.item,
              items
            )?.name,
            quantity: orderCollectionItem.paidQuantity.toFixed(2),
          })),
          collapsibleRowKeys: [{ key: "product" }, { key: "quantity" }],
        },
      };
    })
    ?.filter((item) => item !== null);

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
          <p className="text-white bg-blue-500 p-0.5 text-sm rounded-md text-center font-semibold">
            {t("Paid Status")}
          </p>
        ) : (
          <p className="text-white bg-red-500 p-0.5 text-sm rounded-md text-center font-semibold">
            {t("Cancelled Status")}
          </p>
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
      name: t("Cancel"),
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
            let newOrders: Order[] = [];

            if (rowToAction?.orders?.length > 0) {
              newOrders = rowToAction?.orders
                ?.map((orderCollectionItem: OrderCollectionItem) => {
                  const order = orders?.find(
                    (orderItem) => orderItem._id === orderCollectionItem.order
                  );
                  if (order) {
                    return {
                      ...order,
                      paidQuantity:
                        order.paidQuantity - orderCollectionItem.paidQuantity <
                        1e-6
                          ? 0
                          : order.paidQuantity -
                            orderCollectionItem.paidQuantity,
                    };
                  }
                  return null;
                })
                ?.filter((item: any): item is Order => item !== null);
            }
            updateOrderCollection({
              id: rowToAction._id,
              updates: {
                cancelNote: inputForm.note,
                cancelledAt: new Date(),
                cancelledBy: user._id,
                status: OrderCollectionStatus.CANCELLED,
                ...(newOrders && { newOrders: newOrders }),
              },
            });
            resetOrderContext();
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];

  return (
    <div
      id="popup"
      className="z-[99999] fixed w-full h-full inset-0 flex justify-center items-center"
    >
      <div
        onClick={close}
        className="w-full h-full bg-gray-900 bg-opacity-50 absolute inset-0 "
      />

      <div className="relative w-[95%] h-[98%]  overflow-y-auto">
        <div className="flex flex-row justify-between items-center px-4 bg-blue-gray-50 rounded-t-lg py-1">
          {/* header */}
          <div className="flex flex-col gap-1">
            <h1 className="font-medium">
              <span className="font-semibold">{t("Table")}</span>: {table?.name}
            </h1>
            <h1 className="font-medium">{user.name}</h1>
          </div>
        </div>
        <div className="bg-white rounded-b-md shadow overflow-y-auto sm:h-full items-center ">
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
      </div>
    </div>
  );
};

export default CollectionModal;
