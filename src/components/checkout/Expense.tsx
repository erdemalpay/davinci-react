import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import {
  AccountExpenseType,
  ConstantPaymentMethodsIds,
  ExpenseTypes,
  NOTPAID,
  commonDateOptions,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import {
  useAccountExpenseMutations,
  useAccountExpenseSimpleMutations,
  useGetAccountExpenses,
} from "../../utils/api/account/expense";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountServices } from "../../utils/api/account/service";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
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
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../panelComponents/FormElements/TextInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Expenses = () => {
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationContext();
  const {
    rowsPerPage,
    currentPage,
    setCurrentPage,
    allExpenseForm,
    setAllExpenseForm,
  } = useGeneralContext();
  const {
    initialFilterCheckoutPanelFormElements,
    filterCheckoutPanelFormElements,
    setFilterCheckoutPanelFormElements,
  } = useFilterContext();
  const invoicesPayload = useGetAccountExpenses(
    currentPage,
    rowsPerPage,
    filterCheckoutPanelFormElements
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
  const { updateAccountExpenseSimple } = useAccountExpenseSimpleMutations();
  const [showFilters, setShowFilters] = useState(false);
  const { createAccountExpense, deleteAccountExpense } =
    useAccountExpenseMutations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
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
        filterCheckoutPanelFormElements?.type !== ExpenseTypes.STOCKABLE,
    }),
    ServiceInput({
      services: services,
      required: true,
      isDisabled:
        filterCheckoutPanelFormElements?.type !== ExpenseTypes.NONSTOCKABLE,
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
    },
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
      isDateInitiallyOpen: false,
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
    BrandInput({
      isDisabled: allExpenseForm?.type === ExpenseTypes.NONSTOCKABLE,
      brands: brandInputOptions() ?? [],
    }),
    VendorInput({
      vendors: vendorInputOptions() ?? [],
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
    { key: t("Is After Count"), isSortable: true },
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
      key: "isAfterCount",
      node: (row: any) => {
        return (
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
        );
      },
    },
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
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
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
        generalClassName="overflow-scroll"
        submitFunction={() => {
          allExpenseForm.price &&
            allExpenseForm.kdv &&
            allExpenseForm.quantity &&
            createAccountExpense({
              ...allExpenseForm,
              location: selectedLocationId,
              paymentMethod: ConstantPaymentMethodsIds.CASH,
              isPaid: true,
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
        topClassName="flex flex-col gap-2 "
        setForm={setAllExpenseForm}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
          ...allExpenseForm,
          location: selectedLocationId,
          isAfterCount: true,
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
            deleteAccountExpense(rowToAction._id);
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
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterCheckoutPanelFormElements,
    setFormElements: setFilterCheckoutPanelFormElements,
    closeFilters: () => setShowFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterCheckoutPanelFormElements(
        initialFilterCheckoutPanelFormElements
      );
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
        value={filterCheckoutPanelFormElements.search}
        isDebounce={true}
        onChange={(value) =>
          setFilterCheckoutPanelFormElements(() => ({
            ...filterCheckoutPanelFormElements,
            search: value,
          }))
        }
      />
    );
  };
  const outsideSort = {
    filterPanelFormElements: filterCheckoutPanelFormElements,
    setFilterPanelFormElements: setFilterCheckoutPanelFormElements,
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCheckoutPanelFormElements]);
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(allRows);
  }, [
    invoicesPayload,
    filterCheckoutPanelFormElements,
    products,
    products,
    expenseTypes,
    brands,
    vendors,
    services,
    locations,
    services,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          filters={tableFilters}
          outsideSortProps={outsideSort}
          columns={columns}
          rows={rows ?? []}
          title={t("Expenses")}
          filterPanel={filterPanel}
          isSearch={false}
          addButton={addButton}
          outsideSearch={outsideSearch}
          actions={actions}
          isActionsActive={isEnableEdit}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default Expenses;
