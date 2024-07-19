import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import {
  AccountPaymentMethod,
  CheckoutIncome,
  Location,
  OrderCollectionStatus,
  RoleEnum,
} from "../../types";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import {
  useCheckoutIncomeMutations,
  useGetCheckoutIncomes,
} from "../../utils/api/checkout/income";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
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
const Income = () => {
  const { t } = useTranslation();
  const incomes = useGetCheckoutIncomes();
  const { user } = useUserContext();
  const locations = useGetAccountStockLocations();
  const [tableKey, setTableKey] = useState(0);
  const users = useGetUsers();
  const { selectedLocationId } = useLocationContext();
  const collections = useGetAllOrderCollections();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generalTotal, setGeneralTotal] = useState(0);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<CheckoutIncome>();
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
  const getCollectionLocationIdAsString = (collection: number) => {
    switch (collection) {
      case 1:
        return "bahceli";
      case 2:
        return "neorama";
      default:
        return "bahceli";
    }
  };
  const { createCheckoutIncome, deleteCheckoutIncome, updateCheckoutIncome } =
    useCheckoutIncomeMutations();
  const allRows =
    incomes?.map((income) => ({
      ...income,
      usr: income?.user?.name,
      lctn: income?.location?.name,
      formattedDate: formatAsLocalDate(income?.date),
      collectionIncome: collections
        ?.filter(
          (collection) =>
            (collection.createdAt
              ? format(collection?.createdAt, "yyyy-MM-dd") === income?.date
              : false) &&
            (collection?.paymentMethod as AccountPaymentMethod)?._id ===
              "cash" &&
            collection.status === OrderCollectionStatus.PAID &&
            getCollectionLocationIdAsString(
              (collection.location as Location)._id
            ) === income.location._id
        )
        ?.map((collection) => collection.amount)
        ?.reduce((a, b) => a + b, 0),
    })) ?? [];
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Amount"), isSortable: true },
    { key: t("Collections Income"), isSortable: true },
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
        return row.formattedDate;
      },
    },
    {
      key: "usr",
      className: "min-w-32 pr-1",
    },
    { key: "lctn" },
    { key: "amount" },
    { key: "collectionIncome" },
  ];
  if (user && ![RoleEnum.MANAGER].includes(user?.role?._id)) {
    columns.splice(
      columns.findIndex((column) => column.key === "Collections Income"),
      1
    );
    rowKeys.splice(
      rowKeys.findIndex((rowKey) => rowKey.key === "collectionIncome"),
      1
    );
  }
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
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
  ];

  const addButton = {
    name: t(`Add Income`),
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
        submitItem={createCheckoutIncome as any}
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
            deleteCheckoutIncome(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Income")}
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
          submitItem={updateCheckoutIncome as any}
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
    const filteredRows = allRows.filter((row) => {
      return (
        passesFilter(filterPanelFormElements.location, row.location?._id) &&
        passesFilter(filterPanelFormElements.user, row.user?._id) &&
        passesFilter(filterPanelFormElements.date, row.date)
      );
    });
    setRows(filteredRows);
    const newGeneralTotal = filteredRows.reduce(
      (acc, invoice) => acc + invoice.amount,
      0
    );
    setGeneralTotal(newGeneralTotal);
    setTableKey((prev) => prev + 1);
  }, [incomes, locations, filterPanelFormElements, collections]);

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
            {new Intl.NumberFormat("en-US", {
              style: "decimal",
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            }).format(generalTotal)}{" "}
            ₺
          </p>
        </div>
      ),
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
          title={t("Incomes")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default Income;
