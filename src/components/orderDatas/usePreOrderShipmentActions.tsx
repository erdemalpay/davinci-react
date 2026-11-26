import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  MenuItem,
  Order,
} from "../../types";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import PreOrderShipmentModal, {
  isShippableForShipment,
} from "./PreOrderShipmentModal";

type PreOrderGroupRow = { _id: number | string; orderIds?: number[] };

const shipmentButtonClassName =
  "px-2 bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit text-white hover:bg-white transition-transform border rounded-md cursor-pointer";

type Props = {
  orders: Order[] | undefined;
  items: MenuItem[] | undefined;
  selectedItemIds: number[];
};

// "Shopify Pre Orders" tablosu için gönderim siparişi aksiyonları: satır başına
// buton (tek sipariş) ve seçim modunda toplu buton. İkisi de aynı modalı açar.
export const usePreOrderShipmentActions = ({
  orders,
  items,
  selectedItemIds,
}: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const { selectedRows, setSelectedRows, setIsSelectionActive } =
    useGeneralContext();
  const [isBulkShipmentOpen, setIsBulkShipmentOpen] = useState(false);
  const [shipmentRowOrderIds, setShipmentRowOrderIds] = useState<
    number[] | null
  >(null);

  const isShipmentDisabled = useMemo(
    () =>
      isActionDisabled(
        getItem(
          DisabledConditionEnum.ORDERDATAS_SHOPIFYPREORDERS,
          disabledConditions
        ),
        ActionEnum.CREATE_SHIPMENT_ORDER,
        user
      ),
    [disabledConditions, user]
  );
  const ordersByIds = useCallback(
    (ids: number[]) =>
      (orders ?? []).filter((order) => ids.includes(order._id)),
    [orders]
  );
  const actionName = t("Create Shipment Order");

  const actions = useMemo(
    () => [
      {
        name: actionName,
        isButton: true,
        buttonClassName: shipmentButtonClassName,
        isDisabled: (row: PreOrderGroupRow) =>
          row?._id === "total" ||
          !ordersByIds(row?.orderIds ?? []).some(isShippableForShipment),
        onClick: (row: PreOrderGroupRow) =>
          setShipmentRowOrderIds(row?.orderIds ?? []),
        isModal: false,
        isPath: false,
      },
    ],
    [actionName, ordersByIds]
  );

  const selectionActions = useMemo(
    () => [
      {
        name: actionName,
        isButton: true,
        buttonClassName: `ml-auto ${shipmentButtonClassName}`,
        isModal: true,
        modal: isBulkShipmentOpen ? (
          <PreOrderShipmentModal
            isOpen={isBulkShipmentOpen}
            close={() => setIsBulkShipmentOpen(false)}
            orders={ordersByIds(
              (selectedRows as PreOrderGroupRow[])
                .filter((row) => row?._id !== "total")
                .flatMap((row) => row?.orderIds ?? [])
            )}
            selectedItemIds={selectedItemIds}
            items={items ?? []}
            onDone={() => {
              setSelectedRows([]);
              setIsSelectionActive(false);
            }}
          />
        ) : null,
        isModalOpen: isBulkShipmentOpen,
        setIsModal: setIsBulkShipmentOpen,
        isPath: false,
      },
    ],
    [
      actionName,
      isBulkShipmentOpen,
      selectedRows,
      selectedItemIds,
      items,
      ordersByIds,
      setSelectedRows,
      setIsSelectionActive,
    ]
  );

  const rowShipmentModal = shipmentRowOrderIds ? (
    <PreOrderShipmentModal
      isOpen={true}
      close={() => setShipmentRowOrderIds(null)}
      orders={ordersByIds(shipmentRowOrderIds)}
      selectedItemIds={selectedItemIds}
      items={items ?? []}
    />
  ) : null;

  return { isShipmentDisabled, actions, selectionActions, rowShipmentModal };
};
