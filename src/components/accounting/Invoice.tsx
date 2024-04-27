import { Switch } from "@headlessui/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountBrand,
  AccountExpenseType,
  AccountInvoice,
  AccountPackageType,
  AccountProduct,
  AccountVendor,
  Location,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountInvoiceMutations,
  useGetAccountInvoices,
} from "../../utils/api/account/invoice";
import { useGetAccountPackageTypes } from "../../utils/api/account/packageType";
import {
  useAccountProductMutations,
  useGetAccountProducts,
} from "../../utils/api/account/product";
import { useGetAccountUnits } from "../../utils/api/account/unit";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetLocations } from "../../utils/api/location";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import {
  BrandInput,
  DateInput,
  ExpenseTypeInput,
  LocationInput,
  NameInput,
  PackageTypeInput,
  ProductInput,
  QuantityInput,
  UnitInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { H5, P1 } from "../panelComponents/Typography";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

const Invoice = () => {
  const { t } = useTranslation();
  const invoices = useGetAccountInvoices();
  const units = useGetAccountUnits();
  const packages = useGetAccountPackageTypes();
  const { searchQuery, setCurrentPage, setSearchQuery } = useGeneralContext();
  const locations = useGetLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const products = useGetAccountProducts();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProductInputOpen, setIsProductInputOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountInvoice>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const { createAccountProduct } = useAccountProductMutations();
  const [productInputForm, setProductInputForm] = useState({
    brand: [],
    vendor: [],
    expenseType: [],
    unit: "",
    packages: [],
    name: "",
  });
  const [form, setForm] = useState<Partial<AccountInvoice>>({
    date: "",
    product: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    packageType: "",
    brand: "",
    location: 0,
    vendor: "",
    note: "",
    price: 0,
    kdv: 0,
  });

  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: "",
      vendor: "",
      brand: "",
      expenseType: "",
      packageType: "",
      location: "",
      before: "",
      after: "",
    });

  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const { createAccountInvoice, deleteAccountInvoice, updateAccountInvoice } =
    useAccountInvoiceMutations();
  const [rows, setRows] = useState(
    invoices.map((invoice) => {
      return {
        ...invoice,
        product: (invoice.product as AccountProduct)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        packageType: (invoice.packageType as AccountPackageType)?.name,
        brand: (invoice.brand as AccountBrand)?.name,
        vendor: (invoice.vendor as AccountVendor)?.name,
        location: invoice.location as Location,
        lctn: (invoice.location as Location)?.name,
        date: formatAsLocalDate(invoice.date),
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
      };
    })
  );
  const [generalTotalExpense, setGeneralTotalExpense] = useState(
    invoices.reduce((acc, invoice) => acc + invoice.totalExpense, 0)
  );
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
  const inputs = [
    DateInput(),
    ProductInput({
      products: products,
      required: true,
      invalidateKeys: [
        { key: "expenseType", defaultValue: "" },
        { key: "brand", defaultValue: "" },
        { key: "vendor", defaultValue: "" },
        { key: "packageType", defaultValue: "" },
      ],
    }),
    {
      type: InputTypes.SELECT,
      formKey: "packageType",
      label: t("Package Type"),
      options: products
        .find((prod) => prod._id === form?.product)
        ?.packages?.map((item) => {
          const packageType = packages.find((pkg) => pkg._id === item.package);
          return {
            value: packageType?._id,
            label: packageType?.name,
          };
        }),
      placeholder: t("Package Type"),
      required:
        (products.find((prod) => prod._id === form?.product)?.packages
          ?.length ?? 0) > 0,
      isDisabled:
        (products?.find((prod) => prod._id === form?.product)?.packages
          ?.length ?? 0) < 1,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: t("Expense Type"),
      options: expenseTypes
        .filter((exp) =>
          products
            .find((prod) => prod._id === form?.product)
            ?.expenseType.includes(exp._id)
        )
        ?.map((expenseType) => {
          return {
            value: expenseType._id,
            label: expenseType.name,
          };
        }),
      placeholder: t("Expense Type"),
      required: true,
    },
    LocationInput({ locations }),
    {
      type: InputTypes.SELECT,
      formKey: "brand",
      label: t("Brand"),
      options: brands
        ?.filter((brnd) =>
          products
            .find((prod) => prod._id === form?.product)
            ?.brand?.includes(brnd._id)
        )
        ?.map((brand) => {
          return {
            value: brand._id,
            label: brand.name,
          };
        }),
      placeholder: t("Brand"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "vendor",
      label: t("Vendor"),
      options: vendors
        ?.filter((vndr) =>
          products
            .find((prod) => prod._id === form?.product)
            ?.vendor?.includes(vndr._id)
        )
        ?.map((vendor) => {
          return {
            value: vendor._id,
            label: vendor.name,
          };
        }),
      placeholder: t("Vendor"),
      required: false,
    },
    QuantityInput(),
  ];
  const filterPanelInputs = [
    ProductInput({ products: products, required: true }),
    PackageTypeInput({ packages: packages, required: true }),
    VendorInput({ vendors: vendors, required: true }),
    BrandInput({ brands: brands, required: true }),
    ExpenseTypeInput({ expenseTypes: expenseTypes, required: true }),
    LocationInput({ locations: locations }),
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("After"),
      placeholder: t("After"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("Before"),
      placeholder: t("Before"),
      required: true,
      isDatePicker: true,
    },
  ];
  const productInputs = [
    NameInput(),
    UnitInput({ units: units }),
    ExpenseTypeInput({ expenseTypes: expenseTypes, isMultiple: true }),
    PackageTypeInput({ packages: packages, isMultiple: true }),
    BrandInput({ brands: brands, isMultiple: true }),
    VendorInput({ vendors: vendors, isMultiple: true }),
  ];
  const productFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "unit", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "packages", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "packageType", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "note", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true },
    { key: t("Note"), isSortable: true },
    { key: t("Brand"), isSortable: true },
    { key: t("Vendor"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Expense Type"), isSortable: true },
    { key: t("Product"), isSortable: true },
    { key: t("Package Type"), isSortable: true },
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
      node: (row: AccountInvoice) => {
        return row.date;
      },
    },
    { key: "note", className: "min-w-40 pr-2" },
    { key: "brand", className: "min-w-32 pr-2" },
    { key: "vendor", className: "min-w-32 pr-2" },
    { key: "lctn", className: "min-w-32 pr-4" },
    {
      key: "expenseType",
      node: (row: any) => {
        return (
          <div className=" min-w-32">
            <p
              className="w-fit rounded-md text-sm ml-2 px-2 py-1 text-white"
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
    { key: "product", className: "min-w-32 pr-2" },
    { key: "packageType", className: "min-w-32 " },
    { key: "quantity", className: "min-w-32" },
    { key: "unit" },
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
            <P1>{row.totalExpense} ₺</P1>
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
          form.price &&
            form.kdv &&
            createAccountInvoice({
              ...form,
              totalExpense:
                Number(form.price) +
                Number(form.kdv) * (Number(form.price) / 100),
            });
        }}
        submitItem={createAccountInvoice as any}
        topClassName="flex flex-col gap-2 "
        setForm={setForm}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
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
            deleteAccountInvoice(rowToAction?._id);
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
          setForm={setForm}
          submitItem={updateAccountInvoice as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-scroll"
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              date: convertDateFormat(rowToAction.date),
              product: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.product as AccountProduct
              )?._id,
              expenseType: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.expenseType as AccountExpenseType
              )?._id,
              quantity: rowToAction.quantity,
              totalExpense: rowToAction.totalExpense,
              packageType: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.packageType as AccountPackageType
              )?._id,
              brand: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.brand as AccountBrand
              )?._id,
              vendor: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.vendor as AccountVendor
              )?._id,
              note: rowToAction.note,
              location: (rowToAction.location as Location)._id,
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
      isUpperSide: true,
      node: (
        <div className="flex flex-row gap-2">
          <p>
            {typeof generalTotalExpense === "number"
              ? generalTotalExpense.toFixed(4)
              : parseFloat(generalTotalExpense).toFixed(4)}
            ₺
          </p>
        </div>
      ),
    },
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: (
        <Switch
          checked={isEnableEdit}
          onChange={() => setIsEnableEdit((value) => !value)}
          className={`${isEnableEdit ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${isEnableEdit ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <Switch
          checked={showFilters}
          onChange={() => setShowFilters((value) => !value)}
          className={`${showFilters ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${showFilters ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
    {
      isUpperSide: false,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            setIsProductInputOpen(true);
          }}
        >
          <H5> {t("Add Product")}</H5>
        </button>
      ),
    },
  ];

  useEffect(() => {
    setTableKey((prev) => prev + 1);
    const processedRows = invoices
      .filter((invoice) => {
        return (
          (filterPanelFormElements.before === "" ||
            invoice.date <= filterPanelFormElements.before) &&
          (filterPanelFormElements.after === "" ||
            invoice.date >= filterPanelFormElements.after) &&
          passesFilter(
            filterPanelFormElements.packageType,
            (invoice.packageType as AccountPackageType)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.product,
            (invoice.product as AccountProduct)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.vendor,
            (invoice.vendor as AccountVendor)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.brand,
            (invoice.brand as AccountBrand)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.expenseType,
            (invoice.expenseType as AccountExpenseType)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.location,
            (invoice.location as Location)?._id
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
          date: formatAsLocalDate(invoice.date),
          location: invoice.location as Location,
          lctn: (invoice.location as Location)?.name,
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
        };
      });
    const filteredRows = processedRows.filter((row) =>
      rowKeys.some((rowKey) => {
        const value = row[rowKey.key as keyof typeof row];
        const query = searchQuery.trimStart().toLowerCase();
        if (typeof value === "string") {
          return value.toLowerCase().includes(query);
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
    setCurrentPage(1);
  }, [invoices, filterPanelFormElements, searchQuery]);

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
          actions={actions}
          filters={tableFilters}
          isActionsActive={isEnableEdit}
          columns={
            isEnableEdit
              ? [...columns, { key: t("Action"), isSortable: false }]
              : columns
          }
          rows={rows}
          title={t("Invoices")}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
        />
        {isProductInputOpen && (
          <GenericAddEditPanel
            isOpen={isProductInputOpen}
            close={() => setIsProductInputOpen(false)}
            inputs={productInputs}
            formKeys={productFormKeys}
            setForm={setProductInputForm}
            submitItem={createAccountProduct as any}
            generalClassName="overflow-visible"
            submitFunction={() => {
              createAccountProduct({
                ...productInputForm,
                packages:
                  productInputForm?.packages?.map((pkg: any) => ({
                    package: pkg as string,
                    packageUnitPrice: 0,
                  })) ?? [],
              });
              setProductInputForm({
                brand: [],
                vendor: [],
                expenseType: [],
                unit: "",
                packages: [],
                name: "",
              });
            }}
            topClassName="flex flex-col gap-2 "
          />
        )}
      </div>
    </>
  );
};

export default Invoice;
