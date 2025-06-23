import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import {
  AccountExpenseType,
  ExpenseTypes,
  NOTPAID,
  commonDateOptions,
} from "../../types";
import {
  useAccountExpenseMutations,
  useGetAccountExpenses,
} from "../../utils/api/account/expense";
import {
  useAccountExpenseTypeMutations,
  useGetAccountExpenseTypes,
} from "../../utils/api/account/expenseType";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import {
  useAccountServiceMutations,
  useGetAccountServices,
} from "../../utils/api/account/service";
import {
  useAccountVendorMutations,
  useGetAccountVendors,
} from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
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
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import TextInput from "../panelComponents/FormElements/TextInput";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { P1 } from "../panelComponents/Typography";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const ServiceInvoice = () => {
  const { t } = useTranslation();
  const {
    serviceExpenseForm,
    setServiceExpenseForm,
    rowsPerPage,
    currentPage,
    setCurrentPage,
  } = useGeneralContext();
  const locations = useGetStockLocations();
  const {
    filterServiceInvoicePanelFormElements,
    setFilterServiceInvoicePanelFormElements,
    showServiceInvoiceFilters,
    setShowServiceInvoiceFilters,
    isServiceInvoiceEnableEdit,
    setIsServiceInvoiceEnableEdit,
  } = useFilterContext();
  const invoicesPayload = useGetAccountExpenses(
    currentPage,
    rowsPerPage,
    filterServiceInvoicePanelFormElements
  );
  const invoices = invoicesPayload?.data;
  const expenseTypes = useGetAccountExpenseTypes();
  const vendors = useGetAccountVendors();
  const paymentMethods = useGetAccountPaymentMethods();
  const services = useGetAccountServices();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const [currentRow, setCurrentRow] = useState<any>();
  const [isExpenseTypeEditModalOpen, setIsExpenseTypeEditModalOpen] =
    useState(false);
  const [isVendorEditModalOpen, setIsVendorEditModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [isAddExpenseTypeOpen, setIsAddExpenseTypeOpen] = useState(false);
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
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAccountExpense, deleteAccountExpense, updateAccountExpense } =
    useAccountExpenseMutations();
  const { createAccountService, updateAccountService } =
    useAccountServiceMutations();
  const allRows = invoices?.map((invoice) => {
    return {
      ...invoice,
      service: getItem(invoice.service, services)?.name,
      expenseType: getItem(invoice.expenseType, expenseTypes)?.name,
      vendor: getItem(invoice.vendor, vendors)?.name,
      lctn: getItem(invoice.location, locations)?.name,
      formattedDate: formatAsLocalDate(invoice.date),
      unitPrice: parseFloat(
        (invoice.totalExpense / invoice.quantity).toFixed(4)
      ),
      expType: getItem(invoice.expenseType, expenseTypes),
      vndr: getItem(invoice.vendor, vendors),
      srvc: getItem(invoice.service, services),
      paymentMethodName: t(
        getItem(invoice?.paymentMethod, paymentMethods)?.name ?? ""
      ),
    };
  });
  const [rows, setRows] = useState(allRows);
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
    PaymentMethodInput({
      paymentMethods: paymentMethods?.filter((pm) => pm?.isUsedAtExpense),
      required: true,
    }),
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
      paymentMethods: paymentMethods?.filter((pm) => pm?.isUsedAtExpense),
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
  const nameInput = [NameInput()]; // same for brand and location inputs
  const nameFormKey = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const expenseTypeInputs = [NameInput(), BackgroundColorInput()];
  const expenseTypeFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
  ];
  const columns = [
    {
      key: "ID",
      isSortable: true,
      className: "pl-2",
      correspondingKey: "_id",
    },
    {
      key: t("Date"),
      isSortable: true,
      correspondingKey: "date",
    },
    {
      key: t("Note"),
      isSortable: true,
      correspondingKey: "note",
    },
    {
      key: t("Vendor"),
      isSortable: true,
      isAddable: isServiceInvoiceEnableEdit,
      onClick: () => setIsAddVendorOpen(true),
      correspondingKey: "vendor",
    },
    {
      key: t("Location"),
      isSortable: true,
      isAddable: isServiceInvoiceEnableEdit,
      correspondingKey: "location",
    },
    {
      key: t("Expense Type"),
      className: `${isServiceInvoiceEnableEdit ? "min-w-40" : "min-w-32 "}`,
      isSortable: true,
      isAddable: isServiceInvoiceEnableEdit,
      onClick: () => setIsAddExpenseTypeOpen(true),
      correspondingKey: "expenseType",
    },
    {
      key: t("Service"),
      isSortable: true,
      isAddable: isServiceInvoiceEnableEdit,
      onClick: () => setIsAddServiceModalOpen(true),
      correspondingKey: "service",
    },
    {
      key: t("Payment Method"),
      className: `${isServiceInvoiceEnableEdit ? "min-w-40" : "min-w-32 "}`,
      isSortable: true,
      correspondingKey: "paymentMethod",
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
      key: "vendor",
      node: (row: any) => {
        return (
          <div
            onClick={() => {
              if (!isServiceInvoiceEnableEdit) return;
              setIsVendorEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={` min-w-32 pr-2 ${
                isServiceInvoiceEnableEdit
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
          <div>
            <p className={` min-w-32 pr-4 `}>{row.lctn ?? "-"}</p>
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
              if (!isServiceInvoiceEnableEdit) return;
              setIsExpenseTypeEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={`w-fit rounded-md text-sm ml-2 px-2 py-1 font-semibold  ${
                isServiceInvoiceEnableEdit
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
              if (!isServiceInvoiceEnableEdit) return;
              setIsServiceEditModalOpen(true);
              setCurrentRow(row);
            }}
          >
            <p
              className={`${
                isServiceInvoiceEnableEdit
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
          serviceExpenseForm.price &&
            serviceExpenseForm.kdv &&
            createAccountExpense({
              ...serviceExpenseForm,
              type: ExpenseTypes.NONSTOCKABLE,
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
        submitItem={createAccountExpense as any}
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
      name: t("Delete"),
      isDisabled: !isServiceInvoiceEnableEdit,
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteAccountExpense(rowToAction?._id);
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
      isDisabled: !isServiceInvoiceEnableEdit,
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal:
        rowToAction && invoices ? (
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
            submitItem={updateAccountExpense as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            generalClassName="overflow-scroll"
            itemToEdit={{
              id: rowToAction._id,
              updates: {
                ...rowToAction,
                date: rowToAction.date,
                service: rowToAction.srvc._id,
                expenseType: rowToAction.expType._id,
                quantity: rowToAction.quantity,
                totalExpense: rowToAction.totalExpense,
                vendor: rowToAction.vndr._id,
                note: rowToAction.note,
                location: rowToAction.location,
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
            }).format(invoicesPayload?.generalTotalExpense ?? 0)}{" "}
            ₺
          </p>
        </div>
      ),
    },
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={isServiceInvoiceEnableEdit}
          onChange={() => {
            setIsServiceInvoiceEnableEdit(!isServiceInvoiceEnableEdit);
          }}
        />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showServiceInvoiceFilters}
          onChange={() => {
            setShowServiceInvoiceFilters(!showServiceInvoiceFilters);
          }}
        />
      ),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showServiceInvoiceFilters,
    inputs: filterPanelInputs,
    formElements: filterServiceInvoicePanelFormElements,
    setFormElements: setFilterServiceInvoicePanelFormElements,
    closeFilters: () => setShowServiceInvoiceFilters(false),
  };
  const pagination = invoicesPayload
    ? {
        totalPages: invoicesPayload.totalPages,
        totalRows: invoicesPayload.totalNumber,
      }
    : null;
  const outsideSort = {
    filterPanelFormElements: filterServiceInvoicePanelFormElements,
    setFilterPanelFormElements: setFilterServiceInvoicePanelFormElements,
  };
  const outsideSearch = () => {
    return (
      <TextInput
        placeholder={t("Search")}
        type="text"
        value={filterServiceInvoicePanelFormElements.search}
        isDebounce={true}
        onChange={(value) =>
          setFilterServiceInvoicePanelFormElements({
            ...filterServiceInvoicePanelFormElements,
            search: value,
          })
        }
      />
    );
  };
  useEffect(() => {
    setCurrentPage(1);
  }, [filterServiceInvoicePanelFormElements]);
  useEffect(() => {
    setTableKey((prev) => prev + 1);
    setRows(allRows);
  }, [
    invoicesPayload,
    filterServiceInvoicePanelFormElements,
    locations,
    vendors,
    expenseTypes,
    paymentMethods,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          filters={tableFilters}
          outsideSortProps={outsideSort}
          isActionsActive={false}
          isActionsAtFront={isServiceInvoiceEnableEdit}
          columns={
            isServiceInvoiceEnableEdit
              ? [{ key: t("Action"), isSortable: false }, ...columns]
              : columns
          }
          rows={rows ?? []}
          title={t("Service Expenses")}
          outsideSearch={outsideSearch}
          addButton={addButton}
          filterPanel={filterPanel}
          isSearch={false}
          {...(pagination && { pagination })}
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
