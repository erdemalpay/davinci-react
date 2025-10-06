import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import {
  CheckoutIncome,
  DateRangeKey,
  OrderCollectionStatus,
  RoleEnum,
  commonDateOptions,
} from "../../types";
import {
  useCheckoutIncomeMutations,
  useGetPaginatedQueryIncomes,
} from "../../utils/api/checkout/income";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetAllOrderCollections } from "../../utils/api/order/orderCollection";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getDayName } from "../../utils/getDayName";
import { getItem } from "../../utils/getItem";
import { LocationInput, StockLocationInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

export type IncomeRow = CheckoutIncome & {
  usr?: string;
  lctn?: string;
  formattedDate?: string;
  collectionIncome?: number;
};
const Income = () => {
  const { t } = useTranslation();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const {
    initialFilterCheckoutPanelFormElements,
    filterCheckoutPanelFormElements,
    setFilterCheckoutPanelFormElements,
  } = useFilterContext();
  const incomesPayload = useGetPaginatedQueryIncomes(
    currentPage,
    rowsPerPage,
    filterCheckoutPanelFormElements
  );
  const { user } = useUserContext();
  const locations = useGetStoreLocations();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);
  const { selectedLocationId } = useLocationContext();
  const collections = useGetAllOrderCollections(); //TODO:this needs to be optimized
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generalTotal, setGeneralTotal] = useState(
    incomesPayload?.generalTotal ?? 0
  );
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<CheckoutIncome>();
  const [showFilters, setShowFilters] = useState(false);

  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [form, setForm] = useState({
    date: "",
    amount: 0,
  });

  const { createCheckoutIncome, deleteCheckoutIncome, updateCheckoutIncome } =
    useCheckoutIncomeMutations();
  const allRows =
    incomesPayload?.data?.map((income) => {
      const incomeUser = getItem(income?.user, users);
      const incomeLocation = getItem(income?.location, locations);
      return {
        ...income,
        usr: incomeUser?.name,
        lctn: incomeLocation?.name,
        formattedDate: formatAsLocalDate(income?.date),
        collectionIncome: collections
          ?.filter(
            (collection) =>
              (collection.createdAt
                ? format(collection?.createdAt, "yyyy-MM-dd") === income?.date
                : false) &&
              collection?.paymentMethod === "cash" &&
              collection.status === OrderCollectionStatus.PAID &&
              collection.location === income.location
          )
          ?.map((collection) => collection.amount)
          ?.reduce((a, b) => a + b, 0),
      };
    }) ?? [];
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Date"), isSortable: true, correspondingKey: "createdAt" },
    { key: t("User"), isSortable: true, correspondingKey: "user" },
    { key: t("Location"), isSortable: true, correspondingKey: "location" },
    { key: t("Amount"), isSortable: true, correspondingKey: "amount" },
    { key: t("Collections Income"), isSortable: false },
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
      additionalOnChange: ({
        value,
        label,
      }: {
        value: string;
        label: string;
      }) => {
        const dateRange = dateRanges[value as DateRangeKey];
        if (dateRange) {
          setFilterCheckoutPanelFormElements({
            ...filterCheckoutPanelFormElements,
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
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: IncomeRow) => {
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
      label: form?.date
        ? getDayName(form.date) + " " + t("dayIncome")
        : t("Date"),

      placeholder: t("Date"),
      required: true,
      isDateInitiallyOpen: true,
    },
    LocationInput({ locations: locations }),
    {
      type: InputTypes.NUMBER,
      formKey: "amount",
      label: t("Amount"),
      placeholder: t("Amount"),
      required: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isAfterCount",
      label: t("Is After Count"),
      placeholder: t("Is After Count"),
      required: false,
      isTopFlexRow: true,
      isDisabled: true,
    },
  ];
  const formKeys = [
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "location", type: FormKeyTypeEnum.NUMBER },
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
    { key: "isAfterCount", type: FormKeyTypeEnum.BOOLEAN },
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
          date: format(
            new Date(Date.now() - 24 * 60 * 60 * 1000),
            "yyyy-MM-dd"
          ),
          location: selectedLocationId,
          isAfterCount: true,
        }}
        setForm={setForm}
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
          setForm={setForm}
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
    formElements: filterCheckoutPanelFormElements,
    setFormElements: setFilterCheckoutPanelFormElements,
    closeFilters: () => setShowFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterCheckoutPanelFormElements(
        initialFilterCheckoutPanelFormElements
      );
    },
  };
  const outsideSort = {
    filterPanelFormElements: filterCheckoutPanelFormElements,
    setFilterPanelFormElements: setFilterCheckoutPanelFormElements,
  };
  const pagination = incomesPayload
    ? {
        totalPages: incomesPayload.totalPages,
        totalRows: incomesPayload.totalNumber,
      }
    : null;
  useEffect(() => {
    setCurrentPage(1);
  }, [filterCheckoutPanelFormElements]);

  useEffect(() => {
    setRows(allRows);
    setGeneralTotal(incomesPayload?.generalTotal ?? 0);
    setTableKey((prev) => prev + 1);
  }, [incomesPayload, locations, filterCheckoutPanelFormElements, collections]);

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
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default Income;
