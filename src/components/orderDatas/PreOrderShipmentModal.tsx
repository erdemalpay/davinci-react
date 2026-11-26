import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { MenuItem, Order, OrderStatus } from "../../types";
import { usePreOrderShipmentMutation } from "../../utils/api/order/order";
import { getItem } from "../../utils/getItem";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

// Backend selectShippableOrders ile aynı kural: kopyaya girebilir mi?
export const isShippableForShipment = (order: Order) =>
  Boolean(order.shopifyOrderId) &&
  order.status !== OrderStatus.CANCELLED &&
  !order.isShipped &&
  !order.isShopifyPickUp &&
  !order.preOrderShipmentShopifyOrderId;

type Props = {
  isOpen: boolean;
  close: () => void;
  orders: Order[];
  selectedItemIds: number[];
  items: MenuItem[];
  onDone?: () => void;
};

// Erdem gelen ürünleri seçiyordu: varsayılan seçim ürün filtresindekiler, filtre
// boşsa ön sipariş kalemleri. Flash 10 gibi bekleyen diğer kalemler elle eklenir.
const PreOrderShipmentModal = ({
  isOpen,
  close,
  orders,
  selectedItemIds,
  items,
  onDone,
}: Props) => {
  const { t } = useTranslation();
  const { createPreOrderShipment } = usePreOrderShipmentMutation();

  const candidates = useMemo(
    () => orders.filter(isShippableForShipment),
    [orders]
  );
  const defaultOrderIds = useMemo(
    () =>
      candidates
        .filter((order) =>
          selectedItemIds.length > 0
            ? selectedItemIds.includes(order.item)
            : order.isPreOrder
        )
        .map((order) => order._id),
    [candidates, selectedItemIds]
  );
  const [form, setForm] = useState<{ orderIds: number[] }>({
    orderIds: defaultOrderIds,
  });

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "orderIds",
        label: t("Products"),
        options: candidates.map((order) => ({
          value: order._id,
          label: `${order.shopifyOrderNumber ?? ""} · ${
            getItem(order.item, items)?.name ?? ""
          } x${order.quantity}`,
        })),
        placeholder: t("Products"),
        required: true,
        isMultiple: true,
      },
    ],
    [candidates, items, t]
  );
  const formKeys = useMemo(
    () => [{ key: "orderIds", type: FormKeyTypeEnum.ARRAY }],
    []
  );

  const shopifyOrderCount = new Set(
    candidates
      .filter((order) => form.orderIds?.includes(order._id))
      .map((order) => order.shopifyOrderId)
  ).size;

  return (
    <GenericAddEditPanel
      isOpen={isOpen}
      close={close}
      inputs={inputs}
      formKeys={formKeys}
      constantValues={{ orderIds: defaultOrderIds }}
      setForm={setForm}
      upperMessage={[
        t(
          "A 0 TL shipment order will be created for {{count}} Shopify orders.",
          { count: shopifyOrderCount }
        ),
      ]}
      submitItem={(item) => {
        void item;
      }}
      submitFunction={() => {
        if (!form.orderIds?.length) {
          toast.error(t("Please select at least one product."));
          return;
        }
        createPreOrderShipment(
          { orderIds: form.orderIds },
          {
            onSuccess: (response) => {
              const created = response?.created?.length ?? 0;
              const failed = response?.failed?.length ?? 0;
              toast.success(
                t("{{created}} shipment orders created.", { created })
              );
              if (failed > 0) {
                toast.error(
                  t("{{failed}} shipment orders could not be created.", {
                    failed,
                  })
                );
              }
              onDone?.();
            },
          }
        );
      }}
      isEditMode={false}
    />
  );
};

export default PreOrderShipmentModal;
