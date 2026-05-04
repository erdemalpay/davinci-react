import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useParams } from "react-router-dom";
import { FormElementsState } from "../../types";
import {
  RetailerCollectionsResponse,
  useGetRetailerCollections,
  useRetailerCollectionMutations,
} from "../../utils/api/account/retailer";
import { toIstDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type PopulatedRetailerOrder = {
  _id?: number | string;
  item?:
    | number
    | string
    | {
        _id?: number | string;
        name?: string;
      };
  createdAt?: Date | string;
  status?: string;
  unitPrice?: number;
};

type RetailerOrderLineRow = {
  itemNameDisplay: string;
  quantity: number;
  priceDisplay: string;
};

type RetailerOrderTableRow = {
  _id?: number | string;
  date: string;
  dateDisplay: string;
  shopifyOrderNumberDisplay: string;
  amountDisplay: string;
  shopifyDiscountAmountDisplay: string;
  totalAmountDisplay: string;
  collapsible: {
    collapsibleColumns: { key: string; isSortable: boolean }[];
    collapsibleRows: RetailerOrderLineRow[];
    collapsibleRowKeys: {
      key: string;
      node?: (row: RetailerOrderLineRow) => React.ReactNode;
      className?: string;
    }[];
  };
};

function getRetailerTableRows(
  data: RetailerCollectionsResponse | undefined,
  t: (key: string) => string
): RetailerOrderTableRow[] {
  return (data?.collections ?? []).map((collection) => {
    const collapsibleRows = (collection?.orders ?? []).map((collectionItem) => {
      const order =
        typeof collectionItem.order === "object" &&
        collectionItem.order !== null
          ? (collectionItem.order as PopulatedRetailerOrder)
          : undefined;
      const unitPrice = Number(order?.unitPrice ?? 0);
      const quantity = Number(collectionItem.paidQuantity ?? 0);

      const itemName =
        typeof order?.item === "object" && order.item !== null
          ? (order.item as { name?: string }).name
          : String(order?.item ?? "-");

      return {
        itemNameDisplay: itemName || "-",
        quantity,
        priceDisplay: `${unitPrice.toFixed(2).replace(/\.?0*$/, "")} ₺`,
      };
    });

    const createdAt = collection.createdAt
      ? toIstDate(collection.createdAt)
      : null;
    const amount = Number(collection.amount ?? 0);
    const discountAmount = Number(collection.shopifyDiscountAmount ?? 0);
    const totalAmount = amount - discountAmount;

    return {
      _id: collection._id,
      date: collection.createdAt ? String(collection.createdAt) : "",
      dateDisplay: createdAt ? format(createdAt, "dd/MM/yyyy") : "-",
      shopifyOrderNumberDisplay: collection.shopifyOrderNumber || "-",
      amountDisplay: `${amount.toFixed(2).replace(/\.?0*$/, "")} ₺`,
      shopifyDiscountAmountDisplay: `${discountAmount
        .toFixed(2)
        .replace(/\.?0*$/, "")} ₺`,
      totalAmountDisplay: `${totalAmount.toFixed(2).replace(/\.?0*$/, "")} ₺`,
      collapsible: {
        collapsibleColumns: [
          { key: t("Product"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
          { key: t("Price"), isSortable: true },
        ],
        collapsibleRows,
        collapsibleRowKeys: [
          {
            key: "itemNameDisplay",
            className: "min-w-40",
          },
          {
            key: "quantity",
            className: "min-w-24",
          },
          {
            key: "priceDisplay",
            className: "min-w-24",
          },
        ],
      },
    };
  });
}

const RetailerOrders = () => {
  const { t } = useTranslation();
  const { retailerId } = useParams();
  const { removeRetailerCollection } = useRetailerCollectionMutations();

  const initialFilterFormElements = useMemo(
    () => ({
      after: "",
      before: "",
    }),
    []
  );

  const [showFilters, setShowFilters] = useState(false);
  const [filterFormElements, setFilterFormElements] =
    useState<FormElementsState>(initialFilterFormElements);

  const retailerCollectionsData = useGetRetailerCollections(retailerId, {
    after: (filterFormElements.after as string) || undefined,
    before: (filterFormElements.before as string) || undefined,
  });

  const rows = useMemo(
    () => getRetailerTableRows(retailerCollectionsData, t),
    [retailerCollectionsData, t]
  );

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true, correspondingKey: "date" },
      {
        key: t("Shopify Order Number"),
        isSortable: true,
        correspondingKey: "shopifyOrderNumberDisplay",
      },
      {
        key: t("Amount"),
        isSortable: true,
        correspondingKey: "amountDisplay",
      },
      {
        key: t("Discount"),
        isSortable: true,
        correspondingKey: "shopifyDiscountAmountDisplay",
      },
      {
        key: t("Total Amount"),
        isSortable: true,
        correspondingKey: "totalAmountDisplay",
      },
      {
        key: t("Actions"),
        isSortable: false,
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "dateDisplay",
        className: "min-w-32 font-medium",
      },
      {
        key: "shopifyOrderNumberDisplay",
        className: "min-w-40",
      },
      {
        key: "amountDisplay",
        className: "min-w-24",
      },
      {
        key: "shopifyDiscountAmountDisplay",
        className: "min-w-32",
      },
      {
        key: "totalAmountDisplay",
        className: "min-w-24",
      },
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        isOnClearActive: false,
      },
    ],
    [t]
  );

  const tableFilters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showFilters}
            onChange={() => {
              setShowFilters(!showFilters);
            }}
          />
        ),
      },
    ],
    [t, showFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterFormElements,
      setFormElements: setFilterFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterFormElements(initialFilterFormElements);
      },
    }),
    [
      showFilters,
      filterPanelInputs,
      filterFormElements,
      initialFilterFormElements,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Remove"),
        icon: <HiOutlineTrash />,
        className: "text-red-500 cursor-pointer text-xl",
        onClick: (row: RetailerOrderTableRow) => {
          if (!retailerId || !row._id) {
            return;
          }

          removeRetailerCollection({
            retailerId,
            collectionId: row._id,
          });
        },
      },
    ],
    [t, retailerId, removeRetailerCollection]
  );

  return (
    <div className="w-[95%] mx-auto my-6">
      <GenericTable<RetailerOrderTableRow>
        title={
          retailerCollectionsData?.retailer?.name || t("Retailer Collections")
        }
        rows={rows}
        columns={columns}
        rowKeys={rowKeys}
        filters={tableFilters}
        filterPanel={filterPanel}
        isActionsActive={true}
        actions={actions}
        isCollapsible={true}
        isPagination={false}
      />
    </div>
  );
};

export default RetailerOrders;
