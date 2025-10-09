import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpense,
  AccountExpenseType,
  AccountProduct,
  DateRangeKey,
  ExpenseTypes,
  NOTPAID,
  commonDateOptions,
} from "../../types";
import {
  useAccountBrandMutations,
  useGetAccountBrands,
} from "../../utils/api/account/brand";
import {
  useAccountExpenseMutations,
  useAccountExpenseSimpleMutations,
  useGetAccountExpenses,
} from "../../utils/api/account/expense";
import {
  useAccountExpenseTypeMutations,
  useGetAccountExpenseTypes,
} from "../../utils/api/account/expenseType";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import {
  useAccountVendorMutations,
  useGetAccountVendors,
} from "../../utils/api/account/vendor";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStockLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import {
  BackgroundColorInput,
  BrandInput,
  ExpenseTypeInput,
  NameInput,
  PaymentMethodInput,
  ProductInput,
  QuantityInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../panelComponents/FormElements/TextInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Invoice = () => {
  const { t } = useTranslation();
  const {
    productExpenseForm,
    rowsPerPage,
    currentPage,
    setCurrentPage,
    setProductExpenseForm,
  } = useGeneralContext();
  const locations = useGetStockLocations();
  const {
    filterPanelInvoiceFormElements,
    setFilterPanelInvoiceFormElements,
    isInvoiceEnableEdit,
    setIsInvoiceEnableEdit,
    showInvoieFilters,
    setShowInvoieFilters,
    initialFilterPanelInvoiceFormElements,
  } = useFilterContext();
  const invoicesPayload = useGetAccountExpenses(
    currentPage,
    rowsPerPage,
    filterPanelInvoiceFormElements
  );
  const invoices = invoicesPayload?.data;
  const expenseTypes = useGetAccountExpenseTypes();
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
  const [isBrandEditModalOpen, setIsBrandEditModalOpen] = useState(false);
  const [isVendorEditModalOpen, setIsVendorEditModalOpen] = useState(false);
  const [isExpenseTypeEditModalOpen, setIsExpenseTypeEditModalOpen] =
    useState(false);
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const paymentMethods = useGetAccountPaymentMethods();
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddExpenseTypeOpen, setIsAddExpenseTypeOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountExpense>();
  const { createAccountProduct, updateAccountProduct } =
    useAccountProductMutations();
  const { createAccountBrand, updateAccountBrand } = useAccountBrandMutations();
  const { createAccountVendor, updateAccountVendor } =
    useAccountVendorMutations();
  const { createAccountExpenseType, updateAccountExpenseType } =
    useAccountExpenseTypeMutations();
  const [productInputForm, setProductInputForm] = useState({
    brand: [],
    vendor: [],
    expenseType: [],
    name: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountExpense, deleteAccountExpense, updateAccountExpense } =
    useAccountExpenseMutations();
  const { updateAccountExpenseSimple } = useAccountExpenseSimpleMutations();
  const allRows = invoices?.map((invoice) => {
    const foundPaymentMethod = getItem(invoice?.paymentMethod, paymentMethods);
    return {
      ...invoice,
      product: getItem(invoice?.product, products)?.name,
      expenseType: getItem(invoice?.expenseType, expenseTypes)?.name,
      brand: getItem(invoice?.brand, brands)?.name,
      vendor: getItem(invoice?.vendor, vendors)?.name,
      lctn: getItem(invoice?.location, locations)?.name,
      formattedDate: formatAsLocalDate(invoice?.date),
      untPrice: parseFloat(
        (invoice?.totalExpense / invoice?.quantity).toFixed(2)
      ),
      expType: getItem(invoice?.expenseType, expenseTypes),
      brnd: getItem(invoice?.brand, brands),
      vndr: getItem(invoice?.vendor, vendors),
      prdct: getItem(invoice?.product, products),
      paymentMethodName: t(foundPaymentMethod?.name ?? ""),
      foundPaymentMethod: foundPaymentMethod,
    };
  });
  const [rows, setRows] = useState(allRows);
  // open add modal on ` key press
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "q" && event.ctrlKey) {
        event.preventDefault();
        setIsAddModalOpen(true);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    // Cleanup function
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  const filterPanelInputs = [
    ProductInput({
      products: products,
      required: true,
      isMultiple: true,
    }),
    VendorInput({ vendors: vendors, required: true }),
    BrandInput({ brands: brands, required: true }),
    ExpenseTypeInput({ expenseTypes: expenseTypes, required: true }),
    PaymentMethodInput({
      paymentMethods: paymentMethods?.filter((pm) => pm?.isUsedAtExpense),
      required: true,
      isMultiple: true,
    }),
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "date",
      label: t("Date"),
      options: commonDateOptions.map((option) => {
        return {
          value: option.value,
          label: t(option.label),
        };
      }),
      placeholder: t("Date"),
      required: true,
      additionalOnChange: ({
        value,
        label,
      }: {
        value: string;
        label: string;
      }) => {
        const dateRange = dateRanges[value as DateRangeKey];
        if (dateRange) {
          setFilterPanelInvoiceFormElements({
            ...filterPanelInvoiceFormElements,
            ...dateRange(),
          });
        }
      },
    },
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
  ];
  const productInputs = [
    NameInput(),
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      isMultiple: true,
      required: true,
    }),
    VendorInput({ vendors: vendors, isMultiple: true, required: true }),
    BrandInput({ brands: brands, isMultiple: true }),
  ];
  const productFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
  ];

  const nameInput = [NameInput()];
  const nameFormKey = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const expenseTypeInputs = [NameInput(), BackgroundColorInput()];
  const expenseTypeFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
  ];
  const inputs = [
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDateInitiallyOpen: false,
    },
    ProductInput({
      products: products,
      required: true,
      invalidateKeys: [
        { key: "expenseType", defaultValue: "" },
        { key: "brand", defaultValue: "" },
        { key: "vendor", defaultValue: "" },
      ],
    }),
    ExpenseTypeInput({
      expenseTypes:
        expenseTypes.filter((exp) =>
          products
            .find((prod) => prod._id === productExpenseForm?.product)
            ?.expenseType.includes(exp._id)
        ) ?? [],
      required: true,
    }),
    StockLocationInput({ locations }),
    BrandInput({
      brands:
        brands?.filter((brnd) =>
          products
            .find((prod) => prod._id === productExpenseForm?.product)
            ?.brand?.includes(brnd._id)
        ) ?? [],
    }),
    VendorInput({
      vendors:
        vendors?.filter((vndr) =>
          products
            .find((prod) => prod._id === productExpenseForm?.product)
            ?.vendor?.includes(vndr._id)
        ) ?? [],
      required: true,
    }),
    PaymentMethodInput({
      paymentMethods: paymentMethods?.filter((pm) => pm?.isUsedAtExpense),
      required: true,
    }),
    {
      type: InputTypes.CHECKBOX,
      formKey: "isStockIncrement",
      label: t("Stock Increment"),
      placeholder: t("Stock Increment"),
      required: false,
      isDisabled: isEditModalOpen,
      isTopFlexRow: true,
    },
    QuantityInput(),
    {
      type: InputTypes.CHECKBOX,
      formKey: "isAfterCount",
      label: t("Is After Count"),
      placeholder: t("Is After Count"),
      required: true,
      isTopFlexRow: true,
    },
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "note", type: FormKeyTypeEnum.STRING },
    { key: "paymentMethod", type: FormKeyTypeEnum.STRING },
    { key: "isStockIncrement", type: FormKeyTypeEnum.BOOLEAN },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "isAfterCount", type: FormKeyTypeEnum.BOOLEAN },
  ];
  const columns = [
    {
      key: "ID",
      isSortable: true,
      className: "pl-2",
      correspondingKey: "_id",
    },
    {
      key: t("Date"),
      isSortable: false,
      correspondingKey: "date",
    },
    {
      key: t("Note"),
      isSortable: false,
      correspondingKey: "note",
    },
    {
      key: t("Brand"),
      className: "min-w-32 pr-2",
      isSortable: false,
      isAddable: isInvoiceEnableEdit,
      onClick: () => setIsAddBrandOpen(true),
      correspondingKey: "brand",
    },
    {
      key: t("Vendor"),
      className: "min-w-32 pr-2",
      isSortable: false,
      isAddable: isInvoiceEnableEdit,
      onClick: () => setIsAddVendorOpen(true),
      correspondingKey: "vendor",
    },
    {
      key: t("Location"),
      isSortable: false,
      isAddable: isInvoiceEnableEdit,
      correspondingKey: "location",
    },
    {
      key: t("Expense Type"),
      isSortable: false,
      isAddable: isInvoiceEnableEdit,
      onClick: () => setIsAddExpenseTypeOpen(true),
      correspondingKey: "expenseType",
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: false,
      isAddable: isInvoiceEnableEdit,
      onClick: () => setIsAddProductOpen(true),
      correspondingKey: "product",
    },
    {
      key: t("Payment Method"),
      className: `${isInvoiceEnableEdit ? "min-w-40" : "min-w-32 "}`,
      isSortable: false,
      correspondingKey: "paymentMethod",
    },
    {
      key: t("Quantity"),
      isSortable: false,
      correspondingKey: "quantity",
    },
    { key: t("Is After Count"), isSortable: true },
    { key: t("Stock Increment"), isSortable: true },
    { key: t("Unit Price"), isSortable: false },
    {
      key: t("Total Expense"),
      isSortable: true,
      correspondingKey: "totalExpense",
    },
  ];
  const rowKeys = [
    { key: "_id", className: "min-w-32 px-2" },
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row.formattedDate;
      },
    },
    { key: "note", className: "min-w-40 pr-2" },
    {
      key: "brand",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isInvoiceEnableEdit) return;
              setIsBrandEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={` min-w-32 pr-2 ${
                isInvoiceEnableEdit
                  ? "text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  : ""
              }`}
            >
              {row.brand ?? "-"}
            </p>
          </div>
        );
      },
    },
    {
      key: "vendor",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isInvoiceEnableEdit) return;
              setIsVendorEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={`min-w-32 pr-2 ${
                isInvoiceEnableEdit
                  ? "text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  : ""
              }`}
            >
              {row.vendor ?? "-"}
            </p>
          </div>
        );
      },
    },
    {
      key: "lctn",
      node: (row: any) => {
        return (
          <div>
            <p className={` min-w-32 pr-4`}>{row.lctn ?? "-"}</p>
          </div>
        );
      },
    },
    {
      key: "expenseType",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isInvoiceEnableEdit) return;
              setIsExpenseTypeEditModalOpen(true);
              setCurrentRow(row);
            }}
            className=" min-w-32"
          >
            <p
              className={`w-fit rounded-md text-sm ml-2 px-2 py-1 font-semibold  ${
                isInvoiceEnableEdit
                  ? "text-blue-700 w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  : "text-white"
              }`}
              style={{
                backgroundColor: row?.expType?.backgroundColor,
              }}
            >
              {(row?.expType as AccountExpenseType)?.name}
            </p>
          </div>
        );
      },
    },
    {
      key: "product",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isInvoiceEnableEdit) return;
              setIsProductEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={` min-w-32 pr-2 ${
                isInvoiceEnableEdit
                  ? "text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  : ""
              }`}
            >
              {row.product}
            </p>
          </div>
        );
      },
    },
    { key: "paymentMethodName", className: "min-w-32" },
    { key: "quantity", className: "min-w-32" },
    {
      key: "isAfterCount",
      node: (row: any) => {
        return isInvoiceEnableEdit ? (
          <SwitchButton
            checked={row?.isAfterCount}
            onChange={() => {
              updateAccountExpenseSimple({
                id: row._id,
                updates: {
                  ...row,
                  product: invoices?.find((invoice) => invoice?._id === row._id)
                    ?.product,
                  expenseType: invoices?.find(
                    (invoice) => invoice?._id === row._id
                  )?.expenseType,
                  quantity: row.quantity,
                  totalExpense: row.totalExpense,
                  brand: invoices?.find((invoice) => invoice?._id === row._id)
                    ?.brand,
                  vendor: invoices?.find((invoice) => invoice?._id === row._id)
                    ?.vendor,
                  isAfterCount: !row?.isAfterCount,
                },
              });
            }}
          />
        ) : row?.isAfterCount ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        );
      },
    },
    {
      key: "isStockIncrement",
      node: (row: any) => {
        return row?.isStockIncrement ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        );
      },
    },
    {
      key: "untPrice",
      isParseFloat: true,
      className: "min-w-32",
    },
    {
      key: "totalExpense",
      isParseFloat: true,
      className: "min-w-32",
    },
  ];
  const addButton = {
    name: t(`Add Invoice`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isCancelConfirmationDialogExist={true}
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={[
          ...inputs,
          {
            type: InputTypes.NUMBER,
            formKey: "price",
            label: t("Price"),
            placeholder: t("Price"),
            required: true,
            isMinNumber: false,
          },
          {
            type: InputTypes.NUMBER,
            formKey: "kdv",
            label: t("Vat") + "%",
            placeholder: t("Vat") + "%",
            required: true,
          },
          {
            type: InputTypes.TEXTAREA,
            formKey: "note",
            label: t("Note"),
            placeholder: t("Note"),
            required: false,
          },
        ]}
        formKeys={[
          ...formKeys,
          { key: "price", type: FormKeyTypeEnum.NUMBER },
          { key: "kdv", type: FormKeyTypeEnum.NUMBER },
        ]}
        additionalCancelFunction={() => {
          setProductExpenseForm({});
        }}
        submitFunction={() => {
          productExpenseForm.price &&
            productExpenseForm.kdv &&
            createAccountExpense({
              ...productExpenseForm,
              paymentMethod:
                productExpenseForm.paymentMethod === NOTPAID
                  ? ""
                  : productExpenseForm.paymentMethod,
              isPaid:
                productExpenseForm.paymentMethod === NOTPAID ? false : true,
              type: ExpenseTypes.STOCKABLE,
              totalExpense:
                Number(productExpenseForm.price) +
                Number(productExpenseForm.kdv) *
                  (Number(productExpenseForm.price) / 100),
            });
          setProductExpenseForm({});
        }}
        submitItem={createAccountExpense as any}
        generalClassName="overflow-scroll min-w-[90%]"
        anotherPanelTopClassName=""
        topClassName="flex flex-col gap-2"
        nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
        setForm={setProductExpenseForm}
        constantValues={{
          isStockIncrement: true,
          date: format(new Date(), "yyyy-MM-dd"),
          isAfterCount: true,
          ...productExpenseForm,
        }}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
  };
  const actions = [
    {
      name: t("Delete"),
      isDisabled: !isInvoiceEnableEdit,
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteAccountExpense(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Invoice"
          text={`${rowToAction.product} invoice will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      isDisabled: !isInvoiceEnableEdit,
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          additionalCancelFunction={() => {
            setProductExpenseForm({});
          }}
          additionalSubmitFunction={() => {
            setProductExpenseForm({});
          }}
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={[
            ...inputs,
            {
              type: InputTypes.NUMBER,
              formKey: "totalExpense",
              label: t("Total Expense"),
              placeholder: t("Total Expense"),
              required: true,
            },
            {
              type: InputTypes.TEXTAREA,
              formKey: "note",
              label: t("Note"),
              placeholder: t("Note"),
              required: false,
            },
          ]}
          formKeys={[
            ...formKeys,
            { key: "totalExpense", type: FormKeyTypeEnum.NUMBER },
          ]}
          setForm={setProductExpenseForm}
          submitItem={updateAccountExpense as any}
          isEditMode={true}
          generalClassName="overflow-scroll min-w-[90%]"
          anotherPanelTopClassName=""
          topClassName="flex flex-col gap-2"
          nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              ...rowToAction,
              date: rowToAction.date,
              product: invoices?.find(
                (invoice) => invoice?._id === rowToAction._id
              )?.product,
              expenseType: invoices?.find(
                (invoice) => invoice?._id === rowToAction._id
              )?.expenseType,
              quantity: rowToAction.quantity,
              totalExpense: rowToAction.totalExpense,
              brand: invoices?.find(
                (invoice) => invoice?._id === rowToAction._id
              )?.brand,
              vendor: invoices?.find(
                (invoice) => invoice?._id === rowToAction._id
              )?.vendor,
            },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];
  const tableFilters = [
    {
      label: t("Total") + " :",
      isUpperSide: false,
      node: (
        <div className="flex flex-row gap-2">
          <p>
            {new Intl.NumberFormat("tr-TR", {
              style: "decimal",
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }).format(invoicesPayload?.generalTotalExpense ?? 0)}{" "}
            ₺
          </p>
        </div>
      ),
    },
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={isInvoiceEnableEdit}
          onChange={() => {
            setIsInvoiceEnableEdit(!isInvoiceEnableEdit);
          }}
        />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showInvoieFilters}
          onChange={() => {
            setShowInvoieFilters(!showInvoieFilters);
          }}
        />
      ),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showInvoieFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelInvoiceFormElements,
    setFormElements: setFilterPanelInvoiceFormElements,
    closeFilters: () => setShowInvoieFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelInvoiceFormElements(initialFilterPanelInvoiceFormElements);
    },
  };
  const pagination = invoicesPayload
    ? {
        totalPages: invoicesPayload.totalPages,
        totalRows: invoicesPayload.totalNumber,
      }
    : null;
  const outsideSearch = () => {
    return (
      <TextInput
        placeholder={t("Search")}
        type="text"
        value={filterPanelInvoiceFormElements.search}
        isDebounce={true}
        onChange={(value) =>
          setFilterPanelInvoiceFormElements({
            ...filterPanelInvoiceFormElements,
            search: value,
          })
        }
      />
    );
  };
  const outsideSort = {
    filterPanelFormElements: filterPanelInvoiceFormElements,
    setFilterPanelFormElements: setFilterPanelInvoiceFormElements,
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelInvoiceFormElements]);
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(allRows);
  }, [
    invoicesPayload,
    products,
    expenseTypes,
    brands,
    vendors,
    locations,
    paymentMethods,
  ]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          isActionsAtFront={isInvoiceEnableEdit}
          actions={actions}
          filters={tableFilters}
          outsideSortProps={outsideSort}
          outsideSearch={outsideSearch}
          isActionsActive={isInvoiceEnableEdit} //this seems wrong but for actions to appear in the first column it should be like this
          columns={
            isInvoiceEnableEdit
              ? [{ key: t("Action"), isSortable: false }, ...columns]
              : columns
          }
          rows={rows ?? []}
          title={t("Product Expenses")}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          {...(pagination && { pagination })}
        />
        {isAddProductOpen && (
          <GenericAddEditPanel
            isOpen={isAddProductOpen}
            close={() => setIsAddProductOpen(false)}
            inputs={productInputs}
            formKeys={productFormKeys}
            setForm={setProductInputForm}
            submitItem={createAccountProduct as any}
            generalClassName="overflow-visible"
            topClassName="flex flex-col gap-2 "
            submitFunction={() => {
              createAccountProduct(productInputForm);
              setProductInputForm({
                brand: [],
                vendor: [],
                expenseType: [],
                name: "",
              });
            }}
          />
        )}
        {isAddBrandOpen && (
          <GenericAddEditPanel
            isOpen={isAddBrandOpen}
            close={() => setIsAddBrandOpen(false)}
            inputs={nameInput}
            formKeys={nameFormKey}
            submitItem={createAccountBrand as any}
            topClassName="flex flex-col gap-2 "
          />
        )}
        {isAddVendorOpen && (
          <GenericAddEditPanel
            isOpen={isAddVendorOpen}
            close={() => setIsAddVendorOpen(false)}
            inputs={nameInput}
            formKeys={nameFormKey}
            submitItem={createAccountVendor as any}
            topClassName="flex flex-col gap-2 "
          />
        )}
        {isAddExpenseTypeOpen && (
          <GenericAddEditPanel
            isOpen={isAddExpenseTypeOpen}
            close={() => setIsAddExpenseTypeOpen(false)}
            inputs={expenseTypeInputs}
            formKeys={expenseTypeFormKeys}
            submitItem={createAccountExpenseType as any}
            topClassName="flex flex-col gap-2 "
          />
        )}
        {isProductEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isProductEditModalOpen}
            close={() => setIsProductEditModalOpen(false)}
            inputs={productInputs}
            formKeys={productFormKeys}
            generalClassName="overflow-scroll"
            submitItem={updateAccountProduct as any}
            setForm={setProductInputForm}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            constantValues={{
              name: (currentRow.prdct as AccountProduct).name,
              expenseType: (currentRow.prdct as AccountProduct).expenseType,
              brand: (currentRow.prdct as AccountProduct).brand,
              vendor: (currentRow.prdct as AccountProduct).vendor,
            }}
            handleUpdate={() => {
              updateAccountProduct({
                id: (currentRow.prdct as AccountProduct)?._id,
                updates: {
                  ...productInputForm,
                },
              });
            }}
          />
        )}
        {isBrandEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isBrandEditModalOpen}
            close={() => setIsBrandEditModalOpen(false)}
            inputs={nameInput}
            formKeys={nameFormKey}
            submitItem={updateAccountBrand as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: currentRow.brnd._id, updates: currentRow.brnd }}
          />
        )}
        {isVendorEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isVendorEditModalOpen}
            close={() => setIsVendorEditModalOpen(false)}
            inputs={nameInput}
            formKeys={nameFormKey}
            submitItem={updateAccountVendor as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: currentRow.vndr._id, updates: currentRow.vndr }}
          />
        )}

        {isExpenseTypeEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isExpenseTypeEditModalOpen}
            close={() => setIsExpenseTypeEditModalOpen(false)}
            inputs={expenseTypeInputs}
            formKeys={expenseTypeFormKeys}
            submitItem={updateAccountExpenseType as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{
              id: currentRow.expType._id,
              updates: currentRow.expType,
            }}
          />
        )}
      </div>
    </>
  );
};

export default Invoice;
