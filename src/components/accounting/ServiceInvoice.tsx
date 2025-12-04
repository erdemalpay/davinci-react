import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
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
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStockLocations } from "../../utils/api/location";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
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
    initialFilterPanelServiceInvoiceFormElements,
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

  const rows = useMemo(() => {
    return invoices?.map((invoice) => {
      return {
        ...invoice,
        service: getItem(invoice?.service, services)?.name,
        expenseType: getItem(invoice?.expenseType, expenseTypes)?.name,
        vendor: getItem(invoice?.vendor, vendors)?.name,
        lctn: getItem(invoice?.location, locations)?.name,
        formattedDate: formatAsLocalDate(invoice?.date),
        unitPrice: parseFloat(
          (invoice?.totalExpense / invoice?.quantity).toFixed(4)
        ),
        expType: getItem(invoice?.expenseType, expenseTypes),
        vndr: getItem(invoice?.vendor, vendors),
        srvc: getItem(invoice?.service, services),
        paymentMethodName: t(
          getItem(invoice?.paymentMethod, paymentMethods)?.name ?? ""
        ),
      };
    });
  }, [invoices, services, expenseTypes, vendors, locations, paymentMethods, t]);

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "service",
        label: t("Service"),
        options: services.map((service) => ({
          value: service._id,
          label: service.name,
        })),
        placeholder: t("Service"),
        isMultiple: true,
        required: true,
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
            setFilterServiceInvoicePanelFormElements({
              ...filterServiceInvoicePanelFormElements,
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
      services,
      vendors,
      expenseTypes,
      paymentMethods,
      locations,
      filterServiceInvoicePanelFormElements,
      setFilterServiceInvoicePanelFormElements,
    ]
  );

  const addServiceInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
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
        isMultiple: true,
        required: true,
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
        isMultiple: true,
        required: true,
      },
    ],
    [t, expenseTypes, vendors]
  );
  const addServiceFormKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "expenseType", type: FormKeyTypeEnum.STRING },
      { key: "vendor", type: FormKeyTypeEnum.STRING },
    ],
    []
  );
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
        formKey: "service",
        label: t("Service"),
        options: services.map((service) => ({
          value: service._id,
          label: service.name,
        })),
        placeholder: t("Service"),
        required: true,
        invalidateKeys: [
          { key: "expenseType", defaultValue: "" },
          { key: "vendor", defaultValue: "" },
        ],
      },
      {
        type: InputTypes.SELECT,
        formKey: "expenseType",
        label: t("Expense Type"),
        options: expenseTypes
          .filter((exp) =>
            services
              .find((item) => item?._id === serviceExpenseForm?.service)
              ?.expenseType.includes(exp._id)
          )
          .map((expenseType) => ({
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
        formKey: "vendor",
        label: t("Vendor"),
        options:
          vendors
            ?.filter((vndr) =>
              services
                .find((item) => item?._id === serviceExpenseForm?.service)
                ?.vendor?.includes(vndr._id)
            )
            .map((vendor) => ({
              value: vendor._id,
              label: vendor.name,
            })) || [],
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
      services,
      expenseTypes,
      serviceExpenseForm,
      locations,
      vendors,
      paymentMethods,
    ]
  );
  const formKeys = useMemo(
    () => [
      { key: "date", type: FormKeyTypeEnum.DATE },
      { key: "service", type: FormKeyTypeEnum.STRING },
      { key: "expenseType", type: FormKeyTypeEnum.STRING },
      { key: "location", type: FormKeyTypeEnum.STRING },
      { key: "vendor", type: FormKeyTypeEnum.STRING },
      { key: "note", type: FormKeyTypeEnum.STRING },
      { key: "paymentMethod", type: FormKeyTypeEnum.STRING },
      { key: "quantity", type: FormKeyTypeEnum.NUMBER },
      { key: "isAfterCount", type: FormKeyTypeEnum.BOOLEAN },
    ],
    []
  );
  const nameInput = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
    ],
    [t]
  );
  const nameFormKey = useMemo(
    () => [{ key: "name", type: FormKeyTypeEnum.STRING }],
    []
  );
  const expenseTypeInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.COLOR,
        formKey: "backgroundColor",
        label: t("Background Color"),
        placeholder: t("Background Color"),
        required: true,
      },
    ],
    [t]
  );
  const expenseTypeFormKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
    ],
    []
  );
  const columns = useMemo(
    () => [
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
      { key: t("Is After Count"), isSortable: true },
      { key: t("Unit Price"), isSortable: false },
      { key: t("Vat") + "%", isSortable: true },
      { key: t("Discount") + "%", isSortable: true },
      {
        key: t("Total Expense"),
        isSortable: true,
        correspondingKey: "totalExpense",
      },
    ],
    [t, isServiceInvoiceEnableEdit]
  );
  const rowKeys = [
    { key: "_id", className: "min-w-32 px-2" },
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row?.formattedDate;
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
              {row?.vendor ?? "-"}
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
            <p className={` min-w-32 pr-4 `}>{row?.lctn ?? "-"}</p>
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
              {row?.service}
            </p>
          </div>
        );
      },
    },
    { key: "paymentMethodName", className: "min-w-32" },
    { key: "quantity", className: "min-w-32" },
    {
      key: "isAfterCount",
      node: (row: any) => {
        return isServiceInvoiceEnableEdit ? (
          <SwitchButton
            checked={row?.isAfterCount}
            onChange={() => {
              updateAccountExpense({
                id: row?._id,
                updates: {
                  ...row,
                  product: invoices?.find(
                    (invoice) => invoice?._id === row?._id
                  )?.product,
                  expenseType: invoices?.find(
                    (invoice) => invoice?._id === row?._id
                  )?.expenseType,
                  quantity: row?.quantity,
                  totalExpense: row?.totalExpense,
                  brand: invoices?.find((invoice) => invoice?._id === row?._id)
                    ?.brand,
                  vendor: invoices?.find((invoice) => invoice?._id === row?._id)
                    ?.vendor,
                  isAfterCount: !row?.isAfterCount,
                },
              });
            }}
          />
        ) : row?.isAfterCount ? (
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
            <P1>{row?.unitPrice} ₺</P1>
          </div>
        );
      },
    },
    { key: "vat", className: "min-w-32 pr-2" },
    { key: "discount", className: "min-w-32 pr-2" },
    {
      key: "totalExpense",
      node: (row: any) => {
        return (
          <div className="min-w-32">
            <P1>
              {parseFloat(row?.totalExpense)
                .toFixed(4)
                .replace(/\.?0*$/, "")}{" "}
              ₺
            </P1>
          </div>
        );
      },
    },
  ];
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
              formKey: "vat",
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
            { key: "vat", type: FormKeyTypeEnum.NUMBER },
          ]}
          submitFunction={() => {
            const discountedPrice =
              Number(serviceExpenseForm.price) -
              (Number(serviceExpenseForm.discount) / 100) *
                Number(serviceExpenseForm.price);
            createAccountExpense({
              ...serviceExpenseForm,
              type: ExpenseTypes.NONSTOCKABLE,
              paymentMethod:
                serviceExpenseForm?.paymentMethod === NOTPAID
                  ? ""
                  : serviceExpenseForm?.paymentMethod,
              isPaid:
                serviceExpenseForm?.paymentMethod === NOTPAID ? false : true,
              totalExpense:
                discountedPrice +
                Number(serviceExpenseForm?.vat) * (discountedPrice / 100),
            });
            setServiceExpenseForm({});
          }}
          submitItem={createAccountExpense as any}
          generalClassName="overflow-scroll min-w-[90%]"
          anotherPanelTopClassName=""
          topClassName="flex flex-col gap-2"
          nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
          setForm={setServiceExpenseForm}
          constantValues={{
            date: format(new Date(), "yyyy-MM-dd"),
            ...serviceExpenseForm,
            isAfterCount: true,
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
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      serviceExpenseForm,
      createAccountExpense,
      setServiceExpenseForm,
    ]
  );
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
          text={`${rowToAction?.service} invoice will be deleted. Are you sure you want to continue?`}
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
            generalClassName="overflow-scroll min-w-[90%]"
            anotherPanelTopClassName=""
            topClassName="flex flex-col gap-2"
            nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
            itemToEdit={{
              id: rowToAction?._id,
              updates: {
                ...rowToAction,
                date: rowToAction?.date,
                service: rowToAction?.srvc?._id,
                expenseType: rowToAction?.expType?._id,
                quantity: rowToAction?.quantity,
                totalExpense: rowToAction?.totalExpense,
                vendor: rowToAction?.vndr._id,
                note: rowToAction?.note,
                location: rowToAction?.location,
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
    ],
    [
      t,
      invoicesPayload,
      isServiceInvoiceEnableEdit,
      setIsServiceInvoiceEnableEdit,
      showServiceInvoiceFilters,
      setShowServiceInvoiceFilters,
    ]
  );
  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showServiceInvoiceFilters,
      inputs: filterPanelInputs,
      formElements: filterServiceInvoicePanelFormElements,
      setFormElements: setFilterServiceInvoicePanelFormElements,
      closeFilters: () => setShowServiceInvoiceFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterServiceInvoicePanelFormElements(
          initialFilterPanelServiceInvoiceFormElements
        );
      },
    }),
    [
      showServiceInvoiceFilters,
      filterPanelInputs,
      filterServiceInvoicePanelFormElements,
      setFilterServiceInvoicePanelFormElements,
      setShowServiceInvoiceFilters,
      initialFilterPanelServiceInvoiceFormElements,
    ]
  );
  const pagination = useMemo(() => {
    return invoicesPayload
      ? {
          totalPages: invoicesPayload?.totalPages,
          totalRows: invoicesPayload?.totalNumber,
        }
      : null;
  }, [invoicesPayload]);
  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterServiceInvoicePanelFormElements,
      setFilterPanelFormElements: setFilterServiceInvoicePanelFormElements,
    }),
    [
      filterServiceInvoicePanelFormElements,
      setFilterServiceInvoicePanelFormElements,
    ]
  );
  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterServiceInvoicePanelFormElements,
      setFilterPanelFormElements: setFilterServiceInvoicePanelFormElements,
    };
  }, [
    t,
    filterServiceInvoicePanelFormElements,
    setFilterServiceInvoicePanelFormElements,
  ]);
  useMemo(() => {
    setCurrentPage(1);
  }, [filterServiceInvoicePanelFormElements, setCurrentPage]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          filters={tableFilters}
          outsideSortProps={outsideSort}
          isActionsActive={isServiceInvoiceEnableEdit}
          isActionsAtFront={isServiceInvoiceEnableEdit}
          columns={
            isServiceInvoiceEnableEdit
              ? [{ key: t("Action"), isSortable: false }, ...columns]
              : columns
          }
          rows={rows ?? []}
          title={t("Service Expenses")}
          outsideSearchProps={outsideSearchProps}
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
              name: currentRow?.srvc?.name,
              expenseType: currentRow?.srvc?.expenseType,
              vendor: currentRow?.srvc?.vendor,
            }}
            handleUpdate={() => {
              updateAccountService({
                id: currentRow?.srvc?._id,
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
            itemToEdit={{ id: currentRow?.vndr._id, updates: currentRow?.vndr }}
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
              id: currentRow?.expType?._id,
              updates: currentRow?.expType,
            }}
          />
        )}
      </div>
    </>
  );
};

export default ServiceInvoice;
