import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountBrand,
  AccountExpenseType,
  AccountFixture,
  AccountPackageType,
  AccountProduct,
  AccountService,
  AccountStockLocation,
  AccountVendor,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import { useGetAccountFixtureInvoices } from "../../utils/api/account/fixtureInvoice";
import { useGetAccountInvoices } from "../../utils/api/account/invoice";
import { useGetAccountPackageTypes } from "../../utils/api/account/packageType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountServices } from "../../utils/api/account/service";
import { useGetAccountServiceInvoices } from "../../utils/api/account/serviceInvoice";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { formatAsLocalDate } from "../../utils/format";
import {
  BrandInput,
  ExpenseTypeInput,
  PackageTypeInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";

type FormElementsState = {
  [key: string]: any;
};

const AllExpenses = () => {
  const { t } = useTranslation();
  const invoices = useGetAccountInvoices();
  const fixtureInvoices = useGetAccountFixtureInvoices();
  const serviceInvoices = useGetAccountServiceInvoices();
  const units = useGetAccountUnits();
  const packages = useGetAccountPackageTypes();
  const { searchQuery, setCurrentPage, setSearchQuery } = useGeneralContext();
  const locations = useGetAccountStockLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const products = useGetAccountProducts();
  const fixtures = useGetAccountFixtures();
  const services = useGetAccountServices();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  enum ExpenseTypes {
    INVOICE = "Product Expense",
    FIXTURE = "Fixture Expense",
    SERVICE = "Service Expense",
  }
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      vendor: "",
      brand: "",
      expenseType: "",
      packages: "",
      location: "",
      before: "",
      after: "",
      type: "",
    });
  const allProductsOptions = [
    ...products.map((product) => ({ value: product._id, label: product.name })),
    ...fixtures.map((item) => ({
      value: item._id,
      label: item.name,
    })),
    ...services.map((item) => ({
      value: item._id,
      label: item.name,
    })),
  ];

  const allInvoices = [
    ...invoices.map((invoice) => {
      return {
        ...invoice,
        product: (invoice.product as AccountProduct)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        packageType: (invoice.packageType as AccountPackageType)?.name,
        brand: (invoice.brand as AccountBrand)?.name,
        vendor: (invoice.vendor as AccountVendor)?.name,
        location: invoice.location as AccountStockLocation,
        lctn: (invoice.location as AccountStockLocation)?.name,
        formattedDate: formatAsLocalDate(invoice.date),
        type: ExpenseTypes.INVOICE,
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
      };
    }),
    ...fixtureInvoices.map((invoice) => {
      return {
        ...invoice,
        product: (invoice.fixture as AccountFixture)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        brand: (invoice.brand as AccountBrand)?.name,
        vendor: (invoice.vendor as AccountVendor)?.name,
        location: invoice.location as AccountStockLocation,
        type: ExpenseTypes.FIXTURE,
        packageType: null,
        unit: null,
        lctn: (invoice.location as AccountStockLocation)?.name,
        formattedDate: formatAsLocalDate(invoice.date),
        unitPrice: parseFloat(
          (invoice.totalExpense / invoice.quantity).toFixed(4)
        ),
        expType: invoice.expenseType as AccountExpenseType,
      };
    }),
    ...serviceInvoices.map((invoice) => {
      return {
        ...invoice,
        product: (invoice.service as AccountService)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        brand: null,
        packageType: null,
        vendor: (invoice.vendor as AccountVendor)?.name,
        location: invoice.location as AccountStockLocation,
        type: ExpenseTypes.SERVICE,
        unit: null,
        lctn: (invoice.location as AccountStockLocation)?.name,
        formattedDate: formatAsLocalDate(invoice.date),
        unitPrice: parseFloat(
          (invoice.totalExpense / invoice.quantity).toFixed(4)
        ),
        expType: invoice.expenseType as AccountExpenseType,
      };
    }),
  ].sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  const [rows, setRows] = useState(allInvoices);
  const [generalTotalExpense, setGeneralTotalExpense] = useState(
    invoices.reduce((acc, invoice) => acc + invoice.totalExpense, 0)
  );

  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: allProductsOptions.map((product) => {
        return {
          value: product.value,
          label: product.label,
        };
      }),
      placeholder: t("Product"),
      isMultiple: false,
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Expense Type"),
      options: Object.entries(ExpenseTypes).map((item) => {
        return {
          value: item[1],
          label: t(item[1]),
        };
      }),
      placeholder: t("Expense Type"),
      isMultiple: false,
      required: true,
    },
    PackageTypeInput({ packages: packages, required: true }),
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
  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true },
    { key: t("Expense Type"), isSortable: true },
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
    {
      key: t("Package Type"),
      className: "min-w-40 pr-2",
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
          <div className=" min-w-32 ">
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
            <p className="min-w-32">{row.product}</p>
          </div>
        );
      },
    },
    {
      key: "packageType",
      node: (row: any) => {
        return (
          <div>
            <p className="min-w-32">{row.packageType}</p>
          </div>
        );
      },
    },
    { key: "quantity", className: "min-w-32" },
    {
      key: "unit",
      node: (row: any) => {
        return (
          <div>
            <p>{row.unit ?? "-"}</p>
          </div>
        );
      },
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
          invoice.date <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          invoice.date >= filterPanelFormElements.after) &&
        passesFilter(
          filterPanelFormElements.packages,
          packages.find(
            (packageType) => packageType.name === invoice.packageType
          )?._id
        ) &&
        (passesFilter(
          filterPanelFormElements.product,
          products.find((item) => item.name === invoice.product)?._id
        ) ||
          passesFilter(
            filterPanelFormElements.product,
            fixtures.find((item) => item.name === invoice.product)?._id
          ) ||
          passesFilter(
            filterPanelFormElements.product,
            services.find((item) => item.name === invoice.product)?._id
          )) &&
        passesFilter(
          filterPanelFormElements.vendor,
          vendors.find((item) => item.name === invoice.vendor)?._id
        ) &&
        passesFilter(filterPanelFormElements.type, invoice.type) &&
        passesFilter(
          filterPanelFormElements.brand,
          brands.find((item) => item.name === invoice.brand)?._id
        ) &&
        passesFilter(
          filterPanelFormElements.expenseType,
          expenseTypes.find((item) => item.name === invoice.expenseType)?._id
        ) &&
        passesFilter(
          filterPanelFormElements.location,
          (invoice.location as AccountStockLocation)?._id
        )
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
  }, [
    invoices,
    filterPanelFormElements,
    searchQuery,
    products,
    fixtureInvoices,
    serviceInvoices,
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
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          filters={tableFilters}
          columns={columns}
          rows={rows}
          title={t("All Expenses")}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
        />
      </div>
    </>
  );
};

export default AllExpenses;
