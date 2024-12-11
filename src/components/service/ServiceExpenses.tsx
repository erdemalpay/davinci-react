import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpenseType,
  AccountService,
  commonDateOptions,
  ExpenseTypes,
} from "../../types";
import { useGetAccountExpenses } from "../../utils/api/account/expense";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountServices } from "../../utils/api/account/service";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { StockLocationInput, VendorInput } from "../../utils/panelInputs";
import TextInput from "../panelComponents/FormElements/TextInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type Props = {
  selectedService: AccountService;
};
type FormElementsState = {
  [key: string]: any;
};
const ServiceExpenses = ({ selectedService }: Props) => {
  const { t } = useTranslation();
  const vendors = useGetAccountVendors();
  const locations = useGetStockLocations();
  const services = useGetAccountServices();
  const expenseTypes = useGetAccountExpenseTypes();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      service: selectedService?._id,
      type: ExpenseTypes.NONSTOCKABLE,
      vendor: "",
      brand: "",
      expenseType: "",
      paymentMethod: "",
      location: "",
      date: "",
      before: "",
      after: "",
      sort: "",
      asc: 1,
      search: "",
    });
  const invoicesPayload = useGetAccountExpenses(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const invoices = invoicesPayload?.data;
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const allRows = invoices?.map((invoice) => {
    return {
      ...invoice,
      service: getItem(invoice?.service, services)?.name,
      expenseType: getItem(invoice?.expenseType, expenseTypes)?.name,
      vendor: getItem(invoice?.vendor, vendors)?.name,
      vendorId: invoice?.vendor,
      formattedDate: formatAsLocalDate(invoice?.date),
      lctn: getItem(invoice?.location, locations)?.name,
      unitPrice: parseFloat(
        (invoice?.totalExpense / invoice?.quantity).toFixed(4)
      ),
      expType: getItem(invoice?.expenseType, expenseTypes),
      vndr: getItem(invoice?.vendor, vendors),
      srvc: getItem(invoice?.service, services),
    };
  });
  const [rows, setRows] = useState(allRows);
  const filterPanelInputs = [
    VendorInput({ vendors: vendors, required: true }),
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
  const columns = [
    {
      key: "ID",
      isSortable: true,
      correspondingKey: "_id",
    },
    {
      key: t("Date"),
      isSortable: true,
      className: "min-w-32 pr-2",
      correspondingKey: "date",
    },
    {
      key: t("Note"),
      isSortable: true,
      correspondingKey: "note",
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
      className: "min-w-32 ",
      isSortable: true,
      correspondingKey: "expenseType",
    },
    {
      key: t("Service"),
      className: "min-w-32 pr-2",
      isSortable: true,
      correspondingKey: "service",
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
      className: "min-w-32 pr-1",
      node: (row: any) => {
        return <p>{row.formattedDate}</p>;
      },
    },
    { key: "note", className: "min-w-40 pr-2" },
    {
      key: "vendor",
      className: "min-w-32 pr-2",
    },
    {
      key: "lctn",
      className: "min-w-32 pr-4",
    },
    {
      key: "expenseType",
      node: (row: any) => {
        return (
          <div className=" min-w-32">
            <p
              className="w-fit rounded-md text-white text-sm ml-2 px-2 py-1 font-semibold "
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
      key: "service",
      className: "min-w-32 pr-2",
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
  const filters = [
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
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
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
        value={filterPanelFormElements.search}
        isDebounce={true}
        onChange={(value) =>
          setFilterPanelFormElements((prev) => ({
            ...prev,
            search: value,
          }))
        }
      />
    );
  };
  const outsideSort = {
    filterPanelFormElements: filterPanelFormElements,
    setFilterPanelFormElements: setFilterPanelFormElements,
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements]);
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(allRows);
  }, [
    invoicesPayload,
    filterPanelFormElements,
    expenseTypes,
    vendors,
    services,
    locations,
  ]);

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={selectedService?._id + tableKey}
        rowKeys={rowKeys}
        columns={columns}
        filters={filters}
        outsideSortProps={outsideSort}
        outsideSearch={outsideSearch}
        filterPanel={filterPanel}
        rows={rows ?? []}
        title={t("Service Expenses")}
        isSearch={false}
        {...(pagination && { pagination })}
        isActionsActive={false}
      />
    </div>
  );
};

export default ServiceExpenses;
