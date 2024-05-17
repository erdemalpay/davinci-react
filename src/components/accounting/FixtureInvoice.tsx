import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbTransfer } from "react-icons/tb";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountBrand,
  AccountExpenseType,
  AccountFixture,
  AccountFixtureInvoice,
  AccountStockLocation,
  AccountVendor,
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
  useAccountFixtureMutations,
  useGetAccountFixtures,
} from "../../utils/api/account/fixture";
import {
  useAccountFixtureInvoiceMutations,
  useGetAccountFixtureInvoices,
} from "../../utils/api/account/fixtureInvoice";
import { useFixtureInvoiceTransferInvoiceMutation } from "../../utils/api/account/invoice";
import {
  useAccountStockLocationMutations,
  useGetAccountStockLocations,
} from "../../utils/api/account/stockLocation";
import {
  useAccountVendorMutations,
  useGetAccountVendors,
} from "../../utils/api/account/vendor";
import { formatAsLocalDate } from "../../utils/format";
import {
  BackgroundColorInput,
  BrandInput,
  ExpenseTypeInput,
  FixtureInput,
  NameInput,
  QuantityInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

const FixtureInvoice = () => {
  const { t } = useTranslation();
  const invoices = useGetAccountFixtureInvoices();
  const {
    searchQuery,
    setCurrentPage,
    setSearchQuery,
    fixtureExpenseForm,
    setFixtureExpenseForm,
  } = useGeneralContext();
  const locations = useGetAccountStockLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const fixtures = useGetAccountFixtures();
  const { mutate: transferFixtureInvoiceToInvoice } =
    useFixtureInvoiceTransferInvoiceMutation();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [isBrandEditModalOpen, setIsBrandEditModalOpen] = useState(false);
  const [isExpenseTypeEditModalOpen, setIsExpenseTypeEditModalOpen] =
    useState(false);
  const [isVendorEditModalOpen, setIsVendorEditModalOpen] = useState(false);
  const [isLocationEditModalOpen, setIsLocationEditModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountFixtureInvoice>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isTransferEdit, setIsTransferEdit] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const [isAddFixtureModalOpen, setIsAddFixtureModalOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isAddExpenseTypeOpen, setIsAddExpenseTypeOpen] = useState(false);
  const { createAccountStockLocation, updateAccountStockLocation } =
    useAccountStockLocationMutations();
  const { createAccountBrand, updateAccountBrand } = useAccountBrandMutations();
  const { createAccountVendor, updateAccountVendor } =
    useAccountVendorMutations();
  const { createAccountExpenseType, updateAccountExpenseType } =
    useAccountExpenseTypeMutations();
  const { createAccountFixture, updateAccountFixture } =
    useAccountFixtureMutations();
  const [isFixtureEditModalOpen, setIsFixtureEditModalOpen] = useState(false);
  const [addFixtureForm, setAddFixtureForm] = useState({
    name: "",
    brand: [],
    vendor: [],
    expenseType: [],
  });
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      fixture: "",
      vendor: "",
      brand: "",
      expenseType: "",
      location: "",
      before: "",
      after: "",
    });

  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const {
    createAccountFixtureInvoice,
    deleteAccountFixtureInvoice,
    updateAccountFixtureInvoice,
  } = useAccountFixtureInvoiceMutations();
  const [rows, setRows] = useState(
    invoices.map((invoice) => {
      return {
        ...invoice,
        fixture: (invoice.fixture as AccountFixture)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        brand: (invoice.brand as AccountBrand)?.name,
        vendor: (invoice.vendor as AccountVendor)?.name,
        location: invoice.location as AccountStockLocation,
        lctn: (invoice.location as AccountStockLocation)?.name,
        formattedDate: formatAsLocalDate(invoice.date),
        unitPrice: parseFloat(
          (invoice.totalExpense / invoice.quantity).toFixed(4)
        ),
        expType: invoice.expenseType as AccountExpenseType,
        brnd: invoice.brand as AccountBrand,
        vndr: invoice.vendor as AccountVendor,
        fxtr: invoice.fixture as AccountFixture,
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
  const nameInput = [NameInput()]; // same for unit,brand and location inputs
  const nameFormKey = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const expenseTypeInputs = [NameInput(), BackgroundColorInput()];
  const expenseTypeFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
  ];

  const filterPanelInputs = [
    FixtureInput({ fixtures: fixtures, required: true }),
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

  const addFixtureInputs = [
    NameInput(),
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      required: true,
      isMultiple: true,
    }),
    BrandInput({ brands: brands, isMultiple: true }),
    VendorInput({ vendors: vendors, isMultiple: true }),
  ];
  const addFixtureFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
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
    FixtureInput({
      fixtures: fixtures,
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
          fixtures
            .find((item) => item._id === fixtureExpenseForm?.fixture)
            ?.expenseType.includes(exp._id)
        ) ?? [],
      required: true,
    }),
    StockLocationInput({ locations: locations }),
    BrandInput({
      brands:
        brands?.filter((brnd) =>
          fixtures
            .find((item) => item._id === fixtureExpenseForm?.fixture)
            ?.brand?.includes(brnd._id)
        ) ?? [],
    }),
    VendorInput({
      vendors:
        vendors?.filter((vndr) =>
          fixtures
            .find((item) => item._id === fixtureExpenseForm?.fixture)
            ?.vendor?.includes(vndr._id)
        ) ?? [],
    }),
    QuantityInput(),
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "fixture", type: FormKeyTypeEnum.STRING },
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
    {
      key: t("Brand"),
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddBrandOpen(true),
    },
    {
      key: t("Vendor"),
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
      className: `${isEnableEdit && "min-w-40"}`,
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddExpenseTypeOpen(true),
    },
    {
      key: t("Fixture"),
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddFixtureModalOpen(true),
    },
    { key: t("Quantity"), isSortable: true },
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
              className={` min-w-32 pr-2 ${
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
      key: "fixture",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isEnableEdit) return;
              setIsFixtureEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={`${
                isEnableEdit
                  ? "text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
                  : ""
              }`}
            >
              {row.fixture}
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
        isCancelConfirmationDialogExist={true}
        additionalCancelFunction={() => {
          setFixtureExpenseForm({});
        }}
        formKeys={[
          ...formKeys,
          { key: "price", type: FormKeyTypeEnum.NUMBER },
          { key: "kdv", type: FormKeyTypeEnum.NUMBER },
        ]}
        generalClassName="overflow-scroll"
        submitFunction={() => {
          fixtureExpenseForm.price &&
            fixtureExpenseForm.kdv &&
            createAccountFixtureInvoice({
              ...fixtureExpenseForm,
              totalExpense:
                Number(fixtureExpenseForm.price) +
                Number(fixtureExpenseForm.kdv) *
                  (Number(fixtureExpenseForm.price) / 100),
            });
        }}
        submitItem={createAccountFixtureInvoice as any}
        topClassName="flex flex-col gap-2 "
        setForm={setFixtureExpenseForm}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
          ...fixtureExpenseForm,
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
      name: t("Transfer"),
      isDisabled: !isTransferEdit,
      icon: <TbTransfer />,
      setRow: setRowToAction,
      node: (row: AccountFixtureInvoice) => {
        return (
          <ButtonTooltip content={t("Transfer to Product Expense")}>
            <TbTransfer
              className="text-red-500 cursor-pointer text-2xl"
              onClick={() => transferFixtureInvoiceToInvoice({ id: row._id })}
            />
          </ButtonTooltip>
        );
      },
      className: "text-red-500 cursor-pointer text-2xl  ",
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
            deleteAccountFixtureInvoice(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Invoice"
          text={`${rowToAction.fixture} invoice will be deleted. Are you sure you want to continue?`}
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
          isCancelConfirmationDialogExist={true}
          additionalCancelFunction={() => {
            setFixtureExpenseForm({});
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
          setForm={setFixtureExpenseForm}
          submitItem={updateAccountFixtureInvoice as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-scroll"
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              date: rowToAction.date,
              fixture: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.fixture as AccountFixture
              )?._id,
              expenseType: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.expenseType as AccountExpenseType
              )?._id,
              quantity: rowToAction.quantity,
              totalExpense: rowToAction.totalExpense,
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
            filterPanelFormElements.fixture,
            (invoice.fixture as AccountFixture)?._id
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
            (invoice.location as AccountStockLocation)?._id
          )
        );
      })
      .map((invoice) => {
        return {
          ...invoice,
          fixture: (invoice.fixture as AccountFixture)?.name,
          expenseType: (invoice.expenseType as AccountExpenseType)?.name,
          brand: (invoice.brand as AccountBrand)?.name,
          vendor: (invoice.vendor as AccountVendor)?.name,
          formattedDate: formatAsLocalDate(invoice.date),
          location: invoice.location as AccountStockLocation,
          lctn: (invoice.location as AccountStockLocation)?.name,
          unitPrice: parseFloat(
            (invoice.totalExpense / invoice.quantity).toFixed(4)
          ),
          expType: invoice.expenseType as AccountExpenseType,
          brnd: invoice.brand as AccountBrand,
          vndr: invoice.vendor as AccountVendor,
          fxtr: invoice.fixture as AccountFixture,
        };
      });
    const filteredRows = processedRows.filter((row) =>
      rowKeys.some((rowKey) => {
        const value = row[rowKey.key as keyof typeof row];
        const timeValue = row["formattedDate"];
        const query = searchQuery.trimStart().toLowerCase();
        if (typeof value === "string") {
          return (
            value.toLowerCase().includes(query) ||
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
      <div className="flex flex-row relative">
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
            isEnableEdit || isTransferEdit
              ? [...columns, { key: t("Action"), isSortable: false }]
              : columns
          }
          rows={rows}
          title={t("Fixture Expenses")}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
        />
        {isAddFixtureModalOpen && (
          <GenericAddEditPanel
            isOpen={isAddFixtureModalOpen}
            close={() => setIsAddFixtureModalOpen(false)}
            inputs={addFixtureInputs}
            formKeys={addFixtureFormKeys}
            setForm={setAddFixtureForm}
            submitItem={createAccountFixture as any}
            generalClassName="overflow-visible"
            submitFunction={() => {
              createAccountFixture({
                ...addFixtureForm,
              });
              setAddFixtureForm({
                name: "",
                brand: [],
                vendor: [],
                expenseType: [],
              });
            }}
            topClassName="flex flex-col gap-2 "
          />
        )}
        {isFixtureEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isFixtureEditModalOpen}
            close={() => setIsFixtureEditModalOpen(false)}
            inputs={addFixtureInputs}
            formKeys={addFixtureFormKeys}
            generalClassName="overflow-scroll"
            submitItem={updateAccountFixture as any}
            setForm={setAddFixtureForm}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            constantValues={{
              name: currentRow.fxtr.name,
              expenseType: currentRow.fxtr.expenseType,
              brand: currentRow.fxtr.brand,
              vendor: currentRow.fxtr.vendor,
            }}
            handleUpdate={() => {
              updateAccountFixture({
                id: currentRow.fxtr?._id,
                updates: {
                  ...addFixtureForm,
                },
              });
            }}
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

export default FixtureInvoice;
