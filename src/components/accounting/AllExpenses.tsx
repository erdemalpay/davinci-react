import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpenseType,
  ExpenseTypes,
  NOTPAID,
  commonDateOptions,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import {
  useAccountExpenseMutations,
  useGetAccountExpenses,
} from "../../utils/api/account/expense";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountServices } from "../../utils/api/account/service";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  ExpenseTypeInput,
  PaymentMethodInput,
  ProductInput,
  QuantityInput,
  ServiceInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../panelComponents/FormElements/TextInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
type FormElementsState = {
  [key: string]: any;
};

const AllExpenses = () => {
  const { t } = useTranslation();
  const paymentMethods = useGetAccountPaymentMethods();
  const {
    searchQuery,
    rowsPerPage,
    currentPage,
    setCurrentPage,
    allExpenseForm,
    setAllExpenseForm,
  } = useGeneralContext();
  const {
    filterAllExpensesPanelFormElements,
    setFilterAllExpensesPanelFormElements,
    showAllExpensesFilters,
    setShowAllExpensesFilters,
  } = useFilterContext();
  const invoicesPayload = useGetAccountExpenses(
    currentPage,
    rowsPerPage,
    filterAllExpensesPanelFormElements
  );
  const invoices = invoicesPayload?.data;
  const locations = useGetStockLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const products = useGetAccountProducts();
  const services = useGetAccountServices();
  const [tableKey, setTableKey] = useState(0);
  const { createAccountExpense } = useAccountExpenseMutations();
  const allRows = invoices
    ?.map((invoice) => {
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
        service: getItem(invoice?.service, services)?.name,
      };
    })
    ?.sort((a, b) => {
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });
  const [rows, setRows] = useState(allRows);
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Expense Category"),
      options: Object.entries(ExpenseTypes).map((item) => {
        return {
          value: item[1],
          label: t(item[1]),
        };
      }),
      invalidateKeys: [
        { key: "product", defaultValue: "" },
        { key: "service", defaultValue: "" },
      ],
      placeholder: t("Expense Category"),
      isMultiple: false,
      required: true,
    },
    ProductInput({
      products: products,
      required: true,
      isDisabled:
        filterAllExpensesPanelFormElements?.type !== ExpenseTypes.STOCKABLE,
    }),

    ServiceInput({
      services: services,
      required: true,
      isDisabled:
        filterAllExpensesPanelFormElements?.type !== ExpenseTypes.NONSTOCKABLE,
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
  const expenseTypeInputOptions = () => {
    if (allExpenseForm?.type === ExpenseTypes.STOCKABLE) {
      return (
        expenseTypes.filter((exp) =>
          products
            .find((prod) => prod._id === allExpenseForm?.product)
            ?.expenseType.includes(exp._id)
        ) ?? []
      );
    } else if (allExpenseForm?.type === ExpenseTypes.NONSTOCKABLE) {
      return (
        expenseTypes.filter((exp) =>
          services
            .find((item) => item._id === allExpenseForm?.service)
            ?.expenseType.includes(exp._id)
        ) ?? []
      );
    } else {
      return [];
    }
  };
  const brandInputOptions = () => {
    if (allExpenseForm?.type === ExpenseTypes.STOCKABLE) {
      return (
        brands?.filter((brnd) =>
          products
            .find((prod) => prod._id === allExpenseForm?.product)
            ?.brand?.includes(brnd._id)
        ) ?? []
      );
    } else {
      return [];
    }
  };
  const vendorInputOptions = () => {
    if (allExpenseForm?.type === ExpenseTypes.STOCKABLE) {
      return (
        vendors?.filter((vndr) =>
          products
            .find((prod) => prod._id === allExpenseForm?.product)
            ?.vendor?.includes(vndr._id)
        ) ?? []
      );
    } else if (allExpenseForm?.type === ExpenseTypes.NONSTOCKABLE) {
      return (
        vendors?.filter((vndr) =>
          services
            .find((item) => item._id === allExpenseForm?.service)
            ?.vendor?.includes(vndr._id)
        ) ?? []
      );
    } else {
      return [];
    }
  };
  const inputs = [
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDateInitiallyOpen: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Expense Category"),
      options: Object.entries(ExpenseTypes).map((item) => {
        return {
          value: item[1],
          label: t(item[1]),
        };
      }),
      placeholder: t("Expense Category"),
      isMultiple: false,
      required: true,
      invalidateKeys: [
        { key: "product", defaultValue: "" },
        { key: "service", defaultValue: "" },
        { key: "expenseType", defaultValue: "" },
        { key: "brand", defaultValue: "" },
        { key: "vendor", defaultValue: "" },
      ],
    },
    ProductInput({
      products: products,
      required: allExpenseForm?.type === ExpenseTypes.STOCKABLE,
      isDisabled: allExpenseForm?.type !== ExpenseTypes.STOCKABLE,
      invalidateKeys: [
        { key: "expenseType", defaultValue: "" },
        { key: "brand", defaultValue: "" },
        { key: "vendor", defaultValue: "" },
      ],
    }),
    ServiceInput({
      services: services,
      required: allExpenseForm?.type === ExpenseTypes.NONSTOCKABLE,
      isDisabled: allExpenseForm?.type !== ExpenseTypes.NONSTOCKABLE,
      invalidateKeys: [
        { key: "expenseType", defaultValue: "" },
        { key: "brand", defaultValue: "" },
        { key: "vendor", defaultValue: "" },
      ],
    }),
    ExpenseTypeInput({
      expenseTypes: expenseTypeInputOptions() ?? [],
      required: true,
    }),
    StockLocationInput({ locations }),
    BrandInput({
      isDisabled: allExpenseForm?.type === ExpenseTypes.NONSTOCKABLE,
      brands: brandInputOptions() ?? [],
    }),
    VendorInput({
      vendors: vendorInputOptions() ?? [],
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
      isDisabled: allExpenseForm?.type !== ExpenseTypes.STOCKABLE,
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
      correspondingKey: "_id",
    },
    {
      key: t("Date"),
      isSortable: true,
      correspondingKey: "date",
    },
    {
      key: t("Expense Category"),
      isSortable: true,
      correspondingKey: "type",
      className: "min-w-40 pr-2",
    },
    {
      key: t("Note"),
      isSortable: true,
      correspondingKey: "note",
    },
    {
      key: t("Brand"),
      className: "min-w-32 pr-2",
      isSortable: true,
      correspondingKey: "brand",
    },
    {
      key: t("Vendor"),
      className: "min-w-32 pr-2",
      isSortable: true,
      correspondingKey: "vendor",
    },
    {
      key: t("Location"),
      isSortable: true,
      correspondingKey: "location",
    },
    {
      key: t("Expense Type"),
      className: "min-w-40 pr-2",
      isSortable: true,
      correspondingKey: "expenseType",
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: false,
    },
    {
      key: t("Quantity"),
      isSortable: true,
      correspondingKey: "quantity",
    },
    { key: t("Unit Price"), isSortable: false },
    {
      key: t("Total Expense"),
      isSortable: true,
      correspondingKey: "totalExpense",
    },
  ];
  const rowKeys = [
    { key: "_id", className: "min-w-32 pr-2" },
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row?.formattedDate;
      },
    },
    {
      key: "type",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return t(row?.type);
      },
    },
    { key: "note", className: "min-w-40 pr-2" },
    {
      key: "brand",
      node: (row: any) => {
        return (
          <div>
            <p className="min-w-32 pr-2">{row?.brand ?? "-"}</p>
          </div>
        );
      },
    },
    {
      key: "vendor",
      node: (row: any) => {
        return (
          <div>
            <p className="min-w-32 pr-2">{row?.vendor ?? "-"}</p>
          </div>
        );
      },
    },
    {
      key: "lctn",
      node: (row: any) => {
        return (
          <div>
            <p className="min-w-32 pr-4">{row?.lctn ?? "-"}</p>
          </div>
        );
      },
    },
    {
      key: "expenseType",
      node: (row: any) => {
        return (
          <div>
            <p
              className={`w-fit rounded-md text-sm ml-2 px-2 py-1 font-semibold text-white  `}
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
          <div>
            <p className="min-w-32 pr-2">
              {row?.type === ExpenseTypes.STOCKABLE
                ? row?.product
                : row?.service}
            </p>
          </div>
        );
      },
    },
    { key: "quantity", className: "min-w-32" },
    {
      key: "unitPrice",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>{row?.unitPrice} ₺</P1>
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
              {parseFloat(row?.totalExpense)
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
        submitFunction={() => {
          allExpenseForm.price &&
            allExpenseForm.kdv &&
            allExpenseForm.quantity &&
            createAccountExpense({
              ...allExpenseForm,
              paymentMethod:
                allExpenseForm.paymentMethod === NOTPAID
                  ? ""
                  : allExpenseForm.paymentMethod,
              isPaid: allExpenseForm.paymentMethod === NOTPAID ? false : true,
              quantity: Number(allExpenseForm.quantity),
              totalExpense:
                Number(allExpenseForm.price) +
                Number(allExpenseForm.kdv) *
                  (Number(allExpenseForm.price) / 100),
            });
          setAllExpenseForm({});
        }}
        additionalCancelFunction={() => {
          setAllExpenseForm({});
        }}
        submitItem={createAccountExpense as any}
        generalClassName="overflow-scroll min-w-[90%]"
        anotherPanelTopClassName=""
        topClassName="flex flex-col gap-2"
        nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
        setForm={setAllExpenseForm}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
          ...allExpenseForm,
          paymentMethod:
            allExpenseForm.paymentMethod === NOTPAID
              ? ""
              : allExpenseForm.paymentMethod,
          isPaid: allExpenseForm.paymentMethod === NOTPAID ? false : true,
        }}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
  };
  const tableFilters = [
    {
      label: t("Total") + " :",
      isUpperSide: false,
      node: (
        <div className="flex flex-row gap-2">
          <p>
            {new Intl.NumberFormat("en-US", {
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
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showAllExpensesFilters}
          onChange={() => {
            setShowAllExpensesFilters(!showAllExpensesFilters);
          }}
        />
      ),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showAllExpensesFilters,
    inputs: filterPanelInputs,
    formElements: filterAllExpensesPanelFormElements,
    setFormElements: setFilterAllExpensesPanelFormElements,
    closeFilters: () => setShowAllExpensesFilters(false),
  };
  const pagination = invoicesPayload
    ? {
        totalPages: invoicesPayload.totalPages,
        totalRows: invoicesPayload.totalNumber,
      }
    : null;
  const outsideSort = {
    filterPanelFormElements: filterAllExpensesPanelFormElements,
    setFilterPanelFormElements: setFilterAllExpensesPanelFormElements,
  };
  const outsideSearch = () => {
    return (
      <TextInput
        placeholder={t("Search")}
        type="text"
        value={filterAllExpensesPanelFormElements.search}
        isDebounce={true}
        onChange={(value) =>
          setFilterAllExpensesPanelFormElements({
            ...filterAllExpensesPanelFormElements,
            search: value,
          })
        }
      />
    );
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterAllExpensesPanelFormElements]);
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(allRows);
  }, [
    invoicesPayload,
    filterAllExpensesPanelFormElements,
    searchQuery,
    products,
    products,
    expenseTypes,
    brands,
    vendors,
    services,
    locations,
    paymentMethods,
  ]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          filters={tableFilters}
          columns={columns}
          outsideSortProps={outsideSort}
          outsideSearch={outsideSearch}
          rows={rows ?? []}
          title={t("All Expenses")}
          filterPanel={filterPanel}
          isSearch={false}
          {...(pagination && { pagination })}
          addButton={addButton}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default AllExpenses;
