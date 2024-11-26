import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpense,
  AccountExpenseType,
  AccountProduct,
  commonDateOptions,
  DateRangeKey,
  ExpenseTypes,
  NOTPAID,
} from "../../types";
import {
  useAccountBrandMutations,
  useGetAccountBrands,
} from "../../utils/api/account/brand";
import {
  useAccountExpenseMutations,
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
  useAccountStockLocationMutations,
  useGetAccountStockLocations,
} from "../../utils/api/account/stockLocation";
import {
  useAccountVendorMutations,
  useGetAccountVendors,
} from "../../utils/api/account/vendor";
import { dateRanges } from "../../utils/api/dateRanges";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { outsideSort } from "../../utils/outsideSort";
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
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

const Invoice = () => {
  const { t } = useTranslation();
  const {
    productExpenseForm,
    rowsPerPage,
    currentPage,
    setCurrentPage,
    setProductExpenseForm,
  } = useGeneralContext();
  const locations = useGetAccountStockLocations();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      service: [],
      type: ExpenseTypes.STOCKABLE,
      vendor: "",
      brand: "",
      expenseType: "",
      location: "",
      date: "",
      before: "",
      after: "",
      sort: "",
      asc: 1,
    });
  const invoicesPayload = useGetAccountExpenses(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const invoices = invoicesPayload?.data;
  const expenseTypes = useGetAccountExpenseTypes();
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
  const [isBrandEditModalOpen, setIsBrandEditModalOpen] = useState(false);
  const [isVendorEditModalOpen, setIsVendorEditModalOpen] = useState(false);
  const [isLocationEditModalOpen, setIsLocationEditModalOpen] = useState(false);
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
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isAddExpenseTypeOpen, setIsAddExpenseTypeOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountExpense>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isTransferEdit, setIsTransferEdit] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const { createAccountProduct, updateAccountProduct } =
    useAccountProductMutations();
  const { createAccountStockLocation, updateAccountStockLocation } =
    useAccountStockLocationMutations();
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
  const allRows = invoices?.map((invoice) => {
    return {
      ...invoice,
      product: getItem(invoice?.product, products)?.name,
      expenseType: getItem(invoice?.expenseType, expenseTypes)?.name,
      brand: getItem(invoice?.brand, brands)?.name,
      vendor: getItem(invoice?.vendor, vendors)?.name,
      lctn: getItem(invoice?.location, locations)?.name,
      formattedDate: formatAsLocalDate(invoice?.date),
      unitPrice: parseFloat(
        (invoice?.totalExpense / invoice?.quantity).toFixed(4)
      ),
      expType: getItem(invoice?.expenseType, expenseTypes),
      brnd: getItem(invoice?.brand, brands),
      vndr: getItem(invoice?.vendor, vendors),
      prdct: getItem(invoice?.product, products),
      paymentMethodName: t(
        getItem(invoice?.paymentMethod, paymentMethods)?.name ?? ""
      ),
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
          setFilterPanelFormElements({
            ...filterPanelFormElements,
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
      isDateInitiallyOpen: true,
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
      paymentMethods: paymentMethods,
      required: true,
    }),
    {
      type: InputTypes.CHECKBOX,
      formKey: "isStockIncrement",
      label: t("Stock Increment"),
      placeholder: t("Stock Increment"),
      required: false,
      isTopFlexRow: true,
    },
    QuantityInput(),
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
  ];
  const columns = [
    {
      key: "ID",
      isSortable: true,
      className: "pl-2",
      outsideSort: outsideSort(
        "_id",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Date"),
      isSortable: false,
      outsideSort: outsideSort(
        "date",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Note"),
      isSortable: false,
      outsideSort: outsideSort(
        "note",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Brand"),
      className: "min-w-32 pr-2",
      isSortable: false,
      isAddable: isEnableEdit,
      onClick: () => setIsAddBrandOpen(true),
      outsideSort: outsideSort(
        "brand",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Vendor"),
      className: "min-w-32 pr-2",
      isSortable: false,
      isAddable: isEnableEdit,
      onClick: () => setIsAddVendorOpen(true),
      outsideSort: outsideSort(
        "vendor",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Location"),
      isSortable: false,
      isAddable: isEnableEdit,
      onClick: () => setIsAddLocationOpen(true),
      outsideSort: outsideSort(
        "location",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Expense Type"),
      isSortable: false,
      isAddable: isEnableEdit,
      onClick: () => setIsAddExpenseTypeOpen(true),
      outsideSort: outsideSort(
        "expenseType",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: false,
      isAddable: isEnableEdit,
      onClick: () => setIsAddProductOpen(true),
      outsideSort: outsideSort(
        "product",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Payment Method"),
      className: `${isEnableEdit ? "min-w-40" : "min-w-32 "}`,
      isSortable: false,
      outsideSort: outsideSort(
        "paymentMethod",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    {
      key: t("Quantity"),
      isSortable: false,
      outsideSort: outsideSort(
        "quantity",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
    },
    { key: t("Unit Price"), isSortable: false },
    {
      key: t("Total Expense"),
      isSortable: true,
      outsideSort: outsideSort(
        "totalExpense",
        filterPanelFormElements,
        setFilterPanelFormElements
      ),
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
              if (!isEnableEdit) return;
              setIsBrandEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={` min-w-32 pr-2 ${
                isEnableEdit
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
              if (!isEnableEdit) return;
              setIsVendorEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={`min-w-32 pr-2 ${
                isEnableEdit
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
          <div
            onClick={() => {
              if (!isEnableEdit) return;
              setIsLocationEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={` min-w-32 pr-4 ${
                isEnableEdit
                  ? "text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  : ""
              }`}
            >
              {row.lctn ?? "-"}
            </p>
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
              if (!isEnableEdit) return;
              setIsExpenseTypeEditModalOpen(true);
              setCurrentRow(row);
            }}
            className=" min-w-32"
          >
            <p
              className={`w-fit rounded-md text-sm ml-2 px-2 py-1 font-semibold  ${
                isEnableEdit
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
              if (!isEnableEdit) return;
              setIsProductEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={` min-w-32 pr-2 ${
                isEnableEdit
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
      key: "unitPrice",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>{row.unitPrice} ₺</P1>
          </div>
        );
      },
    },
    {
      key: "totalExpense",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>
              {parseFloat(row.totalExpense)
                .toFixed(4)
                .replace(/\.?0*$/, "")}{" "}
              ₺
            </P1>
          </div>
        );
      },
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
        generalClassName="overflow-scroll"
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
        topClassName="flex flex-col gap-2 "
        setForm={setProductExpenseForm}
        constantValues={{
          isStockIncrement: true,
          date: format(new Date(), "yyyy-MM-dd"),
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
    // {
    //   name: "Transfer Service",
    //   isDisabled: !isTransferEdit,
    //   icon: <TbTransferIn />,
    //   setRow: setRowToAction,
    //   node: (row: AccountExpense) => {
    //     return (
    //       <ButtonTooltip content={t("Transfer to Service")}>
    //         <TbTransferIn
    //           className="text-green-500 cursor-pointer text-2xl"
    //           onClick={() => transferToServiceInvoice({ id: row._id })}
    //         />
    //       </ButtonTooltip>
    //     );
    //   },
    //   className: "text-green-500 cursor-pointer text-2xl  ",
    //   isModal: false,
    //   isPath: false,
    // },
    {
      name: t("Delete"),
      isDisabled: !isEnableEdit,
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
      isDisabled: !isEnableEdit,
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
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-scroll"
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
              note: rowToAction.note,
              location: rowToAction.location,
              paymentMethod: rowToAction?.paymentMethod,
              isStockIncrement: rowToAction?.isStockIncrement,
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
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
    {
      label: t("Enable Transfer"),
      isUpperSide: true,
      node: (
        <SwitchButton checked={isTransferEdit} onChange={setIsTransferEdit} />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    isApplyButtonActive: true,
  };
  const pagination = invoicesPayload
    ? {
        totalPages: invoicesPayload.totalPages,
        totalRows: invoicesPayload.totalNumber,
      }
    : null;
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements]);
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
          isActionsAtFront={isEnableEdit}
          actions={actions}
          filters={tableFilters}
          isActionsActive={false} //this seems wrong but for actions to appear in the first column it should be like this
          columns={
            isEnableEdit || isTransferEdit
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
            submitFunction={() => {
              createAccountProduct(productInputForm);
              setProductInputForm({
                brand: [],
                vendor: [],
                expenseType: [],
                name: "",
              });
            }}
            topClassName="flex flex-col gap-2 "
          />
        )}
        {isAddLocationOpen && (
          <GenericAddEditPanel
            isOpen={isAddLocationOpen}
            close={() => setIsAddLocationOpen(false)}
            inputs={nameInput}
            formKeys={nameFormKey}
            submitItem={createAccountStockLocation as any}
            topClassName="flex flex-col gap-2 "
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
        {isLocationEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isLocationEditModalOpen}
            close={() => setIsLocationEditModalOpen(false)}
            inputs={nameInput}
            formKeys={nameFormKey}
            submitItem={updateAccountStockLocation as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{
              id: currentRow.location._id,
              updates: currentRow.location,
            }}
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
