import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { UpdatePayload } from "../../utils/api";
import {
  CreateAutomaticBxgyDiscountPayload,
  CreateBxgyDiscountPayload,
  CreateFreeShippingDiscountPayload,
  CreateProductDiscountPayload,
  CreateShopifyDiscountPayload,
  UpdateAutomaticBxgyDiscountPayload,
  CreateAutomaticOrderDiscountPayload,
  UpdateAutomaticOrderDiscountPayload,
  UpdateBxgyDiscountPayload,
  UpdateFreeShippingDiscountPayload,
  UpdateProductDiscountPayload,
  UpdateShopifyDiscountPayload,
  useCreateAutomaticBxgyDiscountMutation,
  useCreateAutomaticOrderDiscountMutation,
  useCreateBxgyDiscountMutation,
  useCreateFreeShippingDiscountMutation,
  useCreateProductDiscountMutation,
  useCreateShopifyDiscountMutation,
  useDeleteShopifyDiscountMutation,
  useGetShopifyCollections,
  useGetShopifyDiscountsPaginated,
  useUpdateAutomaticBxgyDiscountMutation,
  useUpdateAutomaticOrderDiscountMutation,
  useUpdateBxgyDiscountMutation,
  useUpdateFreeShippingDiscountMutation,
  useUpdateProductDiscountMutation,
  useUpdateShopifyDiscountMutation,
} from "../../utils/api/shopify";
import { FormElementsState, RowPerPageEnum, ShopifyDiscountNode } from "../../types";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGeneralContext } from "../../context/General.context";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

interface DiscountRow {
  _id: string;
  numericId: string;
  title: string;
  code: string;
  status: string;
  discountKind: "ORDER_DISCOUNT" | "ORDER_DISCOUNT_AUTOMATIC" | "FREE_SHIPPING" | "PRODUCT_DISCOUNT" | "BXGY" | "BXGY_AUTOMATIC";
  valueType: string;
  value: number;
  startsAt: string;
  endsAt: string;
  usageCount: number;
  usageLimit: string;
  appliesOncePerCustomer: boolean;
  minimumRequirementType: string;
  minimumRequirementValue: number | undefined;
  combinesWithProductDiscounts: boolean;
  combinesWithOrderDiscounts: boolean;
  combinesWithShippingDiscounts: boolean;
  appliesTo?: "ALL" | "PRODUCTS" | "COLLECTIONS";
  productIds?: string[];
  collectionIds?: string[];
  // BXGY fields
  buyRequirementType?: string;
  buyQuantityOrAmount?: number;
  buyProductScope?: string;
  buyProductIds?: string[];
  buyCollectionIds?: string[];
  getQuantity?: number;
  getProductScope?: string;
  getProductIds?: string[];
  getCollectionIds?: string[];
  bxgyDiscountType?: string;
  bxgyDiscountValue?: number;
}


function generateDiscountCode(length = 12): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

function CodeGenerateButton({
  setFormElements,
}: {
  setFormElements?: (updater: (prev: any) => any) => void;
}) {
  const { t } = useTranslation();
  return (
    <button
      type="button"
      onClick={() => {
        const code = generateDiscountCode();
        setFormElements?.((prev: any) => ({ ...prev, code }));
      }}
      className="self-start text-xs text-blue-500 hover:text-blue-700 underline cursor-pointer mt-0.5"
    >
      {t("Generate Random Code")}
    </button>
  );
}


function extractDiscountItems(items: any): { scope: "ALL" | "PRODUCTS" | "COLLECTIONS"; productIds?: string[]; collectionIds?: string[] } {
  if (!items || "allItems" in items) return { scope: "ALL" };
  if ("products" in items) return { scope: "PRODUCTS", productIds: items.products.nodes.map((p: any) => p.id) };
  if ("collections" in items) return { scope: "COLLECTIONS", collectionIds: items.collections.nodes.map((c: any) => c.id) };
  return { scope: "ALL" };
}

function nodeToRow(n: ShopifyDiscountNode): DiscountRow {
  const cd = n.codeDiscount as any;
  const codeNode = cd.codes?.edges?.[0]?.node;
  const numericId = n.id.split("/").pop() ?? n.id;

  const cgValue = cd.customerGets?.value;
  const cgItems = cd.customerGets?.items;

  // BXGY: has customerBuys field; automatic if GID contains DiscountAutomaticNode
  const isBxgy = !!cd.customerBuys;
  const isBxgyAutomatic = isBxgy && n.id.includes('DiscountAutomaticNode');
  // Automatic order discount: no customerBuys, has customerGets, GID is DiscountAutomaticNode
  const isOrderDiscountAutomatic = !isBxgy && n.id.includes('DiscountAutomaticNode') && !!cgValue;
  // Free shipping: no customerGets value and not BXGY
  const isFreeShipping = !isBxgy && !isOrderDiscountAutomatic && !cgValue;
  // Product discount: not BXGY, not free shipping, has items that are NOT allItems
  const isProductDiscount =
    !isBxgy &&
    !isFreeShipping &&
    cgItems != null &&
    !("allItems" in cgItems);

  let valueType = "";
  let value = 0;

  if (isBxgy) {
    const doq = (cgValue as any)?.discountOnQuantity;
    if (doq?.effect) {
      if ("percentage" in doq.effect) {
        if (doq.effect.percentage >= 1.0) {
          valueType = "FREE";
          value = 100;
        } else {
          valueType = "PERCENTAGE";
          value = Math.round(doq.effect.percentage * 100);
        }
      } else if ("amount" in doq.effect) {
        valueType = "AMOUNT";
        value = parseFloat(doq.effect.amount?.amount ?? "0");
      }
    }
  } else if (!isFreeShipping && cgValue) {
    if ("percentage" in cgValue) {
      valueType = "PERCENTAGE";
      value = Math.round(cgValue.percentage * 100);
    } else if ("amount" in cgValue) {
      valueType = "FIXED_AMOUNT";
      value = parseFloat(cgValue.amount?.amount ?? "0");
    }
  } else {
    valueType = "FREE_SHIPPING";
  }

  let minimumRequirementType = "NONE";
  let minimumRequirementValue: number | undefined;
  const mr = cd.minimumRequirement;
  if (mr) {
    if ("greaterThanOrEqualToSubtotal" in mr) {
      minimumRequirementType = "SUBTOTAL";
      const subtotalField = (mr as any).greaterThanOrEqualToSubtotal;
      minimumRequirementValue = parseFloat(
        typeof subtotalField === "object" ? subtotalField.amount : subtotalField
      );
    } else if ("greaterThanOrEqualToQuantity" in mr) {
      minimumRequirementType = "QUANTITY";
      minimumRequirementValue = mr.greaterThanOrEqualToQuantity;
    }
  }

  // PRODUCT_DISCOUNT appliesTo
  let appliesTo: "ALL" | "PRODUCTS" | "COLLECTIONS" | undefined;
  let productIds: string[] | undefined;
  let collectionIds: string[] | undefined;
  if (isProductDiscount && cgItems) {
    const extracted = extractDiscountItems(cgItems);
    appliesTo = extracted.scope;
    productIds = extracted.productIds;
    collectionIds = extracted.collectionIds;
  } else if (!isFreeShipping && !isBxgy) {
    appliesTo = "ALL";
  }

  // BXGY fields
  let buyRequirementType: string | undefined;
  let buyQuantityOrAmount: number | undefined;
  let buyProductScope: string | undefined;
  let buyProductIds: string[] | undefined;
  let buyCollectionIds: string[] | undefined;
  let getQuantity: number | undefined;
  let getProductScope: string | undefined;
  let getProductIds: string[] | undefined;
  let getCollectionIds: string[] | undefined;
  let bxgyDiscountType: string | undefined;
  let bxgyDiscountValue: number | undefined;

  if (isBxgy) {
    const cb = cd.customerBuys;
    if (cb?.value) {
      if ("quantity" in cb.value) {
        buyRequirementType = "QUANTITY";
        buyQuantityOrAmount = parseInt(cb.value.quantity?.quantity ?? "0");
      } else if ("amount" in cb.value) {
        buyRequirementType = "AMOUNT";
        buyQuantityOrAmount = parseFloat((cb.value.amount as string) ?? "0");
      }
    }
    if (cb?.items) {
      const ex = extractDiscountItems(cb.items);
      buyProductScope = ex.scope;
      buyProductIds = ex.productIds;
      buyCollectionIds = ex.collectionIds;
    }

    const doq = (cgValue as any)?.discountOnQuantity;
    if (doq) {
      getQuantity = parseInt(doq.quantity?.quantity ?? "0");
      if (doq.effect) {
        if ("percentage" in doq.effect) {
          bxgyDiscountType = doq.effect.percentage >= 1.0 ? "FREE" : "PERCENTAGE";
          bxgyDiscountValue = doq.effect.percentage < 1.0 ? Math.round(doq.effect.percentage * 100) : undefined;
        } else if ("amount" in doq.effect) {
          bxgyDiscountType = "AMOUNT";
          bxgyDiscountValue = parseFloat(doq.effect.amount?.amount ?? "0");
        }
      }
    }
    if (cgItems) {
      const ex = extractDiscountItems(cgItems);
      getProductScope = ex.scope;
      getProductIds = ex.productIds;
      getCollectionIds = ex.collectionIds;
    }
  }

  return {
    _id: n.id,
    numericId,
    title: cd.title ?? "",
    code: codeNode?.code ?? "-",
    status: cd.status ?? "",
    discountKind: isBxgyAutomatic ? "BXGY_AUTOMATIC" : isBxgy ? "BXGY" : isOrderDiscountAutomatic ? "ORDER_DISCOUNT_AUTOMATIC" : isFreeShipping ? "FREE_SHIPPING" : isProductDiscount ? "PRODUCT_DISCOUNT" : "ORDER_DISCOUNT",
    valueType,
    value,
    startsAt: cd.startsAt ?? "",
    endsAt: cd.endsAt ?? "",
    usageCount: codeNode?.asyncUsageCount ?? 0,
    usageLimit: cd.usageLimit != null ? String(cd.usageLimit) : "∞",
    appliesOncePerCustomer: cd.appliesOncePerCustomer ?? false,
    minimumRequirementType,
    minimumRequirementValue,
    combinesWithProductDiscounts: cd.combinesWith?.productDiscounts ?? false,
    combinesWithOrderDiscounts: cd.combinesWith?.orderDiscounts ?? false,
    combinesWithShippingDiscounts: cd.combinesWith?.shippingDiscounts ?? false,
    appliesTo,
    productIds,
    collectionIds,
    buyRequirementType,
    buyQuantityOrAmount,
    buyProductScope,
    buyProductIds,
    buyCollectionIds,
    getQuantity,
    getProductScope,
    getProductIds,
    getCollectionIds,
    bxgyDiscountType,
    bxgyDiscountValue,
  };
}

const ShopifyDiscounts = () => {
  const { t } = useTranslation();

  const discountTypeOptions = useMemo(() => [
    { value: "ORDER_DISCOUNT", label: t("Order Amount Discount") },
    { value: "FREE_SHIPPING", label: t("Free Shipping") },
    { value: "PRODUCT_DISCOUNT", label: t("Product Collection Discount") },
    { value: "BXGY", label: t("Buy X Get Y") },
  ], [t]);

  const appliesToOptions = useMemo(() => [
    { value: "ALL", label: t("All Products") },
    { value: "PRODUCTS", label: t("Specific Products") },
    { value: "COLLECTIONS", label: t("Specific Collections") },
  ], [t]);

  const freeShippingMethodOptions = useMemo(() => [
    { value: "CODE", label: t("Discount Code Method") },
    { value: "AUTOMATIC", label: t("Automatic Discount") },
  ], [t]);

  const valueTypeOptions = useMemo(() => [
    { value: "PERCENTAGE", label: t("Percentage (%)") },
    { value: "FIXED_AMOUNT", label: t("Fixed Amount (₺)") },
  ], [t]);

  const minReqOptions = useMemo(() => [
    { value: "NONE", label: t("No Minimum Requirement") },
    { value: "SUBTOTAL", label: t("Minimum Cart Amount (₺)") },
    { value: "QUANTITY", label: t("Minimum Item Quantity") },
  ], [t]);

  const statusOptions = useMemo(() => [
    { value: "ACTIVE", label: t("Active") },
    { value: "EXPIRED", label: t("Expired") },
    { value: "SCHEDULED", label: t("Scheduled") },
  ], [t]);

  const bxgyBuyRequirementOptions = useMemo(() => [
    { value: "QUANTITY", label: t("Minimum Quantity") },
    { value: "AMOUNT", label: t("Minimum Purchase Amount") },
  ], [t]);

  const bxgyProductScopeOptions = useMemo(() => [
    { value: "ALL", label: t("All Products") },
    { value: "PRODUCTS", label: t("Specific Products") },
    { value: "COLLECTIONS", label: t("Specific Collections") },
  ], [t]);

  // Automatic BXGY: Shopify doesn't allow ALL scope for either buy or get side
  const bxgyProductScopeOptionsAutomatic = useMemo(() => [
    { value: "PRODUCTS", label: t("Specific Products") },
    { value: "COLLECTIONS", label: t("Specific Collections") },
  ], [t]);

  const bxgyDiscountTypeOptions = useMemo(() => [
    { value: "FREE", label: t("Free") },
    { value: "PERCENTAGE", label: t("Percentage (%)") },
    { value: "AMOUNT", label: t("Fixed Amount (₺)") },
  ], [t]);

  const {
    currentPage,
    setCurrentPage,
    rowsPerPage,
    setRowsPerPage,
  } = useGeneralContext();

  const [filterFormElements, setFilterFormElements] = useState<FormElementsState>({
    search: "",
    status: "",
  });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<DiscountRow | undefined>();
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Tracked externally so addInputs can react to user's selection
  const [addDiscountType, setAddDiscountType] = useState<string>("ORDER_DISCOUNT");
  const [addMethod, setAddMethod] = useState<string>("CODE");
  const [addAppliesTo, setAddAppliesTo] = useState<string>("ALL");
  const [addBuyProductScope, setAddBuyProductScope] = useState<string>("ALL");
  const [addGetProductScope, setAddGetProductScope] = useState<string>("ALL");
  const [addBxgyDiscountType, setAddBxgyDiscountType] = useState<string>("FREE");
  const [addBxgyMethod, setAddBxgyMethod] = useState<string>("CODE");

  const { mutate: createDiscount } = useCreateShopifyDiscountMutation();
  const { mutate: updateDiscount } = useUpdateShopifyDiscountMutation();
  const { mutate: deleteDiscount } = useDeleteShopifyDiscountMutation();
  const { mutate: createFreeShippingDiscount } = useCreateFreeShippingDiscountMutation();
  const { mutate: updateFreeShippingDiscount } = useUpdateFreeShippingDiscountMutation();
  const { mutate: createProductDiscount } = useCreateProductDiscountMutation();
  const { mutate: updateProductDiscount } = useUpdateProductDiscountMutation();
  const { mutate: createBxgyDiscount } = useCreateBxgyDiscountMutation();
  const { mutate: updateBxgyDiscount } = useUpdateBxgyDiscountMutation();
  const { mutate: createAutomaticBxgyDiscount } = useCreateAutomaticBxgyDiscountMutation();
  const { mutate: updateAutomaticBxgyDiscount } = useUpdateAutomaticBxgyDiscountMutation();
  const { mutate: createAutomaticOrderDiscount } = useCreateAutomaticOrderDiscountMutation();
  const { mutate: updateAutomaticOrderDiscount } = useUpdateAutomaticOrderDiscountMutation();

  const menuItems = useGetMenuItems();
  const shopifyCollections = useGetShopifyCollections();

  const menuItemOptions = useMemo(
    () =>
      (menuItems ?? [])
        .filter((item) => !!item.shopifyId)
        .map((item) => ({ value: item.shopifyId as string, label: item.name })),
    [menuItems]
  );

  const collectionOptions = useMemo(
    () =>
      (shopifyCollections ?? []).map((c) => ({ value: c.id, label: c.title })),
    [shopifyCollections]
  );

  useEffect(() => {
    const prev = rowsPerPage;
    if (rowsPerPage > RowPerPageEnum.THIRD) setRowsPerPage(RowPerPageEnum.THIRD);
    return () => setRowsPerPage(prev);
  }, []);

  const search = filterFormElements.search?.trim() || undefined;
  const status = filterFormElements.status || undefined;

  useEffect(() => {
    setCurrentPage(1);
  }, [search, status]);

  const safeLimit = rowsPerPage > RowPerPageEnum.THIRD ? RowPerPageEnum.THIRD : rowsPerPage;
  const payload = useGetShopifyDiscountsPaginated(currentPage, safeLimit, search, status);

  const rows = useMemo<DiscountRow[]>(() => {
    if (!payload?.data) return [];
    return payload.data
      .filter((n) => n.codeDiscount && typeof n.codeDiscount === "object")
      .map(nodeToRow);
  }, [payload]);

  const pagination = useMemo(
    () =>
      payload
        ? { totalPages: payload.totalPages, totalRows: payload.totalCount }
        : undefined,
    [payload]
  );

  const columns = useMemo(
    () => [
      { key: t("Code"), isSortable: false },
      { key: t("Title"), isSortable: false },
      { key: t("Discount Type"), isSortable: false },
      { key: t("Value"), isSortable: false },
      { key: t("Status"), isSortable: false },
      { key: t("Usage"), isSortable: false },
      { key: t("Start Date"), isSortable: false },
      { key: t("End Date"), isSortable: false },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "code",
        node: (row: DiscountRow) => (
          <span className="font-mono font-semibold text-blue-700">{row.code}</span>
        ),
      },
      { key: "title" },
      {
        key: "valueType",
        node: (row: DiscountRow) => {
          if (row.discountKind === "BXGY" || row.discountKind === "BXGY_AUTOMATIC") return t("Buy X Get Y");
          if (row.valueType === "FREE_SHIPPING") return t("Free Shipping");
          return row.valueType === "PERCENTAGE" ? t("Percentage") : t("Fixed Amount");
        },
      },
      {
        key: "value",
        node: (row: DiscountRow) => {
          if (row.discountKind === "BXGY" || row.discountKind === "BXGY_AUTOMATIC") {
            const buys = row.buyQuantityOrAmount ?? "?";
            const gets = row.getQuantity ?? "?";
            if (row.bxgyDiscountType === "FREE") return `${buys}→${gets} ${t("Free")}`;
            if (row.bxgyDiscountType === "PERCENTAGE") return `${buys}→${gets} %${row.bxgyDiscountValue ?? ""}`;
            return `${buys}→${gets} ₺${row.bxgyDiscountValue ?? ""}`;
          }
          if (row.valueType === "FREE_SHIPPING") return "-";
          return row.valueType === "PERCENTAGE" ? `%${row.value}` : `₺${row.value}`;
        },
      },
      {
        key: "status",
        node: (row: DiscountRow) => (
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              row.status === "ACTIVE"
                ? "bg-green-100 text-green-700"
                : row.status === "EXPIRED"
                ? "bg-red-100 text-red-600"
                : "bg-gray-100 text-gray-600"
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        key: "usageCount",
        node: (row: DiscountRow) => `${row.usageCount} / ${row.usageLimit}`,
      },
      {
        key: "startsAt",
        node: (row: DiscountRow) =>
          row.startsAt ? format(new Date(row.startsAt), "dd.MM.yyyy") : "-",
      },
      {
        key: "endsAt",
        node: (row: DiscountRow) =>
          row.endsAt ? format(new Date(row.endsAt), "dd.MM.yyyy") : "-",
      },
    ],
    [t]
  );

  const isFreeShipping = addDiscountType === "FREE_SHIPPING";
  const isProductDiscount = addDiscountType === "PRODUCT_DISCOUNT";
  const isBxgy = addDiscountType === "BXGY";
  const isBxgyAutomatic = isBxgy && addBxgyMethod === "AUTOMATIC";
  const isOrderDiscount = addDiscountType === "ORDER_DISCOUNT";
  const isOrderDiscountAutomaticAdd = isOrderDiscount && addMethod === "AUTOMATIC";
  const isCodeMethod = addMethod === "CODE";

  const formKeys = useMemo(
    () => [
      { key: "discountType", type: FormKeyTypeEnum.STRING },
      { key: "method", type: FormKeyTypeEnum.STRING },
      { key: "title", type: FormKeyTypeEnum.STRING },
      { key: "code", type: FormKeyTypeEnum.STRING },
      { key: "valueType", type: FormKeyTypeEnum.STRING },
      { key: "value", type: FormKeyTypeEnum.NUMBER },
      { key: "appliesTo", type: FormKeyTypeEnum.STRING },
      { key: "productIds", type: FormKeyTypeEnum.ARRAY },
      { key: "collectionIds", type: FormKeyTypeEnum.ARRAY },
      // BXGY keys
      { key: "bxgyMethod", type: FormKeyTypeEnum.STRING },
      { key: "buyRequirementType", type: FormKeyTypeEnum.STRING },
      { key: "buyQuantityOrAmount", type: FormKeyTypeEnum.NUMBER },
      { key: "buyProductScope", type: FormKeyTypeEnum.STRING },
      { key: "buyProductIds", type: FormKeyTypeEnum.ARRAY },
      { key: "buyCollectionIds", type: FormKeyTypeEnum.ARRAY },
      { key: "getQuantity", type: FormKeyTypeEnum.NUMBER },
      { key: "getProductScope", type: FormKeyTypeEnum.STRING },
      { key: "getProductIds", type: FormKeyTypeEnum.ARRAY },
      { key: "getCollectionIds", type: FormKeyTypeEnum.ARRAY },
      { key: "bxgyDiscountType", type: FormKeyTypeEnum.STRING },
      { key: "bxgyDiscountValue", type: FormKeyTypeEnum.NUMBER },
      // Common
      { key: "startsAt", type: FormKeyTypeEnum.DATE },
      { key: "endsAt", type: FormKeyTypeEnum.DATE },
      { key: "minimumRequirementType", type: FormKeyTypeEnum.STRING },
      { key: "minimumRequirementValue", type: FormKeyTypeEnum.NUMBER },
      { key: "usageLimit", type: FormKeyTypeEnum.NUMBER },
      { key: "appliesOncePerCustomer", type: FormKeyTypeEnum.BOOLEAN },
      { key: "combinesWithProductDiscounts", type: FormKeyTypeEnum.BOOLEAN },
      { key: "combinesWithOrderDiscounts", type: FormKeyTypeEnum.BOOLEAN },
      { key: "combinesWithShippingDiscounts", type: FormKeyTypeEnum.BOOLEAN },
    ],
    []
  );

  const addInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "discountType",
        label: t("Discount Type"),
        options: discountTypeOptions,
        placeholder: t("Select discount type"),
        required: true,
        additionalOnChange: (value: string) => {
          setAddDiscountType(value);
          setAddMethod("CODE");
          setAddAppliesTo("ALL");
          setAddBuyProductScope("ALL");
          setAddGetProductScope("ALL");
          setAddBxgyDiscountType("FREE");
          setAddBxgyMethod("CODE");
        },
      },
      // Free shipping or Order Discount: method toggle (İndirim Kodu / Otomatik İndirim)
      ...(isFreeShipping || isOrderDiscount
        ? [
            {
              type: InputTypes.SELECT,
              formKey: "method",
              label: t("Method"),
              options: freeShippingMethodOptions,
              placeholder: t("Select method"),
              required: true,
              additionalOnChange: (value: string) => setAddMethod(value),
            },
          ]
        : []),
      {
        type: InputTypes.TEXT,
        formKey: "title",
        label: t("Title"),
        placeholder: t("Title"),
        required: true,
      },
      // Code field: not for BXGY_AUTOMATIC or ORDER_DISCOUNT_AUTOMATIC; FREE_SHIPPING only when CODE
      ...(!isBxgyAutomatic && !isOrderDiscountAutomaticAdd && (!isFreeShipping && !isOrderDiscount || isCodeMethod)
        ? [
            {
              type: InputTypes.TEXT,
              formKey: "code",
              label: t("Discount Code"),
              placeholder: isFreeShipping ? "FREEKARGO" : "YAZINDIRIMI",
              required: true,
              helperNode: <CodeGenerateButton />,
            },
          ]
        : []),
      // Value fields: for ORDER_DISCOUNT and PRODUCT_DISCOUNT (not BXGY)
      ...(!isFreeShipping && !isBxgy
        ? [
            {
              type: InputTypes.SELECT,
              formKey: "valueType",
              label: t("Discount Type"),
              options: valueTypeOptions,
              placeholder: t("Discount Type"),
              required: true,
            },
            {
              type: InputTypes.NUMBER,
              formKey: "value",
              label: t("Value"),
              placeholder: "10",
              required: true,
              minNumber: 0,
            },
          ]
        : []),
      // Applies to: only for PRODUCT_DISCOUNT
      ...(isProductDiscount
        ? [
            {
              type: InputTypes.SELECT,
              formKey: "appliesTo",
              label: t("Applies To"),
              options: appliesToOptions,
              placeholder: t("Select"),
              required: true,
              additionalOnChange: (value: string) => setAddAppliesTo(value),
            },
            ...(addAppliesTo === "PRODUCTS"
              ? [
                  {
                    type: InputTypes.SELECT,
                    formKey: "productIds",
                    label: t("Products"),
                    options: menuItemOptions,
                    placeholder: t("Select Product"),
                    required: true,
                    isMultiple: true,
                  } as any,
                ]
              : []),
            ...(addAppliesTo === "COLLECTIONS"
              ? [
                  {
                    type: InputTypes.SELECT,
                    formKey: "collectionIds",
                    label: t("Shopify Categories"),
                    options: collectionOptions,
                    placeholder: t("Select Collection"),
                    required: true,
                    isMultiple: true,
                  } as any,
                ]
              : []),
          ]
        : []),
      // BXGY fields
      ...(isBxgy
        ? [
            // Method toggle
            {
              type: InputTypes.SELECT,
              formKey: "bxgyMethod",
              label: t("Method"),
              options: freeShippingMethodOptions,
              placeholder: t("Select method"),
              required: true,
              additionalOnChange: (value: string) => setAddBxgyMethod(value),
            },
            // --- Customer Buys ---
            {
              type: InputTypes.SELECT,
              formKey: "buyRequirementType",
              label: t("Customer Buys"),
              options: bxgyBuyRequirementOptions,
              placeholder: t("Select"),
              required: true,
            },
            {
              type: InputTypes.NUMBER,
              formKey: "buyQuantityOrAmount",
              label: t("Buy Quantity or Amount"),
              placeholder: "2",
              required: true,
              minNumber: 1,
            },
            {
              type: InputTypes.SELECT,
              formKey: "buyProductScope",
              label: t("Buy Product Scope"),
              options: isBxgyAutomatic ? bxgyProductScopeOptionsAutomatic : bxgyProductScopeOptions,
              placeholder: t("Select"),
              required: true,
              additionalOnChange: (value: string) => setAddBuyProductScope(value),
            },
            ...(addBuyProductScope === "PRODUCTS"
              ? [
                  {
                    type: InputTypes.SELECT,
                    formKey: "buyProductIds",
                    label: t("Buy Products"),
                    options: menuItemOptions,
                    placeholder: t("Select Product"),
                    required: true,
                    isMultiple: true,
                  } as any,
                ]
              : []),
            ...(addBuyProductScope === "COLLECTIONS"
              ? [
                  {
                    type: InputTypes.SELECT,
                    formKey: "buyCollectionIds",
                    label: t("Buy Collections"),
                    options: collectionOptions,
                    placeholder: t("Select Collection"),
                    required: true,
                    isMultiple: true,
                  } as any,
                ]
              : []),
            // --- Customer Gets ---
            {
              type: InputTypes.NUMBER,
              formKey: "getQuantity",
              label: t("Get Quantity"),
              placeholder: "1",
              required: true,
              minNumber: 1,
              helperText: t("Get Quantity helper"),
            },
            {
              type: InputTypes.SELECT,
              formKey: "getProductScope",
              label: t("Get Product Scope"),
              options: isBxgyAutomatic ? bxgyProductScopeOptionsAutomatic : bxgyProductScopeOptions,
              placeholder: t("Select"),
              required: true,
              additionalOnChange: (value: string) => setAddGetProductScope(value),
            },
            ...(addGetProductScope === "PRODUCTS"
              ? [
                  {
                    type: InputTypes.SELECT,
                    formKey: "getProductIds",
                    label: t("Get Products"),
                    options: menuItemOptions,
                    placeholder: t("Select Product"),
                    required: true,
                    isMultiple: true,
                  } as any,
                ]
              : []),
            ...(addGetProductScope === "COLLECTIONS"
              ? [
                  {
                    type: InputTypes.SELECT,
                    formKey: "getCollectionIds",
                    label: t("Get Collections"),
                    options: collectionOptions,
                    placeholder: t("Select Collection"),
                    required: true,
                    isMultiple: true,
                  } as any,
                ]
              : []),
            {
              type: InputTypes.SELECT,
              formKey: "bxgyDiscountType",
              label: t("Discount Value"),
              options: bxgyDiscountTypeOptions,
              placeholder: t("Select"),
              required: true,
              additionalOnChange: (value: string) => setAddBxgyDiscountType(value),
            },
            ...(addBxgyDiscountType !== "FREE"
              ? [
                  {
                    type: InputTypes.NUMBER,
                    formKey: "bxgyDiscountValue",
                    label: addBxgyDiscountType === "PERCENTAGE" ? t("Percentage Value") : t("Amount Value"),
                    placeholder: addBxgyDiscountType === "PERCENTAGE" ? "10" : "50",
                    required: true,
                    minNumber: 0,
                  },
                ]
              : []),
          ]
        : []),
      {
        type: InputTypes.DATE,
        formKey: "startsAt",
        label: t("Start Date"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "endsAt",
        label: t("End Date"),
        required: false,
      },
      // Minimum requirement: not applicable for BXGY (customerBuys already serves as the threshold)
      ...(!isBxgy
        ? [
            {
              type: InputTypes.SELECT,
              formKey: "minimumRequirementType",
              label: t("Minimum Requirement"),
              options: minReqOptions,
              placeholder: t("Minimum Requirement"),
              required: false,
              helperText: t("Minimum requirement helper"),
            },
            {
              type: InputTypes.NUMBER,
              formKey: "minimumRequirementValue",
              label: t("Minimum Requirement Value"),
              placeholder: "0",
              required: false,
              minNumber: 0,
              helperText: t("Minimum requirement value helper"),
            },
          ]
        : []),
      // Usage limits: always for ORDER_DISCOUNT/PRODUCT_DISCOUNT; for FREE_SHIPPING only when method === CODE
      ...(!isFreeShipping || isCodeMethod
        ? [
            {
              type: InputTypes.NUMBER,
              formKey: "usageLimit",
              label: t("Usage Limit"),
              placeholder: t("Unlimited"),
              required: false,
              minNumber: 1,
              helperText: t("Usage limit helper"),
            },
            {
              type: InputTypes.CHECKBOX,
              formKey: "appliesOncePerCustomer",
              label: t("Once Per Customer"),
              required: false,
            },
          ]
        : []),
      // Combination options: for ORDER_DISCOUNT and PRODUCT_DISCOUNT
      ...(!isFreeShipping
        ? [
            {
              type: InputTypes.CHECKBOX,
              formKey: "combinesWithProductDiscounts",
              label: t("Combine with Product Discounts"),
              required: false,
            },
            {
              type: InputTypes.CHECKBOX,
              formKey: "combinesWithOrderDiscounts",
              label: t("Combine with Order Discounts"),
              required: false,
            },
            {
              type: InputTypes.CHECKBOX,
              formKey: "combinesWithShippingDiscounts",
              label: t("Combine with Shipping Discounts"),
              required: false,
            },
          ]
        : []),
    ],
    [t, isFreeShipping, isOrderDiscount, isOrderDiscountAutomaticAdd, isProductDiscount, isBxgy, isBxgyAutomatic, isCodeMethod, addAppliesTo, addBuyProductScope, addGetProductScope, addBxgyDiscountType, addBxgyMethod, menuItemOptions, collectionOptions, discountTypeOptions, freeShippingMethodOptions, valueTypeOptions, minReqOptions, appliesToOptions, bxgyBuyRequirementOptions, bxgyProductScopeOptions, bxgyProductScopeOptionsAutomatic, bxgyDiscountTypeOptions]
  );

  // Edit modal uses fixed order-discount inputs (no conditional logic needed)
  const editInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "title",
        label: t("Title"),
        placeholder: t("Title"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "code",
        label: t("Discount Code"),
        placeholder: "YAZINDIRIMI",
        required: true,
        helperNode: <CodeGenerateButton />,
      },
      {
        type: InputTypes.SELECT,
        formKey: "valueType",
        label: t("Discount Type"),
        options: valueTypeOptions,
        placeholder: t("Discount Type"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "value",
        label: t("Value"),
        placeholder: "10",
        required: true,
        minNumber: 0,
      },
      {
        type: InputTypes.DATE,
        formKey: "startsAt",
        label: t("Start Date"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "endsAt",
        label: t("End Date"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "minimumRequirementType",
        label: t("Minimum Requirement"),
        options: minReqOptions,
        placeholder: t("Minimum Requirement"),
        required: false,
        helperText: t("Minimum requirement helper"),
      },
      {
        type: InputTypes.NUMBER,
        formKey: "minimumRequirementValue",
        label: t("Minimum Requirement Value"),
        placeholder: "0",
        required: false,
        minNumber: 0,
        helperText: t("Minimum requirement value helper"),
      },
      {
        type: InputTypes.NUMBER,
        formKey: "usageLimit",
        label: t("Usage Limit"),
        placeholder: t("Unlimited"),
        required: false,
        minNumber: 1,
        helperText: t("Usage limit helper"),
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "appliesOncePerCustomer",
        label: t("Once Per Customer"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithProductDiscounts",
        label: t("Combine with Product Discounts"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithOrderDiscounts",
        label: t("Combine with Order Discounts"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithShippingDiscounts",
        label: t("Combine with Shipping Discounts"),
        required: false,
      },
    ],
    [t, valueTypeOptions, minReqOptions]
  );

  const freeShippingEditInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "title",
        label: t("Title"),
        placeholder: t("Title"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "code",
        label: t("Discount Code"),
        placeholder: "FREEKARGO",
        required: true,
        helperNode: <CodeGenerateButton />,
      },
      {
        type: InputTypes.DATE,
        formKey: "startsAt",
        label: t("Start Date"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "endsAt",
        label: t("End Date"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "minimumRequirementType",
        label: t("Minimum Requirement"),
        options: minReqOptions,
        placeholder: t("Minimum Requirement"),
        required: false,
        helperText: t("Minimum requirement helper"),
      },
      {
        type: InputTypes.NUMBER,
        formKey: "minimumRequirementValue",
        label: t("Minimum Requirement Value"),
        placeholder: "0",
        required: false,
        minNumber: 0,
        helperText: t("Minimum requirement value helper"),
      },
      {
        type: InputTypes.NUMBER,
        formKey: "usageLimit",
        label: t("Usage Limit"),
        placeholder: t("Unlimited"),
        required: false,
        minNumber: 1,
        helperText: t("Usage limit helper"),
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "appliesOncePerCustomer",
        label: t("Once Per Customer"),
        required: false,
      },
    ],
    [t, minReqOptions]
  );

  const productDiscountEditInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "title",
        label: t("Title"),
        placeholder: t("Title"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "code",
        label: t("Discount Code"),
        placeholder: "URUNINDIRIMI",
        required: true,
        helperNode: <CodeGenerateButton />,
      },
      {
        type: InputTypes.SELECT,
        formKey: "valueType",
        label: t("Discount Type"),
        options: valueTypeOptions,
        placeholder: t("Discount Type"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "value",
        label: t("Value"),
        placeholder: "10",
        required: true,
        minNumber: 0,
      },
      {
        type: InputTypes.SELECT,
        formKey: "appliesTo",
        label: t("Applies To"),
        options: appliesToOptions,
        placeholder: t("Select"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "productIds",
        label: t("Products"),
        options: menuItemOptions,
        placeholder: t("Select Product"),
        required: false,
        isMultiple: true,
      } as any,
      {
        type: InputTypes.SELECT,
        formKey: "collectionIds",
        label: t("Shopify Categories"),
        options: collectionOptions,
        placeholder: t("Select Collection"),
        required: false,
        isMultiple: true,
      } as any,
      {
        type: InputTypes.DATE,
        formKey: "startsAt",
        label: t("Start Date"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "endsAt",
        label: t("End Date"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "minimumRequirementType",
        label: t("Minimum Requirement"),
        options: minReqOptions,
        placeholder: t("Minimum Requirement"),
        required: false,
        helperText: t("Minimum requirement helper"),
      },
      {
        type: InputTypes.NUMBER,
        formKey: "minimumRequirementValue",
        label: t("Minimum Requirement Value"),
        placeholder: "0",
        required: false,
        minNumber: 0,
        helperText: t("Minimum requirement value helper"),
      },
      {
        type: InputTypes.NUMBER,
        formKey: "usageLimit",
        label: t("Usage Limit"),
        placeholder: t("Unlimited"),
        required: false,
        minNumber: 1,
        helperText: t("Usage limit helper"),
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "appliesOncePerCustomer",
        label: t("Once Per Customer"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithProductDiscounts",
        label: t("Combine with Product Discounts"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithOrderDiscounts",
        label: t("Combine with Order Discounts"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithShippingDiscounts",
        label: t("Combine with Shipping Discounts"),
        required: false,
      },
    ],
    [t, menuItemOptions, collectionOptions, valueTypeOptions, appliesToOptions, minReqOptions]
  );

  const bxgyEditInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "title",
        label: t("Title"),
        placeholder: t("Title"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "code",
        label: t("Discount Code"),
        placeholder: "BUY2GET1",
        required: true,
        helperNode: <CodeGenerateButton />,
      },
      {
        type: InputTypes.SELECT,
        formKey: "buyRequirementType",
        label: t("Customer Buys"),
        options: bxgyBuyRequirementOptions,
        placeholder: t("Select"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "buyQuantityOrAmount",
        label: t("Buy Quantity or Amount"),
        placeholder: "2",
        required: true,
        minNumber: 1,
      },
      {
        type: InputTypes.SELECT,
        formKey: "buyProductScope",
        label: t("Buy Product Scope"),
        options: bxgyProductScopeOptions,
        placeholder: t("Select"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "buyProductIds",
        label: t("Buy Products"),
        options: menuItemOptions,
        placeholder: t("Select Product"),
        required: false,
        isMultiple: true,
      } as any,
      {
        type: InputTypes.SELECT,
        formKey: "buyCollectionIds",
        label: t("Buy Collections"),
        options: collectionOptions,
        placeholder: t("Select Collection"),
        required: false,
        isMultiple: true,
      } as any,
      {
        type: InputTypes.NUMBER,
        formKey: "getQuantity",
        label: t("Get Quantity"),
        placeholder: "1",
        required: true,
        minNumber: 1,
        helperText: t("Get Quantity helper"),
      },
      {
        type: InputTypes.SELECT,
        formKey: "getProductScope",
        label: t("Get Product Scope"),
        options: bxgyProductScopeOptions,
        placeholder: t("Select"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "getProductIds",
        label: t("Get Products"),
        options: menuItemOptions,
        placeholder: t("Select Product"),
        required: false,
        isMultiple: true,
      } as any,
      {
        type: InputTypes.SELECT,
        formKey: "getCollectionIds",
        label: t("Get Collections"),
        options: collectionOptions,
        placeholder: t("Select Collection"),
        required: false,
        isMultiple: true,
      } as any,
      {
        type: InputTypes.SELECT,
        formKey: "bxgyDiscountType",
        label: t("Discount Value"),
        options: bxgyDiscountTypeOptions,
        placeholder: t("Select"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "bxgyDiscountValue",
        label: t("Discount Value"),
        placeholder: "10",
        required: false,
        minNumber: 0,
      },
      {
        type: InputTypes.DATE,
        formKey: "startsAt",
        label: t("Start Date"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "endsAt",
        label: t("End Date"),
        required: false,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "usageLimit",
        label: t("Usage Limit"),
        placeholder: t("Unlimited"),
        required: false,
        minNumber: 1,
        helperText: t("Usage limit helper"),
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "appliesOncePerCustomer",
        label: t("Once Per Customer"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithProductDiscounts",
        label: t("Combine with Product Discounts"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithOrderDiscounts",
        label: t("Combine with Order Discounts"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "combinesWithShippingDiscounts",
        label: t("Combine with Shipping Discounts"),
        required: false,
      },
    ],
    [t, menuItemOptions, collectionOptions, bxgyBuyRequirementOptions, bxgyProductScopeOptions, bxgyDiscountTypeOptions]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: statusOptions,
        placeholder: t("All"),
        required: false,
        isMultiple: false,
      },
    ],
    [t, statusOptions]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: isFilterPanelOpen,
      inputs: filterPanelInputs,
      formElements: filterFormElements,
      setFormElements: setFilterFormElements as any,
      closeFilters: () => setIsFilterPanelOpen(false),
      additionalFilterCleanFunction: () =>
        setFilterFormElements((prev) => ({ ...prev, status: "" })),
    }),
    [isFilterPanelOpen, filterPanelInputs, filterFormElements]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={isFilterPanelOpen}
            onChange={() => setIsFilterPanelOpen((prev) => !prev)}
          />
        ),
      },
    ],
    [t, isFilterPanelOpen]
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Shopify Discount"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => {
            setIsAddModalOpen(false);
            setAddDiscountType("ORDER_DISCOUNT");
            setAddMethod("CODE");
            setAddAppliesTo("ALL");
            setAddBuyProductScope("ALL");
            setAddGetProductScope("ALL");
            setAddBxgyDiscountType("FREE");
            setAddBxgyMethod("CODE");
          }}
          inputs={addInputs}
          formKeys={formKeys}
          submitItem={
            ((item: any) => {
              const { discountType, method, ...rest } = item;
              if (discountType === "FREE_SHIPPING") {
                const payload: CreateFreeShippingDiscountPayload = {
                  method: method ?? "CODE",
                  title: rest.title,
                  startsAt: rest.startsAt,
                  endsAt: rest.endsAt || undefined,
                  minimumRequirementType: rest.minimumRequirementType || undefined,
                  minimumRequirementValue: rest.minimumRequirementValue || undefined,
                  ...(method !== "AUTOMATIC" && {
                    code: rest.code,
                    usageLimit: rest.usageLimit || undefined,
                    appliesOncePerCustomer: rest.appliesOncePerCustomer ?? false,
                  }),
                };
                createFreeShippingDiscount(payload);
              } else if (discountType === "PRODUCT_DISCOUNT") {
                const productPayload: CreateProductDiscountPayload = {
                  title: rest.title,
                  code: rest.code,
                  valueType: rest.valueType,
                  value: rest.value,
                  appliesTo: rest.appliesTo ?? "ALL",
                  productIds: rest.productIds?.length ? rest.productIds : undefined,
                  collectionIds: rest.collectionIds?.length ? rest.collectionIds : undefined,
                  startsAt: rest.startsAt,
                  endsAt: rest.endsAt || undefined,
                  minimumRequirementType: rest.minimumRequirementType || undefined,
                  minimumRequirementValue: rest.minimumRequirementValue || undefined,
                  usageLimit: rest.usageLimit || undefined,
                  appliesOncePerCustomer: rest.appliesOncePerCustomer ?? false,
                  combinesWithProductDiscounts: rest.combinesWithProductDiscounts ?? false,
                  combinesWithOrderDiscounts: rest.combinesWithOrderDiscounts ?? false,
                  combinesWithShippingDiscounts: rest.combinesWithShippingDiscounts ?? false,
                };
                createProductDiscount(productPayload);
              } else if (discountType === "BXGY") {
                const bxgyBase = {
                  title: rest.title,
                  startsAt: rest.startsAt,
                  endsAt: rest.endsAt || undefined,
                  buyRequirementType: rest.buyRequirementType ?? "QUANTITY",
                  buyQuantityOrAmount: rest.buyQuantityOrAmount,
                  buyProductScope: rest.buyProductScope ?? "ALL",
                  buyProductIds: rest.buyProductIds?.length ? rest.buyProductIds : undefined,
                  buyCollectionIds: rest.buyCollectionIds?.length ? rest.buyCollectionIds : undefined,
                  getQuantity: rest.getQuantity,
                  getProductScope: rest.getProductScope ?? "ALL",
                  getProductIds: rest.getProductIds?.length ? rest.getProductIds : undefined,
                  getCollectionIds: rest.getCollectionIds?.length ? rest.getCollectionIds : undefined,
                  bxgyDiscountType: rest.bxgyDiscountType ?? "FREE",
                  bxgyDiscountValue: rest.bxgyDiscountValue || undefined,
                  combinesWithProductDiscounts: rest.combinesWithProductDiscounts ?? false,
                  combinesWithOrderDiscounts: rest.combinesWithOrderDiscounts ?? false,
                  combinesWithShippingDiscounts: rest.combinesWithShippingDiscounts ?? false,
                };
                if (rest.bxgyMethod === "AUTOMATIC") {
                  createAutomaticBxgyDiscount(bxgyBase as CreateAutomaticBxgyDiscountPayload);
                } else {
                  const bxgyPayload: CreateBxgyDiscountPayload = {
                    ...bxgyBase,
                    code: rest.code,
                    usageLimit: rest.usageLimit || undefined,
                    appliesOncePerCustomer: rest.appliesOncePerCustomer ?? false,
                  };
                  createBxgyDiscount(bxgyPayload);
                }
              } else if (method === "AUTOMATIC") {
                const autoOrderPayload: CreateAutomaticOrderDiscountPayload = {
                  title: rest.title,
                  valueType: rest.valueType,
                  value: rest.value,
                  startsAt: rest.startsAt,
                  endsAt: rest.endsAt || undefined,
                  minimumRequirementType: rest.minimumRequirementType || undefined,
                  minimumRequirementValue: rest.minimumRequirementValue || undefined,
                  combinesWithProductDiscounts: rest.combinesWithProductDiscounts ?? false,
                  combinesWithOrderDiscounts: rest.combinesWithOrderDiscounts ?? false,
                  combinesWithShippingDiscounts: rest.combinesWithShippingDiscounts ?? false,
                };
                createAutomaticOrderDiscount(autoOrderPayload);
              } else {
                const { method: _m, ...orderPayload } = rest;
                createDiscount(orderPayload as CreateShopifyDiscountPayload);
              }
            }) as any
          }
          topClassName="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
          constantValues={{ discountType: "ORDER_DISCOUNT", method: "CODE", bxgyMethod: "CODE", buyProductScope: "ALL", getProductScope: "ALL", bxgyDiscountType: "FREE" }}
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [t, isAddModalOpen, addInputs, formKeys, createDiscount, createFreeShippingDiscount, createProductDiscount, createBxgyDiscount, createAutomaticBxgyDiscount, createAutomaticOrderDiscount]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          rowToAction.discountKind === "FREE_SHIPPING" ? (
            <GenericAddEditPanel
              isOpen={isEditModalOpen}
              close={() => setIsEditModalOpen(false)}
              inputs={freeShippingEditInputs}
              formKeys={formKeys}
              submitItem={
                ((item: any) => {
                  const updates = item?.updates ?? item;
                  updateFreeShippingDiscount({
                    id: rowToAction._id,
                    ...updates,
                  } as UpdateFreeShippingDiscountPayload);
                }) as unknown as (
                  item: DiscountRow | UpdatePayload<DiscountRow>
                ) => void
              }
              isEditMode={true}
              topClassName="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
              itemToEdit={{
                id: rowToAction._id,
                updates: {
                  title: rowToAction.title,
                  code: rowToAction.code !== "-" ? rowToAction.code : "",
                  startsAt: rowToAction.startsAt,
                  endsAt: rowToAction.endsAt || undefined,
                  minimumRequirementType: rowToAction.minimumRequirementType,
                  minimumRequirementValue: rowToAction.minimumRequirementValue,
                  usageLimit: rowToAction.usageLimit !== "∞" ? Number(rowToAction.usageLimit) : undefined,
                  appliesOncePerCustomer: rowToAction.appliesOncePerCustomer,
                } as any,
              }}
            />
          ) : rowToAction.discountKind === "PRODUCT_DISCOUNT" ? (
            <GenericAddEditPanel
              isOpen={isEditModalOpen}
              close={() => setIsEditModalOpen(false)}
              inputs={productDiscountEditInputs}
              formKeys={formKeys}
              submitItem={
                ((item: any) => {
                  const updates = item?.updates ?? item;
                  updateProductDiscount({
                    id: rowToAction._id,
                    ...updates,
                  } as UpdateProductDiscountPayload);
                }) as unknown as (
                  item: DiscountRow | UpdatePayload<DiscountRow>
                ) => void
              }
              isEditMode={true}
              topClassName="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
              itemToEdit={{
                id: rowToAction._id,
                updates: {
                  title: rowToAction.title,
                  code: rowToAction.code,
                  valueType: rowToAction.valueType,
                  value: rowToAction.value,
                  appliesTo: rowToAction.appliesTo ?? "ALL",
                  productIds: rowToAction.productIds ?? [],
                  collectionIds: rowToAction.collectionIds ?? [],
                  startsAt: rowToAction.startsAt,
                  endsAt: rowToAction.endsAt || undefined,
                  minimumRequirementType: rowToAction.minimumRequirementType,
                  minimumRequirementValue: rowToAction.minimumRequirementValue,
                  usageLimit: rowToAction.usageLimit !== "∞" ? Number(rowToAction.usageLimit) : undefined,
                  appliesOncePerCustomer: rowToAction.appliesOncePerCustomer,
                  combinesWithProductDiscounts: rowToAction.combinesWithProductDiscounts,
                  combinesWithOrderDiscounts: rowToAction.combinesWithOrderDiscounts,
                  combinesWithShippingDiscounts: rowToAction.combinesWithShippingDiscounts,
                } as any,
              }}
            />
          ) : rowToAction.discountKind === "ORDER_DISCOUNT_AUTOMATIC" ? (
            <GenericAddEditPanel
              isOpen={isEditModalOpen}
              close={() => setIsEditModalOpen(false)}
              inputs={editInputs.filter(i => i.formKey !== "code" && i.formKey !== "usageLimit" && i.formKey !== "appliesOncePerCustomer")}
              formKeys={formKeys}
              submitItem={
                ((item: any) => {
                  const updates = item?.updates ?? item;
                  updateAutomaticOrderDiscount({
                    id: rowToAction._id,
                    ...updates,
                  } as UpdateAutomaticOrderDiscountPayload);
                }) as unknown as (
                  item: DiscountRow | UpdatePayload<DiscountRow>
                ) => void
              }
              isEditMode={true}
              topClassName="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
              itemToEdit={{
                id: rowToAction._id,
                updates: {
                  title: rowToAction.title,
                  valueType: rowToAction.valueType,
                  value: rowToAction.value,
                  startsAt: rowToAction.startsAt,
                  endsAt: rowToAction.endsAt || undefined,
                  minimumRequirementType: rowToAction.minimumRequirementType,
                  minimumRequirementValue: rowToAction.minimumRequirementValue,
                  combinesWithProductDiscounts: rowToAction.combinesWithProductDiscounts,
                  combinesWithOrderDiscounts: rowToAction.combinesWithOrderDiscounts,
                  combinesWithShippingDiscounts: rowToAction.combinesWithShippingDiscounts,
                } as any,
              }}
            />
          ) : rowToAction.discountKind === "BXGY_AUTOMATIC" ? (
            <GenericAddEditPanel
              isOpen={isEditModalOpen}
              close={() => setIsEditModalOpen(false)}
              inputs={bxgyEditInputs.filter(i => i.formKey !== "code" && i.formKey !== "usageLimit" && i.formKey !== "appliesOncePerCustomer")}
              formKeys={formKeys}
              submitItem={
                ((item: any) => {
                  const updates = item?.updates ?? item;
                  updateAutomaticBxgyDiscount({
                    id: rowToAction._id,
                    ...updates,
                  } as UpdateAutomaticBxgyDiscountPayload);
                }) as unknown as (
                  item: DiscountRow | UpdatePayload<DiscountRow>
                ) => void
              }
              isEditMode={true}
              topClassName="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
              itemToEdit={{
                id: rowToAction._id,
                updates: {
                  title: rowToAction.title,
                  buyRequirementType: rowToAction.buyRequirementType ?? "QUANTITY",
                  buyQuantityOrAmount: rowToAction.buyQuantityOrAmount,
                  buyProductScope: rowToAction.buyProductScope ?? "ALL",
                  buyProductIds: rowToAction.buyProductIds ?? [],
                  buyCollectionIds: rowToAction.buyCollectionIds ?? [],
                  getQuantity: rowToAction.getQuantity,
                  getProductScope: rowToAction.getProductScope ?? "ALL",
                  getProductIds: rowToAction.getProductIds ?? [],
                  getCollectionIds: rowToAction.getCollectionIds ?? [],
                  bxgyDiscountType: rowToAction.bxgyDiscountType ?? "FREE",
                  bxgyDiscountValue: rowToAction.bxgyDiscountValue,
                  startsAt: rowToAction.startsAt,
                  endsAt: rowToAction.endsAt || undefined,
                  combinesWithProductDiscounts: rowToAction.combinesWithProductDiscounts,
                  combinesWithOrderDiscounts: rowToAction.combinesWithOrderDiscounts,
                  combinesWithShippingDiscounts: rowToAction.combinesWithShippingDiscounts,
                } as any,
              }}
            />
          ) : rowToAction.discountKind === "BXGY" ? (
            <GenericAddEditPanel
              isOpen={isEditModalOpen}
              close={() => setIsEditModalOpen(false)}
              inputs={bxgyEditInputs}
              formKeys={formKeys}
              submitItem={
                ((item: any) => {
                  const updates = item?.updates ?? item;
                  updateBxgyDiscount({
                    id: rowToAction._id,
                    ...updates,
                  } as UpdateBxgyDiscountPayload);
                }) as unknown as (
                  item: DiscountRow | UpdatePayload<DiscountRow>
                ) => void
              }
              isEditMode={true}
              topClassName="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
              itemToEdit={{
                id: rowToAction._id,
                updates: {
                  title: rowToAction.title,
                  code: rowToAction.code,
                  buyRequirementType: rowToAction.buyRequirementType ?? "QUANTITY",
                  buyQuantityOrAmount: rowToAction.buyQuantityOrAmount,
                  buyProductScope: rowToAction.buyProductScope ?? "ALL",
                  buyProductIds: rowToAction.buyProductIds ?? [],
                  buyCollectionIds: rowToAction.buyCollectionIds ?? [],
                  getQuantity: rowToAction.getQuantity,
                  getProductScope: rowToAction.getProductScope ?? "ALL",
                  getProductIds: rowToAction.getProductIds ?? [],
                  getCollectionIds: rowToAction.getCollectionIds ?? [],
                  bxgyDiscountType: rowToAction.bxgyDiscountType ?? "FREE",
                  bxgyDiscountValue: rowToAction.bxgyDiscountValue,
                  startsAt: rowToAction.startsAt,
                  endsAt: rowToAction.endsAt || undefined,
                  usageLimit: rowToAction.usageLimit !== "∞" ? Number(rowToAction.usageLimit) : undefined,
                  appliesOncePerCustomer: rowToAction.appliesOncePerCustomer,
                  combinesWithProductDiscounts: rowToAction.combinesWithProductDiscounts,
                  combinesWithOrderDiscounts: rowToAction.combinesWithOrderDiscounts,
                  combinesWithShippingDiscounts: rowToAction.combinesWithShippingDiscounts,
                } as any,
              }}
            />
          ) : (
            <GenericAddEditPanel
              isOpen={isEditModalOpen}
              close={() => setIsEditModalOpen(false)}
              inputs={editInputs}
              formKeys={formKeys}
              submitItem={
                ((item: any) => {
                  const updates = item?.updates ?? item;
                  updateDiscount({
                    id: rowToAction._id,
                    ...updates,
                  } as UpdateShopifyDiscountPayload);
                }) as unknown as (
                  item: DiscountRow | UpdatePayload<DiscountRow>
                ) => void
              }
              isEditMode={true}
              topClassName="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
              itemToEdit={{
                id: rowToAction._id,
                updates: {
                  title: rowToAction.title,
                  code: rowToAction.code,
                  valueType: rowToAction.valueType,
                  value: rowToAction.value,
                  startsAt: rowToAction.startsAt,
                  endsAt: rowToAction.endsAt || undefined,
                  minimumRequirementType: rowToAction.minimumRequirementType,
                  minimumRequirementValue: rowToAction.minimumRequirementValue,
                  usageLimit: rowToAction.usageLimit !== "∞" ? Number(rowToAction.usageLimit) : undefined,
                  appliesOncePerCustomer: rowToAction.appliesOncePerCustomer,
                  combinesWithProductDiscounts: rowToAction.combinesWithProductDiscounts,
                  combinesWithOrderDiscounts: rowToAction.combinesWithOrderDiscounts,
                  combinesWithShippingDiscounts: rowToAction.combinesWithShippingDiscounts,
                } as any,
              }}
            />
          )
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
      },
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        className: "text-red-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isDeleteModalOpen}
            close={() => setIsDeleteModalOpen(false)}
            confirm={() => {
              deleteDiscount(rowToAction.numericId);
              setIsDeleteModalOpen(false);
            }}
            title={t("Delete")}
            text={t("Are you sure you want to delete this discount?", { code: rowToAction.code })}
          />
        ) : null,
        isModalOpen: isDeleteModalOpen,
        setIsModal: setIsDeleteModalOpen,
        isPath: false,
      },
    ],
    [t, rowToAction, isEditModalOpen, isDeleteModalOpen, editInputs, freeShippingEditInputs, productDiscountEditInputs, bxgyEditInputs, formKeys, updateDiscount, updateFreeShippingDiscount, updateProductDiscount, updateBxgyDiscount, updateAutomaticBxgyDiscount, updateAutomaticOrderDiscount, deleteDiscount]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("Shopify Discounts")}
        addButton={addButton}
        filters={filters}
        filterPanel={filterPanel}
        isActionsActive={true}
        isSearch={false}
        outsideSearchProps={{
          t,
          filterPanelFormElements: filterFormElements,
          setFilterPanelFormElements: setFilterFormElements,
        }}
        rowsPerPageOptions={[RowPerPageEnum.FIRST, RowPerPageEnum.SECOND, RowPerPageEnum.THIRD]}
        {...(pagination && { pagination })}
      />
    </div>
  );
};

export default ShopifyDiscounts;
