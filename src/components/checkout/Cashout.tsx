import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useFilterContext } from "../../context/Filter.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, CheckoutCashout, DisabledConditionEnum } from "../../types";
import {
  useCheckoutCashoutMutations,
  useGetCheckoutCashouts,
} from "../../utils/api/checkout/cashout";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetUsersMinimal } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { StockLocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Cashout = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const cashouts = useGetCheckoutCashouts();
  const locations = useGetStockLocations();
  const { selectedLocationId } = useLocationContext();
  const users = useGetUsersMinimal();
  const disabledConditions = useGetDisabledConditions();

  const cashoutPageDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.CHECKOUT_CASHOUT, disabledConditions);
  }, [disabledConditions]);
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<CheckoutCashout>();
  const [generalTotal, setGeneralTotal] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const {
    filterCheckoutPanelFormElements,
    setFilterCheckoutPanelFormElements,
  } = useFilterContext();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createCheckoutCashout,
    deleteCheckoutCashout,
    updateCheckoutCashout,
  } = useCheckoutCashoutMutations();
  const allRows =
    cashouts?.map((cashout) => {
      const cashoutUser = getItem(cashout?.user, users);
      const cashoutLocation = getItem(cashout?.location, locations);
      return {
        ...cashout,
        usr: cashoutUser?.name,
        lctn: cashoutLocation?.name,
        formattedDate: formatAsLocalDate(cashout?.date),
      };
    }) ?? [];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "user",
      label: t("User"),
      options: users
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
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      required: true,
      isDatePicker: true,
    },
  ];
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Amount"), isSortable: true },
    { key: t("Description"), isSortable: true },
    { key: t("Is After Count"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row?.formattedDate;
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
        return parseFloat(row.amount).toFixed(2).replace(/\.?0*$/, "");
      },
    },
    { key: "description" },
    {
      key: "isAfterCount",
      node: (row: any) => {
        return row?.isAfterCount ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
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
    {
      type: InputTypes.TEXTAREA,
      formKey: "description",
      label: t("Description"),
      placeholder: t("Description"),
      required: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isAfterCount",
      label: t("Is After Count"),
      placeholder: t("Is After Count"),
      required: true,
      isTopFlexRow: true,
    },
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
    { key: "description", type: FormKeyTypeEnum.STRING },
    { key: "isAfterCount", type: FormKeyTypeEnum.BOOLEAN },
  ];

  const addButton = {
    name: t(`Add Cashout`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        constantValues={{
          date: format(new Date(), "yyyy-MM-dd"),
          location: selectedLocationId,
          isAfterCount: true,
        }}
        formKeys={formKeys}
        submitItem={createCheckoutCashout as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isDisabled: cashoutPageDisabledCondition?.actions?.some(
      (ac) =>
        ac.action === ActionEnum.ADD &&
        user?.role?._id &&
        !ac?.permissionsRoles?.includes(user?.role?._id)
    ),
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
            deleteCheckoutCashout(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Cashout")}
          text={`${rowToAction.amount} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: cashoutPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.DELETE &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
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
          submitItem={updateCheckoutCashout as any}
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
      isDisabled: cashoutPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.UPDATE &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    },
  ];

  useEffect(() => {
    const filteredRows = allRows.filter((row) => {
      return (
        passesFilter(filterCheckoutPanelFormElements.location, row?.location) &&
        passesFilter(filterCheckoutPanelFormElements.user, row?.user) &&
        passesFilter(filterCheckoutPanelFormElements.date, row?.date)
      );
    });
    setRows(filteredRows);
    const newGeneralTotal = filteredRows.reduce(
      (acc, invoice) => acc + invoice.amount,
      0
    );
    setGeneralTotal(newGeneralTotal);
    setTableKey((prev) => prev + 1);
  }, [cashouts, locations, filterCheckoutPanelFormElements]);
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
    {
      label: t("Total") + " :",
      isUpperSide: false,
      node: (
        <div className="flex flex-row gap-2">
          <p>
            {generalTotal.toFixed(2).replace(/\.?0*$/, "")}{" "}
            ₺
          </p>
        </div>
      ),
      isDisabled: cashoutPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.SHOWTOTAL &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterCheckoutPanelFormElements,
    setFormElements: setFilterCheckoutPanelFormElements,
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
          title={t("Cashouts")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Cashout;
