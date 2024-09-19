import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaHistory } from "react-icons/fa";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import bankTransfer from "../../../assets/order/bank_transfer.png";
import cash from "../../../assets/order/cash.png";
import creditCard from "../../../assets/order/credit_card.png";
import { useLocationContext } from "../../../context/Location.context";
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
import { useOrderCollectionMutations } from "../../../utils/api/order/orderCollection";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../../panelComponents/shared/types";
import CollectionModal from "./CollectionModal";

type Props = {
  tableOrders: Order[];
  collectionsTotalAmount: number;
  table: Table;
  givenDateOrders?: Order[];
  givenDateCollections?: OrderCollection[];
};
const OrderPaymentTypes = ({
  tableOrders,
  collectionsTotalAmount,
  table,
  givenDateCollections,
  givenDateOrders,
}: Props) => {
  const { t } = useTranslation();
  const paymentTypes = useGetAccountPaymentMethods();
  const { selectedLocationId } = useLocationContext();
  const paymentMethods = useGetAccountPaymentMethods();
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  // this are for collection cancel note if it is activated this will be used
  // const [selectedCollection, setSelectedCollection] =
  //   useState<OrderCollection>();
  // const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  // const [inputForm, setInputForm] = useState({
  //   note: "",
  // });
  const { user } = useUserContext();
  if (
    !selectedLocationId ||
    !givenDateCollections ||
    !paymentTypes ||
    !givenDateOrders ||
    !user
  ) {
    return null;
  }

  function getPaymentMethodName(paymentType: string) {
    return paymentMethods.find((method) => method._id === paymentType);
  }

  const tableNotCancelledCollections = givenDateCollections.filter(
    (collection) =>
      ((collection.table as Table)?._id === table._id ||
        collection.table === table._id) &&
      collection.status !== OrderCollectionStatus.CANCELLED
  );

  const { paymentAmount, temporaryOrders, resetOrderContext } =
    useOrderContext();
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
  const { createOrderCollection, updateOrderCollection } =
    useOrderCollectionMutations();

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
  const totalMoneySpend = collectionsTotalAmount + Number(paymentAmount);
  const discountAmount = tableOrders.reduce((acc, order) => {
    if (!order.discount) {
      return acc;
    }
    const discountValue =
      (order.unitPrice * order.quantity * (order?.discountPercentage ?? 0)) /
        100 +
      (order?.discountAmount ?? 0) * order.quantity;
    return acc + discountValue;
  }, 0);
  const totalAmount = tableOrders.reduce((acc, order) => {
    return acc + order.unitPrice * order.quantity;
  }, 0);
  const isAllItemsPaid =
    tableOrders?.every((order) => order.paidQuantity === order.quantity) &&
    collectionsTotalAmount >= totalAmount - discountAmount;
  const refundAmount = totalMoneySpend - (totalAmount - discountAmount);

  const filteredPaymentTypes = paymentTypes.filter((paymentType) =>
    table?.isOnlineSale
      ? paymentType?.isOnlineOrder
      : !paymentType?.isOnlineOrder
  );

  return (
    <div className="flex flex-col border border-gray-200 rounded-md bg-white shadow-lg p-1 gap-4  __className_a182b8 ">
      {/*main header part */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1 font-semibold px-2 py-1">
        <h1>{t("Payment Types")}</h1>
      </div>
      {/* payment types */}
      <div className="grid grid-cols-3 gap-2 h-52 overflow-scroll no-scrollbar">
        {filteredPaymentTypes?.map((paymentType) => (
          <div
            key={paymentType._id}
            onClick={() => {
              // all items are paid
              if (isAllItemsPaid) {
                toast.error(t("There is no order to pay"));
                return;
              }
              // if payment amount is empty
              if (
                temporaryOrders.length === 0 &&
                (paymentAmount === "" || paymentAmount === "0")
              ) {
                toast.error(
                  t("Please enter the amount or select order to pay")
                );
                return;
              }
              // if payment amount is greater than total amount or there are items in the temporary orders
              let newOrders: Order[] = [];
              if (
                temporaryOrders.length !== 0 ||
                totalMoneySpend >= totalAmount - discountAmount
              ) {
                if (totalMoneySpend >= totalAmount - discountAmount) {
                  newOrders = tableOrders?.map((order) => {
                    return {
                      ...order,
                      paidQuantity: order.quantity,
                    };
                  });
                } else {
                  newOrders = tableOrders?.map((order) => {
                    const temporaryOrder = temporaryOrders.find(
                      (temporaryOrder) => temporaryOrder.order._id === order._id
                    );
                    if (!temporaryOrder) {
                      return order;
                    }
                    return {
                      ...order,
                      paidQuantity:
                        order.paidQuantity + temporaryOrder.quantity,
                    };
                  });
                }
              }
              const createdCollection = {
                table: table._id,
                location: selectedLocationId,
                paymentMethod: paymentType._id,
                amount:
                  Number(paymentAmount) - (refundAmount > 0 ? refundAmount : 0),
                status: OrderCollectionStatus.PAID,
                orders:
                  totalMoneySpend >= totalAmount - discountAmount
                    ? tableOrders
                        ?.filter(
                          (order) => order.paidQuantity !== order.quantity
                        )
                        ?.map((order) => {
                          return {
                            order: order._id,
                            paidQuantity: order.quantity - order.paidQuantity,
                          };
                        })
                    : temporaryOrders?.map((order) => ({
                        order: order.order._id,
                        paidQuantity: order.quantity,
                      })),
                ...(newOrders && { newOrders: newOrders }),
              };
              createOrderCollection(createdCollection);
              resetOrderContext();
            }}
            className="max-h-24 flex flex-col justify-center items-center border border-gray-200 p-2 rounded-md cursor-pointer hover:bg-gray-100 gap-2"
          >
            <img
              className="w-12 h-12"
              src={paymentTypeImage(paymentType._id)}
              alt={paymentType.name}
            />
            <p className="font-medium text-center">{t(paymentType.name)}</p>
          </div>
        ))}
      </div>
      {/*collection history */}
      <div className="flex flex-row justify-between border-b border-gray-200 items-center pb-1  px-2 py-2 mt-4">
        <div className="flex flex-row gap-1 justify-center items-center">
          <FaHistory
            className="text-red-600 font-semibold cursor-pointer relative"
            onClick={() => {
              setIsCollectionModalOpen(true);
            }}
          />
          <p className="font-semibold">{t("Collection History")}</p>
          {isCollectionModalOpen && (
            <CollectionModal
              setIsCollectionModalOpen={setIsCollectionModalOpen}
              table={table._id}
              orders={givenDateOrders}
              collections={givenDateCollections}
            />
          )}
        </div>
        <p className="text-sm font-semibold">
          {collectionsTotalAmount.toFixed(2) ?? "0.00"} ₺
        </p>
      </div>
      {/* collection summary */}
      <div className="flex flex-col h-52 gap-1 overflow-scroll no-scrollbar ">
        {tableNotCancelledCollections.map((collection) => (
          <div
            key={collection._id}
            className="flex flex-row justify-between px-4 border-b text-sm font-medium pb-1"
          >
            {/* left part */}
            <div className="flex flex-row gap-2 ">
              <p className="min-w-9">{collection.amount} ₺</p>
              <p>
                {collection.paymentMethod
                  ? t(
                      getPaymentMethodName(collection.paymentMethod)?.name || ""
                    )
                  : ""}
              </p>
            </div>
            {/* right part */}
            {!table?.finishHour && (
              <HiOutlineTrash
                className="text-red-600 cursor-pointer text-lg"
                onClick={() => {
                  let newOrders: Order[] = [];
                  if (
                    collection?.orders?.length &&
                    collection?.orders?.length > 0
                  ) {
                    newOrders = collection?.orders
                      ?.map((orderCollectionItem: OrderCollectionItem) => {
                        const order = givenDateOrders?.find(
                          (orderItem) =>
                            orderItem._id === orderCollectionItem.order
                        );
                        if (order !== undefined) {
                          return {
                            ...order,
                            paidQuantity:
                              order.paidQuantity -
                                orderCollectionItem.paidQuantity <
                              1e-6
                                ? 0
                                : order.paidQuantity -
                                  orderCollectionItem.paidQuantity,
                          };
                        }
                        return null;
                      })
                      ?.filter((item): item is Order => item !== null);
                  }
                  updateOrderCollection({
                    id: collection._id,
                    updates: {
                      cancelledAt: new Date(),
                      cancelledBy: user._id,
                      status: OrderCollectionStatus.CANCELLED,
                      ...(newOrders && { newOrders: newOrders }),
                      table: table._id,
                    } as Partial<OrderCollection>,
                  });
                  resetOrderContext();
                }}
              />
            )}
          </div>
        ))}
      </div>
      {/* {isCancelModalOpen && selectedCollection !== undefined && (
        <GenericAddEditPanel
          isOpen={isCancelModalOpen}
          generalClassName="overflow-visible"
          topClassName="flex flex-col gap-2 "
          setForm={setInputForm}
          close={() => setIsCancelModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateOrderCollection as any}
          isEditMode={false}
          submitFunction={() => {
            if (
              selectedCollection?.orders?.length &&
              selectedCollection?.orders?.length > 0
            ) {
              const newOrders = selectedCollection?.orders
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
                ?.filter((item: any) => item !== null);
              updateOrders(newOrders as Order[]);
            }
            updateOrderCollection({
              id: selectedCollection._id,
              updates: {
                cancelNote: inputForm.note,
                cancelledAt: new Date(),
                cancelledBy: user._id,
                status: OrderCollectionStatus.CANCELLED,
              },
            });
            resetOrderContext();
            setSelectedCollection(undefined);
          }}
        />
      )} */}
    </div>
  );
};

export default OrderPaymentTypes;
