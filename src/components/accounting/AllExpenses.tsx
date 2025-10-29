import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpenseType,
  DateRangeKey,
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
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStockLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

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
    initialFilterPanelAllExpensesFormElements,
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
  const { createAccountExpense } = useAccountExpenseMutations();

  const rows = useMemo(() => {
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
    return allRows || [];
  }, [invoices, products, expenseTypes, brands, vendors, locations, services]);

  const filterPanelInputs = useMemo(
    () => [
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
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products.map((product) => ({
          value: product._id,
          label: product.name,
        })),
        placeholder: t("Product"),
        required: true,
        isDisabled:
          filterAllExpensesPanelFormElements?.type !== ExpenseTypes.STOCKABLE,
      },
      {
        type: InputTypes.SELECT,
        formKey: "service",
        label: t("Service"),
        options: services.map((service) => ({
          value: service._id,
          label: service.name,
        })),
        placeholder: t("Service"),
        required: true,
        isDisabled:
          filterAllExpensesPanelFormElements?.type !==
          ExpenseTypes.NONSTOCKABLE,
      },
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        placeholder: t("Vendor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "brand",
        label: t("Brand"),
        options: brands.map((brand) => ({
          value: brand._id,
          label: brand.name,
        })),
        placeholder: t("Brand"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseType",
        label: t("Expense Type"),
        options: expenseTypes.map((expenseType) => ({
          value: expenseType._id,
          label: expenseType.name,
        })),
        placeholder: t("Expense Type"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "paymentMethod",
        label: t("Payment Method"),
        options:
          paymentMethods
            ?.filter((pm) => pm?.isUsedAtExpense)
            ?.map((input) => ({
              value: input._id,
              label: t(input.name),
            })) || [],
        placeholder: t("Payment Method"),
        isMultiple: true,
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
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
            setFilterAllExpensesPanelFormElements({
              ...filterAllExpensesPanelFormElements,
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
    ],
    [
      t,
      products,
      services,
      vendors,
      brands,
      expenseTypes,
      paymentMethods,
      locations,
      filterAllExpensesPanelFormElements,
      setFilterAllExpensesPanelFormElements,
    ]
  );

  const expenseTypeInputOptions = useMemo(() => {
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
  }, [allExpenseForm, expenseTypes, products, services]);

  const brandInputOptions = useMemo(() => {
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
  }, [allExpenseForm, brands, products]);

  const vendorInputOptions = useMemo(() => {
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
  }, [allExpenseForm, vendors, products, services]);

  const inputs = useMemo(
    () => [
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
        options: Object.entries(ExpenseTypes).map((item) => ({
          value: item[1],
          label: t(item[1]),
        })),
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
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products.map((product) => ({
          value: product._id,
          label: product.name,
        })),
        placeholder: t("Product"),
        required: allExpenseForm?.type === ExpenseTypes.STOCKABLE,
        isDisabled: allExpenseForm?.type !== ExpenseTypes.STOCKABLE,
        invalidateKeys: [
          { key: "expenseType", defaultValue: "" },
          { key: "brand", defaultValue: "" },
          { key: "vendor", defaultValue: "" },
        ],
      },
      {
        type: InputTypes.SELECT,
        formKey: "service",
        label: t("Service"),
        options: services.map((service) => ({
          value: service._id,
          label: service.name,
        })),
        placeholder: t("Service"),
        required: allExpenseForm?.type === ExpenseTypes.NONSTOCKABLE,
        isDisabled: allExpenseForm?.type !== ExpenseTypes.NONSTOCKABLE,
        invalidateKeys: [
          { key: "expenseType", defaultValue: "" },
          { key: "brand", defaultValue: "" },
          { key: "vendor", defaultValue: "" },
        ],
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseType",
        label: t("Expense Type"),
        options: expenseTypeInputOptions.map((expenseType) => ({
          value: expenseType._id,
          label: expenseType.name,
        })),
        placeholder: t("Expense Type"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "brand",
        label: t("Brand"),
        options: brandInputOptions.map((brand) => ({
          value: brand._id,
          label: brand.name,
        })),
        placeholder: t("Brand"),
        isDisabled: allExpenseForm?.type === ExpenseTypes.NONSTOCKABLE,
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendorInputOptions.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        placeholder: t("Vendor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "paymentMethod",
        label: t("Payment Method"),
        options:
          paymentMethods
            ?.filter((pm) => pm?.isUsedAtExpense)
            ?.map((input) => ({
              value: input._id,
              label: t(input.name),
            })) || [],
        placeholder: t("Payment Method"),
        required: true,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "isStockIncrement",
        label: t("Stock Increment"),
        placeholder: t("Stock Increment"),
        required: false,
        isDisabled: allExpenseForm?.type !== ExpenseTypes.STOCKABLE,
        isTopFlexRow: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "quantity",
        label: t("Quantity"),
        placeholder: t("Quantity"),
        required: true,
        isNumberButtonActive: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "isAfterCount",
        label: t("Is After Count"),
        placeholder: t("Is After Count"),
        required: true,
        isTopFlexRow: true,
      },
    ],
    [
      t,
      products,
      services,
      expenseTypeInputOptions,
      locations,
      brandInputOptions,
      vendorInputOptions,
      paymentMethods,
      allExpenseForm,
    ]
  );

  const formKeys = useMemo(
    () => [
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
    ],
    []
  );

  const columns = useMemo(
    () => [
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
      {
        key: t("Is After Count"),
        isSortable: true,
        correspondingKey: "isAfterCount",
      },
      { key: t("Unit Price"), isSortable: false },
      {
        key: t("Total Expense"),
        isSortable: true,
        correspondingKey: "totalExpense",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
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
        key: "isAfterCount",
        node: (row: any) => {
          return row?.isAfterCount ? (
            <IoCheckmark className="text-blue-500 text-2xl" />
          ) : (
            <IoCloseOutline className="text-red-800 text-2xl" />
          );
        },
      },
      {
        key: "unitPrice",
        node: (row: any) => {
          return (
            <div className="min-w-32">
              <P1>{row?.unitPrice.toFixed(2).replace(/\.?0*$/, "")} ₺</P1>
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
                  .toFixed(2)
                  .replace(/\.?0*$/, "")}{" "}
                ₺
              </P1>
            </div>
          );
        },
      },
    ],
    [t]
  );

  const addButton = useMemo(
    () => ({
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
            isAfterCount: true,
          }}
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      allExpenseForm,
      createAccountExpense,
      setAllExpenseForm,
    ]
  );

  const tableFilters = useMemo(
    () => [
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
    ],
    [t, invoicesPayload, showAllExpensesFilters, setShowAllExpensesFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showAllExpensesFilters,
      inputs: filterPanelInputs,
      formElements: filterAllExpensesPanelFormElements,
      setFormElements: setFilterAllExpensesPanelFormElements,
      closeFilters: () => setShowAllExpensesFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterAllExpensesPanelFormElements(
          initialFilterPanelAllExpensesFormElements
        );
      },
    }),
    [
      showAllExpensesFilters,
      filterPanelInputs,
      filterAllExpensesPanelFormElements,
      setFilterAllExpensesPanelFormElements,
      setShowAllExpensesFilters,
      initialFilterPanelAllExpensesFormElements,
    ]
  );

  const pagination = useMemo(() => {
    return invoicesPayload
      ? {
          totalPages: invoicesPayload.totalPages,
          totalRows: invoicesPayload.totalNumber,
        }
      : null;
  }, [invoicesPayload]);

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterAllExpensesPanelFormElements,
      setFilterPanelFormElements: setFilterAllExpensesPanelFormElements,
    }),
    [filterAllExpensesPanelFormElements, setFilterAllExpensesPanelFormElements]
  );

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterAllExpensesPanelFormElements,
      setFilterPanelFormElements: setFilterAllExpensesPanelFormElements,
    };
  }, [
    t,
    filterAllExpensesPanelFormElements,
    setFilterAllExpensesPanelFormElements,
  ]);
  // Effect to reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterAllExpensesPanelFormElements, setCurrentPage]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          filters={tableFilters}
          columns={columns}
          outsideSortProps={outsideSort}
          outsideSearchProps={outsideSearchProps}
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
