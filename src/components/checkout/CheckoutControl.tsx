import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useLocationContext } from "../../context/Location.context";
import { CheckoutControl } from "../../types";
import { useGetAccountFixtureInvoices } from "../../utils/api/account/fixtureInvoice";
import { useGetAccountInvoices } from "../../utils/api/account/invoice";
import { useGetAccountServiceInvoices } from "../../utils/api/account/serviceInvoice";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetCheckoutCashouts } from "../../utils/api/checkout/cashout";
import {
  useCheckoutControlMutations,
  useGetCheckoutControls,
} from "../../utils/api/checkout/checkoutControl";
import { useGetCheckoutIncomes } from "../../utils/api/checkout/income";
import { useGetPanelControlCheckoutCashs } from "../../utils/api/panelControl/checkoutCash";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { StockLocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
const CheckoutControlPage = () => {
  const { t } = useTranslation();
  const checkoutControls = useGetCheckoutControls();
  const incomes = useGetCheckoutIncomes();
  const invoices = useGetAccountInvoices();
  const fixtureInvoices = useGetAccountFixtureInvoices();
  const serviceInvoices = useGetAccountServiceInvoices();
  const cashouts = useGetCheckoutCashouts();
  const beginningCashs = useGetPanelControlCheckoutCashs();
  const locations = useGetAccountStockLocations();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const { selectedLocationId } = useLocationContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<CheckoutControl>();
  const [showFilters, setShowFilters] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      user: "",
      location: "",
      date: "",
    });
  const {
    createCheckoutControl,
    deleteCheckoutControl,
    updateCheckoutControl,
  } = useCheckoutControlMutations();

  const getPreviousDate = (date: string) => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() - 1);
    return currentDate.toISOString().split("T")[0]; // Convert to "YYYY-MM-DD" format
  };
  const allRows =
    checkoutControls?.map((checkoutControl, index) => {
      const checkoutControlUser = getItem(checkoutControl?.user, users);
      const checkoutControlLocation = getItem(
        checkoutControl?.location,
        locations
      );
      return {
        ...checkoutControl,
        usr: checkoutControlUser?.name,
        lctn: checkoutControlLocation?.name,
        formattedDate: formatAsLocalDate(checkoutControl?.date),
        beginningQuantity:
          index !== 0
            ? checkoutControls[index - 1].amount
            : beginningCashs?.filter(
                (cash) =>
                  cash.location === checkoutControl?.location &&
                  cash.date <= checkoutControl?.date
              )?.[0]?.amount ?? 0,
        incomeQuantity: incomes
          ?.filter(
            (item) => item.date === getPreviousDate(checkoutControl?.date)
          )
          ?.reduce((acc, item) => acc + item.amount, 0),
        expenseQuantity:
          invoices
            ?.filter(
              (item) =>
                checkoutControl?.date >= item?.date &&
                item?.paymentMethod === "cash" &&
                item.date === getPreviousDate(checkoutControl?.date)
            )
            ?.reduce((acc, item) => acc + item.totalExpense, 0) +
          fixtureInvoices
            ?.filter(
              (item) =>
                checkoutControl?.date >= item?.date &&
                item?.paymentMethod === "cash" &&
                item.date === getPreviousDate(checkoutControl?.date)
            )
            ?.reduce((acc, item) => acc + item.totalExpense, 0) +
          serviceInvoices
            ?.filter(
              (item) =>
                checkoutControl?.date >= item?.date &&
                item?.paymentMethod === "cash" &&
                item.date === getPreviousDate(checkoutControl?.date)
            )
            ?.reduce((acc, item) => acc + item.totalExpense, 0),
        cashout: cashouts
          ?.filter(
            (item) =>
              checkoutControl?.date >= item?.date &&
              item.date === getPreviousDate(checkoutControl?.date)
          )
          ?.reduce((acc, item) => acc + item.amount, 0),
      };
    }) ?? [];
  const arrangedAllRows = allRows.map((row) => {
    return {
      ...row,
      expectedQuantity:
        row.beginningQuantity +
        row.incomeQuantity -
        row.expenseQuantity -
        row.cashout,
      difference:
        row.amount -
        (row.beginningQuantity +
          row.incomeQuantity -
          row.expenseQuantity -
          row.cashout),
    };
  });

  const [rows, setRows] = useState(arrangedAllRows);

  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Count Quantity"), isSortable: true },
    { key: t("Beginning Quantity"), isSortable: true },
    { key: t("Income Quantity"), isSortable: true },
    { key: t("Expense Quantity"), isSortable: true },
    { key: t("Cashout"), isSortable: true },
    { key: t("Expected Quantity"), isSortable: true },
    { key: t("Difference"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "user",
      label: t("User"),
      options: users
        .filter((user) => user.active)
        .map((user) => ({
          value: user._id,
          label: user.name,
        })),
      placeholder: t("User"),
      required: true,
    },
    StockLocationInput({ locations: locations, required: true }),
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return (
          <p className={`${row?.className} min-w-32 pr-2`}>
            {row.formattedDate}
          </p>
        );
      },
    },
    {
      key: "usr",
      className: "min-w-32 pr-1",
    },
    { key: "lctn" },
    {
      key: "amount",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2">
            <p className={`${row?.className} `}>
              {new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(row.amount)}{" "}
              ₺
            </p>
          </div>
        );
      },
    },
    {
      key: "beginningQuantity",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2">
            <p className={`${row?.className} `}>
              {new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(row.beginningQuantity)}{" "}
              ₺
            </p>
          </div>
        );
      },
    },
    {
      key: "incomeQuantity",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2">
            <p className={`${row?.className} `}>
              {new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(row.incomeQuantity)}{" "}
              ₺
            </p>
          </div>
        );
      },
    },
    {
      key: "expenseQuantity",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2">
            <p className={`${row?.className} `}>
              {new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(row.expenseQuantity)}{" "}
              ₺
            </p>
          </div>
        );
      },
    },
    {
      key: "cashout",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2">
            <p className={`${row?.className} `}>
              {new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(row.cashout)}{" "}
              ₺
            </p>
          </div>
        );
      },
    },
    {
      key: "expectedQuantity",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2">
            <p className={`${row?.className} `}>
              {new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(row.expectedQuantity)}{" "}
              ₺
            </p>
          </div>
        );
      },
    },
    {
      key: "difference",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2">
            <p className={`${row?.className} `}>
              {new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(row.difference)}{" "}
              ₺
            </p>
          </div>
        );
      },
    },
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
    {
      type: InputTypes.NUMBER,
      formKey: "amount",
      label: t("Amount"),
      placeholder: t("Amount"),
      required: true,
    },
  ];
  const formKeys = [{ key: "amount", type: FormKeyTypeEnum.NUMBER }];

  const addButton = {
    name: t(`Add Checkout Control`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
          location: selectedLocationId === 1 ? "bahceli" : "neorama",
        }}
        formKeys={formKeys}
        submitItem={createCheckoutControl as any}
        topClassName="flex flex-col gap-2 "
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
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteCheckoutControl(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Checkout Control")}
          text={`${rowToAction.amount} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateCheckoutControl as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{
            id: rowToAction._id,
            updates: { ...rowToAction },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];

  useEffect(() => {
    const filteredRows = arrangedAllRows.filter((row) => {
      if (row?.location === ("" as any) || row?.user === ("" as any)) {
        return true;
      }
      return (
        passesFilter(filterPanelFormElements.location, row?.location) &&
        passesFilter(filterPanelFormElements.user, row?.user) &&
        passesFilter(filterPanelFormElements.date, row.date)
      );
    });
    filteredRows.push({
      _id: Infinity,
      date: t("Total"),
      formattedDate: t("Total"),
      usr: "",
      lctn: "",
      amount: filteredRows.reduce((acc, row) => acc + row.amount, 0),
      beginningQuantity: filteredRows.reduce(
        (acc, row) => acc + row.beginningQuantity,
        0
      ),
      incomeQuantity: filteredRows.reduce(
        (acc, row) => acc + row.incomeQuantity,
        0
      ),
      expenseQuantity: filteredRows.reduce(
        (acc, row) => acc + row.expenseQuantity,
        0
      ),
      cashout: filteredRows.reduce((acc, row) => acc + row.cashout, 0),
      expectedQuantity: filteredRows.reduce(
        (acc, row) => acc + row.expectedQuantity,
        0
      ),
      difference: filteredRows.reduce((acc, row) => acc + row.difference, 0),
      user: "" as any,
      location: "" as any,
      isSortable: false,
      className: "font-semibold",
    } as any);
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    checkoutControls,
    locations,
    filterPanelFormElements,
    invoices,
    fixtureInvoices,
    serviceInvoices,
    incomes,
    cashouts,
  ]);
  const filters = [
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
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={filters}
          filterPanel={filterPanel}
          rows={rows}
          title={t("Checkout Control")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default CheckoutControlPage;
