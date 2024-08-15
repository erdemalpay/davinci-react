import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiSearch } from "react-icons/ci";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbTransfer } from "react-icons/tb";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpenseType,
  AccountPaymentMethod,
  AccountService,
  AccountServiceInvoice,
  AccountStockLocation,
  AccountVendor,
  NOTPAID,
} from "../../types";
import {
  useAccountExpenseTypeMutations,
  useGetAccountExpenseTypes,
} from "../../utils/api/account/expenseType";
import { useServiceInvoiceTransferInvoiceMutation } from "../../utils/api/account/invoice";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import {
  useAccountServiceMutations,
  useGetAccountServices,
} from "../../utils/api/account/service";
import {
  useAccountServiceInvoiceMutations,
  useGetAccountServiceInvoices,
} from "../../utils/api/account/serviceInvoice";
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
  ExpenseTypeInput,
  NameInput,
  PaymentMethodInput,
  QuantityInput,
  ServiceInput,
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

const ServiceInvoice = () => {
  const { t } = useTranslation();
  const invoices = useGetAccountServiceInvoices();
  const {
    searchQuery,
    setCurrentPage,
    setSearchQuery,
    serviceExpenseForm,
    setServiceExpenseForm,
  } = useGeneralContext();
  const locations = useGetAccountStockLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const vendors = useGetAccountVendors();
  const paymentMethods = useGetAccountPaymentMethods();
  const { mutate: transferServiceInvoiceToInvoice } =
    useServiceInvoiceTransferInvoiceMutation();
  const services = useGetAccountServices();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountServiceInvoice>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isTransferEdit, setIsTransferEdit] = useState(false);
  const [currentRow, setCurrentRow] = useState<any>();
  const [isExpenseTypeEditModalOpen, setIsExpenseTypeEditModalOpen] =
    useState(false);
  const [isVendorEditModalOpen, setIsVendorEditModalOpen] = useState(false);
  const [isLocationEditModalOpen, setIsLocationEditModalOpen] = useState(false);
  const [temporarySearch, setTemporarySearch] = useState("");
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [isAddExpenseTypeOpen, setIsAddExpenseTypeOpen] = useState(false);
  const { createAccountStockLocation, updateAccountStockLocation } =
    useAccountStockLocationMutations();
  const { createAccountVendor, updateAccountVendor } =
    useAccountVendorMutations();
  const { createAccountExpenseType, updateAccountExpenseType } =
    useAccountExpenseTypeMutations();
  const [isServiceEditModalOpen, setIsServiceEditModalOpen] = useState(false);
  const [addServiceForm, setAddServiceForm] = useState({
    name: "",
    vendor: [],
    expenseType: [],
  });
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      service: [],
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
  const { createAccountService, updateAccountService } =
    useAccountServiceMutations();
  const [rows, setRows] = useState(
    invoices.map((invoice) => {
      return {
        ...invoice,
        service: (invoice.service as AccountService)?.name,
        expenseType: (invoice.expenseType as AccountExpenseType)?.name,
        vendor: (invoice.vendor as AccountVendor)?.name,
        location: invoice.location as AccountStockLocation,
        lctn: (invoice.location as AccountStockLocation)?.name,
        formattedDate: formatAsLocalDate(invoice.date),
        unitPrice: parseFloat(
          (invoice.totalExpense / invoice.quantity).toFixed(4)
        ),
        expType: invoice.expenseType as AccountExpenseType,
        vndr: invoice.vendor as AccountVendor,
        srvc: invoice.service as AccountService,
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
    ServiceInput({ services: services, required: true, isMultiple: true }),
    VendorInput({ vendors: vendors, required: true }),
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

  const addServiceInputs = [
    NameInput(),
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      required: true,
      isMultiple: true,
    }),
    VendorInput({ vendors: vendors, isMultiple: true, required: true }),
  ];
  const addServiceFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
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
            .find((item) => item._id === serviceExpenseForm?.service)
            ?.expenseType.includes(exp._id)
        ) ?? [],
      required: true,
    }),
    StockLocationInput({ locations: locations }),
    VendorInput({
      vendors:
        vendors?.filter((vndr) =>
          services
            .find((item) => item._id === serviceExpenseForm?.service)
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
    { key: "service", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "note", type: FormKeyTypeEnum.STRING },
    { key: "paymentMethod", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const nameInput = [NameInput()]; // same for unit,brand and location inputs
  const nameFormKey = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const expenseTypeInputs = [NameInput(), BackgroundColorInput()];
  const expenseTypeFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
  ];

  const columns = [
    { key: "ID", isSortable: true },
    { key: t("Date"), isSortable: true },
    { key: t("Note"), isSortable: true },
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
      className: `${isEnableEdit ? "min-w-40" : "min-w-32 "}`,
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddExpenseTypeOpen(true),
    },
    {
      key: t("Service"),
      isSortable: true,
      isAddable: isEnableEdit,
      onClick: () => setIsAddServiceModalOpen(true),
    },
    {
      key: t("Payment Method"),
      className: `${isEnableEdit ? "min-w-40" : "min-w-32 "}`,
      isSortable: true,
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
      key: "service",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isEnableEdit) return;
              setIsServiceEditModalOpen(true);
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
              {row.service}
            </p>
          </div>
        );
      },
    },
    { key: "paymentMethodName", className: "min-w-32" },
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
        generalClassName="overflow-scroll"
        submitFunction={() => {
          serviceExpenseForm.price &&
            serviceExpenseForm.kdv &&
            createAccountServiceInvoice({
              ...serviceExpenseForm,
              paymentMethod:
                serviceExpenseForm.paymentMethod === NOTPAID
                  ? ""
                  : serviceExpenseForm.paymentMethod,
              isPaid:
                serviceExpenseForm.paymentMethod === NOTPAID ? false : true,
              totalExpense:
                Number(serviceExpenseForm.price) +
                Number(serviceExpenseForm.kdv) *
                  (Number(serviceExpenseForm.price) / 100),
            });
          setServiceExpenseForm({});
        }}
        submitItem={createAccountServiceInvoice as any}
        topClassName="flex flex-col gap-2 "
        setForm={setServiceExpenseForm}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
          ...serviceExpenseForm,
        }}
        additionalCancelFunction={() => {
          setServiceExpenseForm({});
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
      node: (row: AccountServiceInvoice) => {
        return (
          <ButtonTooltip content={t("Transfer to Product Expense")}>
            <TbTransfer
              className="text-red-500 cursor-pointer text-2xl"
              onClick={() => transferServiceInvoiceToInvoice({ id: row._id })}
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
          additionalCancelFunction={() => {
            setServiceExpenseForm({});
          }}
          additionalSubmitFunction={() => {
            setServiceExpenseForm({});
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
          setForm={setServiceExpenseForm}
          submitItem={updateAccountServiceInvoice as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-scroll"
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              ...rowToAction,
              date: rowToAction.date,
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
          (!filterPanelFormElements.service.length ||
            filterPanelFormElements.service?.some((panelService: string) =>
              passesFilter(
                panelService,
                (invoice.service as AccountService)?._id
              )
            )) &&
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
            (invoice.location as AccountStockLocation)?._id
          )
        );
      })
      .map((invoice) => {
        return {
          ...invoice,
          service: (invoice.service as AccountService)?.name,
          expenseType: (invoice.expenseType as AccountExpenseType)?.name,
          vendor: (invoice.vendor as AccountVendor)?.name,
          formattedDate: formatAsLocalDate(invoice.date),
          location: invoice.location as AccountStockLocation,
          lctn: (invoice.location as AccountStockLocation)?.name,
          unitPrice: parseFloat(
            (invoice.totalExpense / invoice.quantity).toFixed(4)
          ),
          expType: invoice.expenseType as AccountExpenseType,
          vndr: invoice.vendor as AccountVendor,
          srvc: invoice.service as AccountService,
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
          actions={actions}
          filters={tableFilters}
          isActionsActive={isEnableEdit}
          columns={
            isEnableEdit || isTransferEdit
              ? [...columns, { key: t("Action"), isSortable: false }]
              : columns
          }
          rows={rows}
          title={t("Service Expenses")}
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
        {isServiceEditModalOpen && currentRow && (
          <GenericAddEditPanel
            isOpen={isServiceEditModalOpen}
            close={() => setIsServiceEditModalOpen(false)}
            inputs={addServiceInputs}
            formKeys={addServiceFormKeys}
            generalClassName="overflow-scroll"
            submitItem={updateAccountService as any}
            setForm={setAddServiceForm}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            constantValues={{
              name: currentRow.srvc.name,
              expenseType: currentRow.srvc.expenseType,
              vendor: currentRow.srvc.vendor,
            }}
            handleUpdate={() => {
              updateAccountService({
                id: currentRow.srvc?._id,
                updates: {
                  ...addServiceForm,
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

export default ServiceInvoice;
