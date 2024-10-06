import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import {
  AccountExpenseType,
  ConstantPaymentMethodsIds,
  ExpenseTypes,
  NOTPAID,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountInvoiceMutations,
  useGetAccountInvoices,
} from "../../utils/api/account/invoice";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountServices } from "../../utils/api/account/service";
import {
  useAccountServiceInvoiceMutations,
  useGetAccountServiceInvoices,
} from "../../utils/api/account/serviceInvoice";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  ExpenseTypeInput,
  ProductInput,
  QuantityInput,
  ServiceInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
type FormElementsState = {
  [key: string]: any;
};

const Expenses = () => {
  const { t } = useTranslation();
  const invoices = useGetAccountInvoices();
  const serviceInvoices = useGetAccountServiceInvoices();
  const { selectedLocationId } = useLocationContext();
  const {
    searchQuery,
    setCurrentPage,
    setSearchQuery,
    allExpenseForm,
    setAllExpenseForm,
  } = useGeneralContext();
  const locations = useGetAccountStockLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const products = useGetAccountProducts();
  const services = useGetAccountServices();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const { createAccountInvoice, deleteAccountInvoice } =
    useAccountInvoiceMutations();
  const { createAccountServiceInvoice, deleteAccountServiceInvoice } =
    useAccountServiceInvoiceMutations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      service: "",
      vendor: "",
      brand: "",
      expenseType: "",
      location: "",
      before: "",
      after: "",
      type: "",
    });
  const allInvoices = [
    ...invoices
      .filter((i) => i.paymentMethod === ConstantPaymentMethodsIds.CASH)
      .map((invoice) => {
        return {
          ...invoice,
          product: getItem(invoice?.product, products)?.name,
          expenseType: getItem(invoice?.expenseType, expenseTypes)?.name,
          brand: getItem(invoice?.brand, brands)?.name,
          vendor: getItem(invoice?.vendor, vendors)?.name,
          lctn: getItem(invoice?.location, locations)?.name,
          formattedDate: formatAsLocalDate(invoice?.date),
          type: ExpenseTypes.INVOICE,
          unitPrice: parseFloat(
            (invoice?.totalExpense / invoice?.quantity).toFixed(4)
          ),
          expType: getItem(invoice?.expenseType, expenseTypes),
        };
      }),
    ...serviceInvoices
      .filter((i) => i.paymentMethod === ConstantPaymentMethodsIds.CASH)
      .map((invoice) => {
        return {
          ...invoice,
          product: getItem(invoice?.service, services)?.name,
          expenseType: getItem(invoice?.expenseType, expenseTypes)?.name,
          brand: null,
          vendor: getItem(invoice?.vendor, vendors)?.name,
          type: ExpenseTypes.SERVICE,
          lctn: getItem(invoice?.location, locations)?.name,
          formattedDate: formatAsLocalDate(invoice?.date),
          unitPrice: parseFloat(
            (invoice?.totalExpense / invoice?.quantity).toFixed(4)
          ),
          expType: getItem(invoice?.expenseType, expenseTypes),
        };
      }),
  ].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  const [rows, setRows] = useState(allInvoices);
  const [generalTotalExpense, setGeneralTotalExpense] = useState(
    invoices.reduce((acc, invoice) => acc + invoice?.totalExpense, 0)
  );

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
      isDisabled: filterPanelFormElements?.type !== ExpenseTypes.INVOICE,
    }),
    ServiceInput({
      services: services,
      required: true,
      isDisabled: filterPanelFormElements?.type !== ExpenseTypes.SERVICE,
    }),

    VendorInput({ vendors: vendors, required: true }),
    BrandInput({ brands: brands, required: true }),
    ExpenseTypeInput({ expenseTypes: expenseTypes, required: true }),
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const expenseTypeInputOptions = () => {
    if (allExpenseForm?.type === ExpenseTypes.INVOICE) {
      return (
        expenseTypes.filter((exp) =>
          products
            .find((prod) => prod._id === allExpenseForm?.product)
            ?.expenseType.includes(exp._id)
        ) ?? []
      );
    } else if (allExpenseForm?.type === ExpenseTypes.SERVICE) {
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
    if (allExpenseForm?.type === ExpenseTypes.INVOICE) {
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
    if (allExpenseForm?.type === ExpenseTypes.INVOICE) {
      return (
        vendors?.filter((vndr) =>
          products
            .find((prod) => prod._id === allExpenseForm?.product)
            ?.vendor?.includes(vndr._id)
        ) ?? []
      );
    } else if (allExpenseForm?.type === ExpenseTypes.SERVICE) {
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
      required: allExpenseForm?.type === ExpenseTypes.INVOICE,
      isDisabled: allExpenseForm?.type !== ExpenseTypes.INVOICE,
      invalidateKeys: [
        { key: "expenseType", defaultValue: "" },
        { key: "brand", defaultValue: "" },
        { key: "vendor", defaultValue: "" },
      ],
    }),
    ServiceInput({
      services: services,
      required: allExpenseForm?.type === ExpenseTypes.SERVICE,
      isDisabled: allExpenseForm?.type !== ExpenseTypes.SERVICE,
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
    BrandInput({
      isDisabled: allExpenseForm?.type === ExpenseTypes.SERVICE,
      brands: brandInputOptions() ?? [],
    }),
    VendorInput({
      vendors: vendorInputOptions() ?? [],
      required: true,
    }),
    QuantityInput(),
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "note", type: FormKeyTypeEnum.STRING },
    { key: "paymentMethod", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true },
    {
      key: t("Expense Category"),
      isSortable: true,
      className: "min-w-40 pr-2",
    },
    { key: t("Note"), isSortable: true },
    {
      key: t("Brand"),
      className: "min-w-32 pr-2",
      isSortable: true,
    },
    {
      key: t("Vendor"),
      className: "min-w-32 pr-2",
      isSortable: true,
    },
    { key: t("Location"), isSortable: true },
    {
      key: t("Expense Type"),
      className: "min-w-40 pr-2",
      isSortable: true,
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: true,
    },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Expense"), isSortable: true },
  ];
  if (isEnableEdit) {
    columns.push({ key: t("Action"), isSortable: false });
  }
  const rowKeys = [
    { key: "_id", className: "min-w-32 pr-2" },
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row.formattedDate;
      },
    },
    {
      key: "type",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return t(row.type);
      },
    },
    { key: "note", className: "min-w-40 pr-2" },
    {
      key: "brand",
      node: (row: any) => {
        return (
          <div>
            <p className="min-w-32 pr-2">{row.brand ?? "-"}</p>
          </div>
        );
      },
    },
    {
      key: "vendor",
      node: (row: any) => {
        return (
          <div>
            <p className="min-w-32 pr-2">{row.vendor ?? "-"}</p>
          </div>
        );
      },
    },
    {
      key: "lctn",
      node: (row: any) => {
        return (
          <div>
            <p className="min-w-32 pr-4">{row.lctn ?? "-"}</p>
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
            <p className="min-w-32 pr-2">{row.product}</p>
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
            }).format(generalTotalExpense)}{" "}
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
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];

  useEffect(() => {
    setTableKey((prev) => prev + 1);
    const processedRows = allInvoices.filter((invoice) => {
      return (
        (filterPanelFormElements.before === "" ||
          invoice?.date <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          invoice?.date >= filterPanelFormElements.after) &&
        passesFilter(
          filterPanelFormElements.product,
          products.find((item) => item.name === invoice?.product)?._id
        ) &&
        passesFilter(
          filterPanelFormElements.service,
          services.find((item) => item.name === invoice?.product)?._id
        ) &&
        passesFilter(
          filterPanelFormElements.vendor,
          vendors.find((item) => item.name === invoice?.vendor)?._id
        ) &&
        passesFilter(filterPanelFormElements.type, invoice?.type) &&
        passesFilter(
          filterPanelFormElements.brand,
          brands.find((item) => item.name === invoice?.brand)?._id
        ) &&
        passesFilter(
          filterPanelFormElements.expenseType,
          expenseTypes.find((item) => item.name === invoice?.expenseType)?._id
        ) &&
        passesFilter(filterPanelFormElements.location, invoice?.location)
      );
    });

    const filteredRows = processedRows.filter((row) =>
      rowKeys.some((rowKey) => {
        const value = row[rowKey.key as keyof typeof row];
        const timeValue = row["formattedDate"];
        const query = searchQuery.trimStart().toLocaleLowerCase("tr-TR");
        if (typeof value === "string") {
          return (
            value.toLocaleLowerCase("tr-TR").includes(query) ||
            timeValue.toLowerCase().includes(query)
          );
        } else if (typeof value === "number") {
          return value.toString().includes(query);
        } else if (typeof value === "boolean") {
          return (value ? "true" : "false").includes(query);
        }
        return false;
      })
    );
    const newGeneralTotalExpense = filteredRows.reduce(
      (acc, invoice) => acc + invoice?.totalExpense,
      0
    );
    setRows(filteredRows);
    setGeneralTotalExpense(newGeneralTotalExpense);
    if (
      searchQuery !== "" ||
      Object.values(filterPanelFormElements).some((value) => value !== "")
    ) {
      setCurrentPage(1);
    }
  }, [
    invoices,
    filterPanelFormElements,
    searchQuery,
    products,
    serviceInvoices,
    products,
    expenseTypes,
    brands,
    vendors,
    services,
    locations,
    services,
  ]);

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const outsideSearch = () => {
    return (
      <div className="flex flex-row relative min-w-32">
        <input
          type="text"
          value={temporarySearch}
          onChange={(e) => {
            setTemporarySearch(e.target.value);
            if (e.target.value === "") {
              setSearchQuery(e.target.value);
            }
          }}
          autoFocus={true}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setSearchQuery(temporarySearch);
            }
          }}
          placeholder={t("Search")}
          className="border border-gray-200 rounded-md py-2 px-3 w-full focus:outline-none"
        />
        <CiSearch
          className="w-9 h-full p-2 bg-blue-gray-100 text-black cursor-pointer my-auto rounded-md absolute right-0 top-1/2 transform -translate-y-1/2"
          onClick={() => {
            setSearchQuery(temporarySearch);
          }}
        />
      </div>
    );
  };
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
        generalClassName="overflow-scroll"
        submitFunction={() => {
          if (allExpenseForm.type === ExpenseTypes.INVOICE) {
            allExpenseForm.price &&
              allExpenseForm.kdv &&
              allExpenseForm.quantity &&
              createAccountInvoice({
                ...allExpenseForm,
                location: selectedLocationId === 1 ? "bahceli" : "neorama",
                paymentMethod: ConstantPaymentMethodsIds.CASH,
                isPaid: true,
                quantity: Number(allExpenseForm.quantity),
                totalExpense:
                  Number(allExpenseForm.price) +
                  Number(allExpenseForm.kdv) *
                    (Number(allExpenseForm.price) / 100),
              });
            setAllExpenseForm({});
          } else if (allExpenseForm.type === ExpenseTypes.SERVICE) {
            allExpenseForm.price &&
              allExpenseForm.kdv &&
              allExpenseForm.quantity &&
              createAccountServiceInvoice({
                ...allExpenseForm,
                location: selectedLocationId === 1 ? "bahceli" : "neorama",
                paymentMethod: ConstantPaymentMethodsIds.CASH,
                isPaid: true,
                totalExpense:
                  Number(allExpenseForm.price) +
                  Number(allExpenseForm.kdv) *
                    (Number(allExpenseForm.price) / 100),
              });
            setAllExpenseForm({});
          } else {
            toast.error("Please select a type");
          }
        }}
        additionalCancelFunction={() => {
          setAllExpenseForm({});
        }}
        submitItem={createAccountInvoice as any}
        topClassName="flex flex-col gap-2 "
        setForm={setAllExpenseForm}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
          ...allExpenseForm,
          location: selectedLocationId === 1 ? "bahceli" : "neorama",
          paymentMethod:
            allExpenseForm.paymentMethod === NOTPAID
              ? ""
              : allExpenseForm.paymentMethod,
          isPaid: true,
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
      isDisabled: !isEnableEdit,
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            if (rowToAction.type === ExpenseTypes.INVOICE)
              deleteAccountInvoice(rowToAction._id);
            else if (rowToAction.type === ExpenseTypes.SERVICE)
              deleteAccountServiceInvoice(rowToAction?._id);
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
  ];
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          filters={tableFilters}
          columns={columns}
          rows={rows}
          title={t("Expenses")}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
          addButton={addButton}
          actions={actions}
          isActionsActive={isEnableEdit}
        />
      </div>
    </>
  );
};

export default Expenses;
