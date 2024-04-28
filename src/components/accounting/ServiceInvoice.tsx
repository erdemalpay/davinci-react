import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpenseType,
  AccountService,
  AccountServiceInvoice,
  AccountVendor,
  Location,
} from "../../types";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountServiceMutations,
  useGetAccountServices,
} from "../../utils/api/account/service";
import {
  useAccountServiceInvoiceMutations,
  useGetAccountServiceInvoices,
} from "../../utils/api/account/serviceInvoice";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetLocations } from "../../utils/api/location";
import { convertDateFormat, formatAsLocalDate } from "../../utils/format";
import {
  DateInput,
  ExpenseTypeInput,
  LocationInput,
  NameInput,
  QuantityInput,
  ServiceInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { H5, P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};

const ServiceInvoice = () => {
  const { t } = useTranslation();
  const invoices = useGetAccountServiceInvoices();
  const { searchQuery, setCurrentPage, setSearchQuery } = useGeneralContext();
  const locations = useGetLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const vendors = useGetAccountVendors();
  const services = useGetAccountServices();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountServiceInvoice>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [addServiceForm, setAddServiceForm] = useState({
    name: "",
    vendor: [],
    expenseType: [],
  });
  const [form, setForm] = useState<Partial<AccountServiceInvoice>>({
    date: "",
    service: "",
    expenseType: "",
    quantity: 0,
    totalExpense: 0,
    location: 0,
    vendor: "",
    note: "",
    price: 0,
    kdv: 0,
  });

  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      service: "",
      vendor: "",
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
    createAccountServiceInvoice,
    deleteAccountServiceInvoice,
    updateAccountServiceInvoice,
  } = useAccountServiceInvoiceMutations();
  const { createAccountService } = useAccountServiceMutations();
  const [rows, setRows] = useState(
    invoices.map((invoice) => {
      return {
        ...invoice,
        service: (invoice.service as AccountService)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        vendor: (invoice.vendor as AccountVendor)?.name,
        location: invoice.location as Location,
        lctn: (invoice.location as Location)?.name,
        date: formatAsLocalDate(invoice.date),
        unitPrice: parseFloat(
          (invoice.totalExpense / invoice.quantity).toFixed(4)
        ),
        expType: invoice.expenseType as AccountExpenseType,
        vndr: invoice.vendor as AccountVendor,
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
    ServiceInput({
      services: services,
      required: true,
      invalidateKeys: [
        { key: "expenseType", defaultValue: "" },
        { key: "vendor", defaultValue: "" },
      ],
    }),
    ExpenseTypeInput({
      expenseTypes:
        expenseTypes.filter((exp) =>
          services
            .find((item) => item._id === form?.service)
            ?.expenseType.includes(exp._id)
        ) ?? [],
      required: true,
    }),
    LocationInput({ locations: locations }),
    VendorInput({
      vendors:
        vendors?.filter((vndr) =>
          services
            .find((item) => item._id === form?.service)
            ?.vendor?.includes(vndr._id)
        ) ?? [],
    }),
    QuantityInput(),
  ];
  const filterPanelInputs = [
    ServiceInput({ services: services, required: true }),
    VendorInput({ vendors: vendors, required: true }),
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

  const addServiceInputs = [
    NameInput(),
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      required: true,
      isMultiple: true,
    }),
    VendorInput({ vendors: vendors, isMultiple: true }),
  ];
  const addServiceFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "service", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "note", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true },
    { key: t("Note"), isSortable: true },
    { key: t("Vendor"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Expense Type"), isSortable: true },
    { key: t("Service"), isSortable: true },
    { key: t("Quantity"), isSortable: true },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Total Expense"), isSortable: true },
  ];
  const rowKeys = [
    { key: "_id", className: "min-w-32 pr-2" },
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: AccountServiceInvoice) => {
        return row.date;
      },
    },
    { key: "note", className: "min-w-40 pr-2" },
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
    { key: "service", className: "min-w-32 pr-2" },
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
            createAccountServiceInvoice({
              ...form,
              totalExpense:
                Number(form.price) +
                Number(form.kdv) * (Number(form.price) / 100),
            });
        }}
        submitItem={createAccountServiceInvoice as any}
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
            deleteAccountServiceInvoice(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Invoice"
          text={`${rowToAction.service} invoice will be deleted. Are you sure you want to continue?`}
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
          submitItem={updateAccountServiceInvoice as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-scroll"
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              date: convertDateFormat(rowToAction.date),
              service: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.service as AccountService
              )?._id,
              expenseType: (
                invoices.find((invoice) => invoice._id === rowToAction._id)
                  ?.expenseType as AccountExpenseType
              )?._id,
              quantity: rowToAction.quantity,
              totalExpense: rowToAction.totalExpense,
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
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
    {
      isUpperSide: false,
      node: (
        <button
          className="px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer"
          onClick={() => {
            setIsAddServiceModalOpen(true);
          }}
        >
          <H5> {t("Add Service")}</H5>
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
            filterPanelFormElements.service,
            (invoice.service as AccountService)?._id
          ) &&
          passesFilter(
            filterPanelFormElements.vendor,
            (invoice.vendor as AccountVendor)?._id
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
          service: (invoice.service as AccountService)?.name,
          expenseType: (invoice.expenseType as AccountExpenseType)?.name,

          vendor: (invoice.vendor as AccountVendor)?.name,
          date: formatAsLocalDate(invoice.date),
          location: invoice.location as Location,
          lctn: (invoice.location as Location)?.name,
          unitPrice: parseFloat(
            (invoice.totalExpense / invoice.quantity).toFixed(4)
          ),
          expType: invoice.expenseType as AccountExpenseType,
          vndr: invoice.vendor as AccountVendor,
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
            isEnableEdit
              ? [...columns, { key: t("Action"), isSortable: false }]
              : columns
          }
          rows={rows}
          title={t("Service Invoices")}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          outsideSearch={outsideSearch}
        />
        {isAddServiceModalOpen && (
          <GenericAddEditPanel
            isOpen={isAddServiceModalOpen}
            close={() => setIsAddServiceModalOpen(false)}
            inputs={addServiceInputs}
            formKeys={addServiceFormKeys}
            setForm={setAddServiceForm}
            submitItem={createAccountService as any}
            generalClassName="overflow-visible"
            submitFunction={() => {
              createAccountService({
                ...addServiceForm,
              });
              setAddServiceForm({
                name: "",
                vendor: [],
                expenseType: [],
              });
            }}
            topClassName="flex flex-col gap-2 "
          />
        )}
      </div>
    </>
  );
};

export default ServiceInvoice;
