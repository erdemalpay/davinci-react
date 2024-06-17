import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountBrand,
  AccountExpenseType,
  AccountPackageType,
  AccountProduct,
  AccountStockLocation,
  AccountVendor,
} from "../../types";
import { useGetAccountInvoices } from "../../utils/api/account/invoice";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { formatAsLocalDate } from "../../utils/format";
import {
  ProductInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
type Props = { selectedBrand: AccountBrand };
type FormElementsState = {
  [key: string]: any;
};
const BrandExpenses = ({ selectedBrand }: Props) => {
  const { t } = useTranslation();
  const invoices = useGetAccountInvoices();
  const vendors = useGetAccountVendors();
  const products = useGetAccountProducts();
  const units = useGetAccountUnits();
  const locations = useGetAccountStockLocations();
  const { searchQuery, setSearchQuery, setCurrentPage } = useGeneralContext();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      before: "",
      after: "",
      location: "",
      product: "",
      vendor: "",
    });
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const [rows, setRows] = useState(
    invoices
      ?.filter(
        (invoice) =>
          (invoice?.brand as AccountBrand)?._id === selectedBrand?._id
      )
      ?.map((invoice) => {
        return {
          ...invoice,
          product: (invoice.product as AccountProduct)?.name,
          expenseType: (invoice.expenseType as AccountExpenseType)?.name,
          packageType: (invoice.packageType as AccountPackageType)?.name,
          brand: (invoice.brand as AccountBrand)?.name,
          vendor: (invoice.vendor as AccountVendor)?.name,
          formattedDate: formatAsLocalDate(invoice.date),
          location: invoice.location as AccountStockLocation,
          lctn: (invoice.location as AccountStockLocation)?.name,
          unitPrice: parseFloat(
            (
              invoice.totalExpense /
              (invoice.quantity *
                ((invoice.packageType as AccountPackageType)?.quantity ?? 1))
            ).toFixed(4)
          ),
          unit: units?.find(
            (unit) =>
              unit._id === ((invoice.product as AccountProduct).unit as string)
          )?.name,
          expType: invoice.expenseType as AccountExpenseType,
          brnd: invoice.brand as AccountBrand,
          vndr: invoice.vendor as AccountVendor,
          pckgTyp: invoice.packageType as AccountPackageType,
          prdct: invoice.product as AccountProduct,
        };
      })
  );
  const [generalTotalExpense, setGeneralTotalExpense] = useState(
    rows?.reduce((acc, invoice) => acc + invoice.totalExpense, 0)
  );
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

  const filterPanelInputs = [
    ProductInput({
      products: products.filter((i) => i.brand?.includes(selectedBrand?._id)),
      required: true,
    }),
    VendorInput({ vendors: vendors, required: true }),
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
  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true, className: "min-w-32 pr-2" },
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
      className: "min-w-32 ",
      isSortable: true,
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: true,
    },
    {
      key: t("Package Type"),
      className: "min-w-32 ",
      isSortable: true,
    },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Expense"), isSortable: true },
  ];
  const rowKeys = [
    { key: "_id", className: "min-w-32 pr-2" },
    {
      key: "formattedDate",
      className: "min-w-32 pr-2",
    },
    { key: "note", className: "min-w-40 pr-2" },
    {
      key: "brand",
      className: "min-w-32 pr-2",
    },
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
      key: "product",
      className: "min-w-32 pr-2",
    },
    {
      key: "packageType",
      className: "min-w-32 pr-2",
    },
    { key: "quantity", className: "min-w-32" },
    {
      key: "unit",
    },
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
  useEffect(() => {
    const processedRows = invoices
      ?.filter(
        (invoice) =>
          (invoice?.brand as AccountBrand)?._id === selectedBrand?._id
      )
      ?.filter((invoice) => {
        return (
          (filterPanelFormElements.before === "" ||
            invoice.date <= filterPanelFormElements.before) &&
          (filterPanelFormElements.after === "" ||
            invoice.date >= filterPanelFormElements.after) &&
          passesFilter(
            filterPanelFormElements.product,
            (invoice.product as AccountProduct)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.vendor,
            (invoice.vendor as AccountVendor)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.location,
            (invoice.location as AccountStockLocation)?._id
          )
        );
      })
      .map((invoice) => {
        return {
          ...invoice,
          product: (invoice.product as AccountProduct)?.name,
          expenseType: (invoice.expenseType as AccountExpenseType)?.name,
          packageType: (invoice.packageType as AccountPackageType)?.name,
          brand: (invoice.brand as AccountBrand)?.name,
          vendor: (invoice.vendor as AccountVendor)?.name,
          formattedDate: formatAsLocalDate(invoice.date),
          location: invoice.location as AccountStockLocation,
          lctn: (invoice.location as AccountStockLocation)?.name,
          unitPrice: parseFloat(
            (
              invoice.totalExpense /
              (invoice.quantity *
                ((invoice.packageType as AccountPackageType)?.quantity ?? 1))
            ).toFixed(4)
          ),
          unit: units?.find(
            (unit) =>
              unit._id === ((invoice.product as AccountProduct).unit as string)
          )?.name,
          expType: invoice.expenseType as AccountExpenseType,
          brnd: invoice.brand as AccountBrand,
          vndr: invoice.vendor as AccountVendor,
          pckgTyp: invoice.packageType as AccountPackageType,
          prdct: invoice.product as AccountProduct,
        };
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
      (acc, invoice) => acc + invoice.totalExpense,
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
    setTableKey((prev) => prev + 1);
  }, [invoices, filterPanelFormElements, searchQuery]);

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
            }).format(generalTotalExpense)}{" "}
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
  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        key={selectedBrand?._id + tableKey}
        rowKeys={rowKeys}
        isActionsActive={false}
        columns={columns}
        filters={filters}
        filterPanel={filterPanel}
        rows={rows}
        title={t("Brand Expenses")}
        isSearch={false}
        outsideSearch={outsideSearch}
      />
    </div>
  );
};
export default BrandExpenses;
