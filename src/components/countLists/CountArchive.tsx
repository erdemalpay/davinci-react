import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  AccountCount,
  AccountCountList,
  AccountCountProduct,
  ActionEnum,
  DisabledConditionEnum,
} from "../../types";
import {
  useAccountCountMutations,
  useGetQueryCounts,
} from "../../utils/api/account/count";
import { useGetAccountCountLists } from "../../utils/api/account/countList";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
type CountArchiveRow = AccountCountList &
  AccountCount & {
    cntLst: string;
    cntLstId: string;
    lctn: string;
    lctnId: string;
    usr: string;
    usrId: string;
    startDate: string;
    formattedStartDate: string;
    startHour: string;
    endDate: string;
    formattedEndDate: string;
    endHour: string;
  };
const CountArchive = () => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      createdBy: "",
      countList: "",
      location: "",
      after: "",
      before: "",
      sort: "",
      search: "",
      asc: 1,
    });
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const countsPayload = useGetQueryCounts(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const countLists = useGetAccountCountLists();
  const users = useGetUsers();
  const { deleteAccountCount, updateAccountCount } = useAccountCountMutations();
  const [rowToAction, setRowToAction] = useState<Partial<AccountCount>>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const locations = useGetStockLocations();
  const { resetGeneralContext } = useGeneralContext();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const countArchivePageDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.COUNTARCHIVE, disabledConditions);
  }, [disabledConditions]);

  const rows = useMemo(() => {
    const allRows =
      countsPayload?.data
        ?.map((count) => {
          if (!count?.createdAt) {
            return null;
          }
          const startDate = new Date(count?.createdAt);
          const endDate = new Date(count?.completedAt ?? 0);
          return {
            ...count,
            cntLst: getItem(count?.countList, countLists)?.name,
            cntLstId: count?.countList,
            lctn: getItem(count?.location, locations)?.name,
            lctnId: count?.location,
            usr: getItem(count?.user, users)?.name,
            usrId: count?.user,
            startDate: format(count?.createdAt, "yyyy-MM-dd"),
            formattedStartDate: formatAsLocalDate(
              format(count?.createdAt, "yyyy-MM-dd")
            ),
            startHour: `${pad(startDate.getHours())}:${pad(
              startDate.getMinutes()
            )}`,
            endDate: count?.completedAt
              ? format(count?.completedAt, "yyyy-MM-dd")
              : "",
            formattedEndDate: count?.completedAt
              ? formatAsLocalDate(format(count?.completedAt, "yyyy-MM-dd"))
              : "-",
            endHour: count?.completedAt
              ? `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
              : "-",
          };
        })
        ?.filter((item) => item !== null) ?? [];
    return allRows;
  }, [countsPayload, countLists, locations, users, pad]);

  const columns = useMemo(() => {
    return [
      { key: t("Start Date"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Start Hour"), isSortable: true },
      { key: t("End Date"), isSortable: true, correspondingKey: "completedAt" },
      { key: t("End Hour"), isSortable: true },
      { key: t("NounCount"), isSortable: true, correspondingKey: "countList" },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      { key: t("User"), isSortable: true, correspondingKey: "user" },
      { key: t("Status"), isSortable: false },
      { key: t("Actions"), isSortable: false },
    ];
  }, [t]);

  const rowKeys = useMemo(
    () => [
      {
        key: "startDate",
        node: (row: CountArchiveRow) => (
          <p
            className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              if (row?.isCompleted) {
                resetGeneralContext();
                navigate(`/archive/${row?._id}`);
              } else {
                resetGeneralContext();
                navigate(`/count/${row?.location}/${row?.countList}`);
              }
            }}
          >
            {row?.formattedStartDate}
          </p>
        ),
        className: "min-w-32",
      },
      {
        key: "startHour",
        className: "min-w-32 pr-1",
      },
      {
        key: "endDate",
        className: "min-w-32 pr-1",
        node: (row: CountArchiveRow) => {
          return <p>{row?.formattedEndDate}</p>;
        },
      },
      {
        key: "endHour",
        className: "min-w-32 pr-1",
      },
      {
        key: "cntLst",
        className: "min-w-32 pr-1",
      },
      { key: "lctn" },
      { key: "usr" },
      {
        key: "isCompleted",
        node: (row: CountArchiveRow) => {
          if (row?.isCompleted) {
            return (
              <span className="bg-green-500 w-fit px-2 py-1 rounded-md  text-white min-w-32">
                {t("Completed")}
              </span>
            );
          } else {
            return (
              <span className="bg-red-500 w-fit px-2 py-1 rounded-md text-white flex items-center">
                {t("Not Completed")}
              </span>
            );
          }
        },
      },
    ],
    [resetGeneralContext, navigate, t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "createdBy",
        label: t("Created By"),
        options: users
          .filter((user) => user.active)
          .map((user) => ({
            value: user._id,
            label: user.name,
          })),
        placeholder: t("Created By"),
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
        formKey: "countList",
        label: t("NounCount"),
        options: countLists?.map((countList) => ({
          value: countList._id,
          label: countList.name,
        })),
        placeholder: t("NounCount"),
        required: true,
      },
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
    ],
    [t, users, locations, countLists]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isCloseAllConfirmationDialogOpen}
            close={() => setIsCloseAllConfirmationDialogOpen(false)}
            confirm={() => {
              if (!rowToAction?._id) {
                return;
              }
              deleteAccountCount(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Count")}
            text={`Count ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl  ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: countArchivePageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Toggle Active"),
        isDisabled: countArchivePageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.TOGGLE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: CountArchiveRow) => (
          <div className="mt-2">
            <CheckSwitch
              checked={row.isCompleted}
              onChange={() => {
                const newCountProducts = row?.products?.map(
                  (product: AccountCountProduct) => {
                    return { ...product, isStockEqualized: false };
                  }
                );
                updateAccountCount({
                  id: row._id,
                  updates: {
                    isCompleted: !row.isCompleted,
                    products: newCountProducts,
                  },
                });
              }}
            ></CheckSwitch>
          </div>
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteAccountCount,
      countArchivePageDisabledCondition,
      user,
      updateAccountCount,
    ]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );

  const pagination = useMemo(() => {
    return countsPayload
      ? {
          totalPages: countsPayload.totalPages,
          totalRows: countsPayload.totalNumber,
        }
      : null;
  }, [countsPayload]);

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements, setFilterPanelFormElements]);
  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          outsideSearchProps={outsideSearchProps}
          isSearch={false}
          title={t("Count Archive")}
          filterPanel={filterPanel}
          filters={filters}
          actions={actions}
          isActionsActive={true}
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default CountArchive;
