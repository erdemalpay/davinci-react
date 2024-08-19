import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbTransfer, TbTransferIn } from "react-icons/tb";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountBrand,
  AccountExpenseType,
  AccountInvoice,
  AccountPackageType,
  AccountPaymentMethod,
  AccountProduct,
  AccountStockLocation,
  AccountVendor,
  NOTPAID,
} from "../../types";
import {
  useAccountBrandMutations,
  useGetAccountBrands,
} from "../../utils/api/account/brand";
import {
  useAccountExpenseTypeMutations,
  useGetAccountExpenseTypes,
} from "../../utils/api/account/expenseType";
import {
  useAccountInvoiceMutations,
  useGetAccountInvoices,
  useTransferFixtureInvoiceMutation,
  useTransferServiceInvoiceMutation,
} from "../../utils/api/account/invoice";
import {
  useAccountPackageTypeMutations,
  useGetAccountPackageTypes,
} from "../../utils/api/account/packageType";
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
  useAccountUnitMutations,
  useGetAccountUnits,
} from "../../utils/api/account/unit";
import {
  useAccountVendorMutations,
  useGetAccountVendors,
} from "../../utils/api/account/vendor";
import { formatAsLocalDate } from "../../utils/format";
import {
  BackgroundColorInput,
  BrandInput,
  ExpenseTypeInput,
  NameInput,
  PackageTypeInput,
  PaymentMethodInput,
  ProductInput,
  QuantityInput,
  StockLocationInput,
  UnitInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
type FormElementsState = {
  [key: string]: any;
};

const Invoice = () => {
  const { t } = useTranslation();
  const invoices = useGetAccountInvoices();
  const units = useGetAccountUnits();
  const packages = useGetAccountPackageTypes();
  const {
    searchQuery,
    setCurrentPage,
    setSearchQuery,
    productExpenseForm,
    setProductExpenseForm,
  } = useGeneralContext();
  const locations = useGetAccountStockLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const [isProductEditModalOpen, setIsProductEditModalOpen] = useState(false);
  const [isBrandEditModalOpen, setIsBrandEditModalOpen] = useState(false);
  const [isVendorEditModalOpen, setIsVendorEditModalOpen] = useState(false);
  const [isLocationEditModalOpen, setIsLocationEditModalOpen] = useState(false);
  const [isUnitEditModalOpen, setIsUnitEditModalOpen] = useState(false);
  const [isPackageTypeEditModalOpen, setIsPackageTypeEditModalOpen] =
    useState(false);
  const [isExpenseTypeEditModalOpen, setIsExpenseTypeEditModalOpen] =
    useState(false);
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const paymentMethods = useGetAccountPaymentMethods();
  const products = useGetAccountProducts();
  const { mutate: transferToFixtureInvoice } =
    useTransferFixtureInvoiceMutation();
  const { mutate: transferToServiceInvoice } =
    useTransferServiceInvoiceMutation();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [isAddPackageTypeOpen, setIsAddPackageTypeOpen] = useState(false);
  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isAddExpenseTypeOpen, setIsAddExpenseTypeOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountInvoice>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isTransferEdit, setIsTransferEdit] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const { createAccountProduct, updateAccountProduct } =
    useAccountProductMutations();
  const { createAccountPackageType, updateAccountPackageType } =
    useAccountPackageTypeMutations();
  const { createAccountUnit, updateAccountUnit } = useAccountUnitMutations();
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
    unit: "",
    packages: [],
    name: "",
  });
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      vendor: "",
      brand: "",
      expenseType: "",
      packages: "",
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
        location: invoice.location as AccountStockLocation,
        lctn: (invoice.location as AccountStockLocation)?.name,
        formattedDate: formatAsLocalDate(invoice.date),
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
        paymentMethodName: t(
          (invoice?.paymentMethod as AccountPaymentMethod)?.name
        ),
        paymentMethod: (invoice?.paymentMethod as AccountPaymentMethod)?._id,
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

  const filterPanelInputs = [
    ProductInput({ products: products, required: true, isMultiple: true }),
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
  const productInputs = [
    NameInput(),
    UnitInput({ units: units, required: true }),
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      isMultiple: true,
      required: true,
    }),
    PackageTypeInput({ packages: packages, isMultiple: true, required: true }),
    VendorInput({ vendors: vendors, isMultiple: true, required: true }),
    BrandInput({ brands: brands, isMultiple: true }),
  ];
  const productFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "unit", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "packages", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
  ];

  const packageTypeInputs = [NameInput(), QuantityInput()];
  const packageTypeFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const nameInput = [NameInput()]; // same for unit,brand and location inputs
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
        { key: "packageType", defaultValue: "" },
      ],
    }),
    {
      type: InputTypes.SELECT,
      formKey: "packageType",
      label: t("Package Type"),
      options: products
        .find((prod) => prod._id === productExpenseForm?.product)
        ?.packages?.map((item) => {
          const packageType = packages.find((pkg) => pkg._id === item.package);
          return {
            value: packageType?._id,
            label: packageType?.name,
          };
        }),
      placeholder: t("Package Type"),
      required:
        (products.find((prod) => prod._id === productExpenseForm?.product)
          ?.packages?.length ?? 0) > 0,
      isDisabled:
        (products?.find((prod) => prod._id === productExpenseForm?.product)
          ?.packages?.length ?? 0) < 1,
    },
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
    QuantityInput(),
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
    { key: "paymentMethod", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: "ID", isSortable: true, className: "pl-2" },
    { key: t("Date"), isSortable: true },
    { key: t("Note"), isSortable: true },
    {
      key: t("Brand"),
      className: "min-w-32 pr-2",
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddBrandOpen(true),
    },
    {
      key: t("Vendor"),
      className: "min-w-32 pr-2",
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddVendorOpen(true),
    },
    {
      key: t("Location"),
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddLocationOpen(true),
    },
    {
      key: t("Expense Type"),
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddExpenseTypeOpen(true),
    },
    {
      key: t("Product"),
      className: "min-w-32 pr-2",
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddProductOpen(true),
    },
    {
      key: t("Package Type"),
      className: `${isEnableEdit ? "min-w-40" : "min-w-32 "}`,
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddPackageTypeOpen(true),
    },
    {
      key: t("Payment Method"),
      className: `${isEnableEdit ? "min-w-40" : "min-w-32 "}`,
      isSortable: true,
    },
    { key: t("Quantity"), isSortable: true },
    {
      key: t("Unit"),
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddUnitOpen(true),
    },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Expense"), isSortable: true },
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
    {
      key: "packageType",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isEnableEdit) return;
              setIsPackageTypeEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={` "min-w-32 " ${
                isEnableEdit
                  ? "text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  : ""
              }`}
            >
              {row.packageType}
            </p>
          </div>
        );
      },
    },
    { key: "paymentMethodName", className: "min-w-32" },
    { key: "quantity", className: "min-w-32" },
    {
      key: "unit",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isEnableEdit) return;
              setIsUnitEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={` ${
                isEnableEdit
                  ? "text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  : ""
              }`}
            >
              {row.unit ?? "-"}
            </p>
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
            createAccountInvoice({
              ...productExpenseForm,
              paymentMethod:
                productExpenseForm.paymentMethod === NOTPAID
                  ? ""
                  : productExpenseForm.paymentMethod,
              isPaid:
                productExpenseForm.paymentMethod === NOTPAID ? false : true,
              totalExpense:
                Number(productExpenseForm.price) +
                Number(productExpenseForm.kdv) *
                  (Number(productExpenseForm.price) / 100),
            });
          setProductExpenseForm({});
        }}
        submitItem={createAccountInvoice as any}
        topClassName="flex flex-col gap-2 "
        setForm={setProductExpenseForm}
        constantValues={{
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
    {
      name: "Transfer",
      isDisabled: !isTransferEdit,
      icon: <TbTransfer />,
      setRow: setRowToAction,
      node: (row: AccountInvoice) => {
        return (
          <ButtonTooltip content={t("Transfer to Fixture")}>
            <TbTransfer
              className="text-red-500 cursor-pointer text-2xl"
              onClick={() => transferToFixtureInvoice({ id: row._id })}
            />
          </ButtonTooltip>
        );
      },
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: false,
      isPath: false,
    },
    {
      name: "Transfer Service",
      isDisabled: !isTransferEdit,
      icon: <TbTransferIn />,
      setRow: setRowToAction,
      node: (row: AccountInvoice) => {
        return (
          <ButtonTooltip content={t("Transfer to Service")}>
            <TbTransferIn
              className="text-green-500 cursor-pointer text-2xl"
              onClick={() => transferToServiceInvoice({ id: row._id })}
            />
          </ButtonTooltip>
        );
      },
      className: "text-green-500 cursor-pointer text-2xl  ",
      isModal: false,
      isPath: false,
    },
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
          submitItem={updateAccountInvoice as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-scroll"
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              ...rowToAction,
              date: rowToAction.date,
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
              location: (rowToAction.location as AccountStockLocation)._id,
              paymentMethod: rowToAction?.paymentMethod,
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
            filterPanelFormElements.packages,
            (invoice.packageType as AccountPackageType)?._id
          ) &&
          (!filterPanelFormElements.product.length ||
            filterPanelFormElements.product?.some((panelProduct: string) =>
              passesFilter(
                panelProduct,
                (invoice.product as AccountProduct)?._id
              )
            )) &&
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
          paymentMethodName: t(
            (invoice?.paymentMethod as AccountPaymentMethod)?.name
          ),
          paymentMethod: (invoice?.paymentMethod as AccountPaymentMethod)?._id,
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
  }, [invoices, filterPanelFormElements, searchQuery, products]);

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
          isActionsAtFront={isEnableEdit}
          actions={actions}
          filters={tableFilters}
          isActionsActive={false} //this seems wrong but for actions to appear in the first column it should be like this
          columns={
            isEnableEdit || isTransferEdit
              ? [{ key: t("Action"), isSortable: false }, ...columns]
              : columns
          }
          rows={rows}
          title={t("Product Expenses")}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
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
        {isAddPackageTypeOpen && (
          <GenericAddEditPanel
            isOpen={isAddPackageTypeOpen}
            close={() => setIsAddPackageTypeOpen(false)}
            inputs={packageTypeInputs}
            formKeys={packageTypeFormKeys}
            submitItem={createAccountPackageType as any}
            topClassName="flex flex-col gap-2 "
          />
        )}
        {isAddUnitOpen && (
          <GenericAddEditPanel
            isOpen={isAddUnitOpen}
            close={() => setIsAddUnitOpen(false)}
            inputs={nameInput}
            formKeys={nameFormKey}
            submitItem={createAccountUnit as any}
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
              unit: units.find(
                (unit) =>
                  unit.name ===
                  ((currentRow.prdct as AccountProduct)?.unit as string)
              )?._id,
              expenseType: (currentRow.prdct as AccountProduct).expenseType,
              brand: (currentRow.prdct as AccountProduct).brand,
              vendor: (currentRow.prdct as AccountProduct).vendor,
              packages: (currentRow.prdct as AccountProduct)?.packages?.map(
                (pkg) => pkg.package
              ),
            }}
            handleUpdate={() => {
              updateAccountProduct({
                id: (currentRow.prdct as AccountProduct)?._id,
                updates: {
                  ...productInputForm,
                  packages:
                    productInputForm?.packages?.map((pkg: any) => ({
                      package: pkg as string,
                      packageUnitPrice: 0,
                    })) ?? [],
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
        {isUnitEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isUnitEditModalOpen}
            close={() => setIsUnitEditModalOpen(false)}
            inputs={nameInput}
            formKeys={nameFormKey}
            submitItem={updateAccountUnit as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{
              id:
                units?.find(
                  (unit) =>
                    unit._id ===
                    ((currentRow.prdct as AccountProduct).unit as string)
                )?._id ?? "",
              updates: units?.find(
                (unit) =>
                  unit._id ===
                  ((currentRow.prdct as AccountProduct).unit as string)
              ),
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
        {isPackageTypeEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isPackageTypeEditModalOpen}
            close={() => setIsPackageTypeEditModalOpen(false)}
            inputs={packageTypeInputs}
            formKeys={packageTypeFormKeys}
            submitItem={updateAccountPackageType as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{
              id: currentRow.pckgTyp._id,
              updates: currentRow.pckgTyp,
            }}
          />
        )}
      </div>
    </>
  );
};

export default Invoice;
