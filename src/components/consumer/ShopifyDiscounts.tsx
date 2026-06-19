import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { UpdatePayload } from "../../utils/api";
import {
  CreateShopifyDiscountPayload,
  UpdateShopifyDiscountPayload,
  useCreateShopifyDiscountMutation,
  useDeleteShopifyDiscountMutation,
  useGetShopifyDiscountsPaginated,
  useUpdateShopifyDiscountMutation,
} from "../../utils/api/shopify";
import { FormElementsState, RowPerPageEnum, ShopifyDiscountNode } from "../../types";
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
}

const DISCOUNT_TYPE_OPTIONS = [
  { value: "ORDER_DISCOUNT", label: "Siparişte İndirim Tutarı" },
  { value: "PRODUCT_DISCOUNT", label: "Ürünlerde İndirim Tutarı (Yakında)", isDisabled: true },
  { value: "BXGY", label: "X Alana Y Kazan (Yakında)", isDisabled: true },
  { value: "FREE_SHIPPING", label: "Ücretsiz Kargo (Yakında)", isDisabled: true },
];

const VALUE_TYPE_OPTIONS = [
  { value: "PERCENTAGE", label: "Yüzde (%)" },
  { value: "FIXED_AMOUNT", label: "Sabit Tutar (₺)" },
];

const MIN_REQ_OPTIONS = [
  { value: "NONE", label: "Minimum Koşul Yok" },
  { value: "SUBTOTAL", label: "Minimum Sepet Tutarı (₺)" },
  { value: "QUANTITY", label: "Minimum Ürün Adedi" },
];

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
  return (
    <button
      type="button"
      onClick={() => {
        const code = generateDiscountCode();
        setFormElements?.((prev: any) => ({ ...prev, code }));
      }}
      className="self-start text-xs text-blue-500 hover:text-blue-700 underline cursor-pointer mt-0.5"
    >
      Rastgele Oluştur
    </button>
  );
}

const STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Aktif" },
  { value: "EXPIRED", label: "Süresi Dolmuş" },
  { value: "SCHEDULED", label: "Planlanmış" },
];

function nodeToRow(n: ShopifyDiscountNode): DiscountRow {
  const cd = n.codeDiscount as any;
  const codeNode = cd.codes?.edges?.[0]?.node;
  const numericId = n.id.split("/").pop() ?? n.id;

  let valueType = "";
  let value = 0;
  const cgValue = cd.customerGets?.value;
  if (cgValue) {
    if ("percentage" in cgValue) {
      valueType = "PERCENTAGE";
      value = Math.round(cgValue.percentage * 100);
    } else if ("amount" in cgValue) {
      valueType = "FIXED_AMOUNT";
      value = parseFloat(cgValue.amount?.amount ?? "0");
    }
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

  return {
    _id: n.id,
    numericId,
    title: cd.title ?? "",
    code: codeNode?.code ?? "",
    status: cd.status ?? "",
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
  };
}

const ShopifyDiscounts = () => {
  const { t } = useTranslation();
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

  const { mutate: createDiscount } = useCreateShopifyDiscountMutation();
  const { mutate: updateDiscount } = useUpdateShopifyDiscountMutation();
  const { mutate: deleteDiscount } = useDeleteShopifyDiscountMutation();

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
        node: (row: DiscountRow) =>
          row.valueType === "PERCENTAGE" ? t("Percentage") : t("Fixed Amount"),
      },
      {
        key: "value",
        node: (row: DiscountRow) =>
          row.valueType === "PERCENTAGE" ? `%${row.value}` : `₺${row.value}`,
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

  const formKeys = useMemo(
    () => [
      { key: "discountType", type: FormKeyTypeEnum.STRING },
      { key: "title", type: FormKeyTypeEnum.STRING },
      { key: "code", type: FormKeyTypeEnum.STRING },
      { key: "valueType", type: FormKeyTypeEnum.STRING },
      { key: "value", type: FormKeyTypeEnum.NUMBER },
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
        label: t("Discount Method"),
        options: DISCOUNT_TYPE_OPTIONS,
        placeholder: t("Select discount method"),
        required: true,
      },
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
        options: VALUE_TYPE_OPTIONS,
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
        options: MIN_REQ_OPTIONS,
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
    [t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: STATUS_OPTIONS,
        placeholder: t("All"),
        required: false,
        isMultiple: false,
      },
    ],
    [t]
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
          close={() => setIsAddModalOpen(false)}
          inputs={addInputs}
          formKeys={formKeys}
          submitItem={
            ((item: any) => {
              const { discountType: _dt, ...payload } = item;
              createDiscount(payload as CreateShopifyDiscountPayload);
            }) as unknown as (
              item: CreateShopifyDiscountPayload | UpdatePayload<CreateShopifyDiscountPayload>
            ) => void
          }
          topClassName="flex flex-col gap-2 max-h-[70vh] overflow-y-auto"
          constantValues={{ discountType: "ORDER_DISCOUNT" }}
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [t, isAddModalOpen, addInputs, formKeys, createDiscount]
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
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={addInputs}
            formKeys={formKeys}
            submitItem={
              ((item: Partial<DiscountRow> & { discountType?: string }) => {
                const { discountType: _dt, ...rest } = item;
                updateDiscount({
                  id: rowToAction._id,
                  ...rest,
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
                discountType: "ORDER_DISCOUNT",
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
    [t, rowToAction, isEditModalOpen, isDeleteModalOpen, addInputs, formKeys, updateDiscount, deleteDiscount]
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
