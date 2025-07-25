import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useFilterContext } from "../../context/Filter.context";
import { useLocationContext } from "../../context/Location.context";
import { CheckoutControl, commonDateOptions } from "../../types";
import { useGetAccountExpensesWithoutPagination } from "../../utils/api/account/expense";
import { useGetQueryPayments } from "../../utils/api/account/payment";
import { useGetAccountPaymentMethods } from "../../utils/api/account/paymentMethod";
import { useGetQueryCashouts } from "../../utils/api/checkout/cashout";
import {
  useCheckoutControlMutations,
  useGetCheckoutControls,
} from "../../utils/api/checkout/checkoutControl";
import { useGetQueryIncomes } from "../../utils/api/checkout/income";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getDayName } from "../../utils/getDayName";
import { getItem } from "../../utils/getItem";
import { LocationInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const CheckoutControlPage = () => {
  const { t } = useTranslation();
  const paymentMethods = useGetAccountPaymentMethods();
  const { selectedLocationId } = useLocationContext();
  const {
    initialFilterCheckoutPanelFormElements,
    filterCheckoutPanelFormElements,
    setFilterCheckoutPanelFormElements,
  } = useFilterContext();

  const incomes = useGetQueryIncomes(filterCheckoutPanelFormElements);
  const checkoutControls = useGetCheckoutControls(
    filterCheckoutPanelFormElements
  );
  const expenses = useGetAccountExpensesWithoutPagination(
    filterCheckoutPanelFormElements
  );
  const vendorPayments = useGetQueryPayments(filterCheckoutPanelFormElements);
  const cashouts = useGetQueryCashouts(filterCheckoutPanelFormElements);
  const locations = useGetStoreLocations();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<CheckoutControl>();
  const [showFilters, setShowFilters] = useState(false);
  const [form, setForm] = useState({
    date: "",
    amount: 0,
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createCheckoutControl,
    deleteCheckoutControl,
    updateCheckoutControl,
  } = useCheckoutControlMutations();
  function parseLocalDate(dateString: string): Date {
    const [y, m, d] = dateString.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  function findPrevCheckout(
    current: CheckoutControl,
    allControls: CheckoutControl[]
  ): CheckoutControl | undefined {
    const currentDate = parseLocalDate(current.date);

    return allControls
      .filter(
        (c) =>
          c.location === current.location &&
          parseLocalDate(c.date) < currentDate
      )
      .sort(
        (a, b) =>
          parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime()
      )[0];
  }
  function sumRange<
    T extends {
      location: number;
      date: string;
      isAfterCount?: boolean;
      [key: string]: any;
    }
  >(
    items: T[] | undefined,
    fromDateStr: string,
    toDateStr: string,
    locationId: number,
    field: keyof T
  ): number {
    if (!items) return 0;
    return items
      .filter((x) => {
        if (x.location !== locationId) return false;
        const d = x.date;
        if (d > fromDateStr && d < toDateStr) {
          return true;
        }
        if (d === fromDateStr && x.isAfterCount && fromDateStr !== toDateStr) {
          return true;
        }
        if (d === toDateStr && !x?.isAfterCount) {
          return true;
        }
        return false;
      })
      .reduce((sum, x) => sum + Number(x[field] ?? 0), 0);
  }

  const allRows =
    checkoutControls?.map((checkoutControl, index) => {
      const usr = getItem(checkoutControl.user, users)?.name;
      const locObj = getItem(checkoutControl.location, locations);
      const lctn = locObj?.name;
      const formattedDate = formatAsLocalDate(checkoutControl.date);
      const prev = findPrevCheckout(checkoutControl, checkoutControls);
      const beginningQuantity = checkoutControl.baseQuantity
        ? checkoutControl.baseQuantity
        : prev?.amount ?? 0;
      let incomeQuantity = 0;
      let expenseQuantity = 0;
      let cashoutQuantity = 0;
      let vendorPaymentQuantity = 0;
      if (checkoutControl.date && !checkoutControl.baseQuantity) {
        incomeQuantity = sumRange(
          incomes,
          prev?.date ?? checkoutControl.date,
          checkoutControl.date,
          checkoutControl.location,
          "amount"
        );

        expenseQuantity = sumRange(
          expenses,
          prev?.date ?? checkoutControl.date,
          checkoutControl.date,
          checkoutControl.location,
          "totalExpense"
        );

        cashoutQuantity = sumRange(
          cashouts,
          prev?.date ?? checkoutControl.date,
          checkoutControl.date,
          checkoutControl.location,
          "amount"
        );
        vendorPaymentQuantity = sumRange(
          vendorPayments,
          prev?.date ?? checkoutControl.date,
          checkoutControl.date,
          checkoutControl.location,
          "amount"
        );
      }
      return {
        ...checkoutControl,
        usr,
        lctn,
        formattedDate,
        beginningQuantity,
        incomeQuantity,
        expenseQuantity,
        cashout: cashoutQuantity,
        vendorPaymentQuantity,
      };
    }) ?? [];
  const arrangedAllRows = allRows?.map((row) => {
    return {
      ...row,
      expectedQuantity:
        row.beginningQuantity +
        row.incomeQuantity -
        row.expenseQuantity -
        row.cashout -
        row.vendorPaymentQuantity,
      difference:
        row.amount -
        (row.beginningQuantity +
          row.incomeQuantity -
          row.expenseQuantity -
          row.cashout -
          row.vendorPaymentQuantity),
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
    { key: t("Vendor Payment Quantity"), isSortable: true },
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
    LocationInput({ locations: locations, required: true }),
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
      isOnClearActive: false,
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
      key: "vendorPaymentQuantity",
      node: (row: any) => {
        return (
          <div className="flex flex-row gap-2">
            <p className={`${row?.className} `}>
              {new Intl.NumberFormat("en-US", {
                style: "decimal",
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(row.vendorPaymentQuantity)}{" "}
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
      label: form?.date
        ? getDayName(form.date) + " " + t("checkout control")
        : t("Date"),

      placeholder: t("Date"),
      required: true,
      isDateInitiallyOpen: true,
    },
    LocationInput({ locations: locations, required: true }),
    {
      type: InputTypes.NUMBER,
      formKey: "amount",
      label: t("Amount"),
      placeholder: t("Amount"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "baseQuantity",
      label: t("Base Quantity"),
      placeholder: t("Base Quantity"),
      required: false,
    },
  ];
  const formKeys = [
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
    { key: "location", type: FormKeyTypeEnum.NUMBER },
    { key: "baseQuantity", type: FormKeyTypeEnum.NUMBER },
  ];
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
          location: selectedLocationId,
        }}
        setForm={setForm}
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
          setForm={setForm}
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
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const getBgColor = (row: CheckoutControl) => {
    if (row?.baseQuantity) {
      return "bg-green-100";
    }
    return "";
  };
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterCheckoutPanelFormElements,
    setFormElements: setFilterCheckoutPanelFormElements,
    closeFilters: () => setShowFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterCheckoutPanelFormElements(
        initialFilterCheckoutPanelFormElements
      );
    },
  };

  useEffect(() => {
    setRows(arrangedAllRows);
    setTableKey((prev) => prev + 1);
  }, [
    checkoutControls,
    locations,
    expenses,
    incomes,
    cashouts,
    paymentMethods,
    selectedLocationId,
    vendorPayments,
  ]);

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
          rowClassNameFunction={getBgColor}
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
