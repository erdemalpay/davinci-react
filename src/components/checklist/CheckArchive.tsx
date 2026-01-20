import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  CheckType,
  DisabledConditionEnum,
} from "../../types";
import {
  useCheckMutations,
  useGetQueryChecks,
} from "../../utils/api/checklist/check";
import { useGetChecklists } from "../../utils/api/checklist/checklist";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetUsersMinimal } from "../../utils/api/user";
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

const CheckArchive = () => {
  const { t } = useTranslation();
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      createdBy: "",
      checklist: "",
      location: "",
      after: "",
      before: "",
      sort: "",
      asc: 1,
      search: "",
    });
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const checksPayload = useGetQueryChecks(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const checks = checksPayload?.data || ([] as CheckType[]);
  const checklists = useGetChecklists();
  const users = useGetUsersMinimal();
  const { deleteCheck, updateCheck } = useCheckMutations();
  const [rowToAction, setRowToAction] = useState<Partial<CheckType>>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const locations = useGetStoreLocations();
  const { resetGeneralContext } = useGeneralContext();
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const checkArchivePageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.CHECKLISTS_CHECKARCHIVE,
      disabledConditions
    );
  }, [disabledConditions]);

  const canShowAll = useMemo(() => {
    const showAllAction = checkArchivePageDisabledCondition?.actions?.find(
      (ac) => ac.action === ActionEnum.SHOW_ALL
    );
    return (
      showAllAction &&
      user?.role?._id &&
      showAllAction.permissionsRoles?.includes(user.role._id)
    );
  }, [checkArchivePageDisabledCondition, user]);

  const rows = useMemo(() => {
    const allRows = checks
      .filter((check) => {
        if (canShowAll) {
          return true;
        }
        return check?.user === user?._id;
      })
      .map((check) => {
        if (!check?.createdAt) {
          return null;
        }
        const startDate = new Date(check?.createdAt);
        const endDate = new Date(check?.completedAt ?? 0);
        return {
          ...check,
          chcLst: getItem(check?.checklist, checklists)?.name,
          chcLstId: check?.checklist,
          lctn: getItem(check?.location, locations)?.name,
          lctnId: check?.location,
          usr: getItem(check?.user, users)?.name,
          usrId: check?.user,
          startDate: format(check?.createdAt, "yyyy-MM-dd"),
          formattedStartDate: formatAsLocalDate(
            format(check?.createdAt, "yyyy-MM-dd")
          ),
          startHour: `${pad(startDate.getHours())}:${pad(
            startDate.getMinutes()
          )}`,
          endDate: check?.completedAt
            ? format(check?.completedAt, "yyyy-MM-dd")
            : "",
          formattedEndDate: check?.completedAt
            ? formatAsLocalDate(format(check?.completedAt, "yyyy-MM-dd"))
            : "-",
          endHour: check?.completedAt
            ? `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`
            : "-",
        };
      })
      .filter((item) => item !== null);
    return allRows;
  }, [checks, user, canShowAll, checklists, locations, users, pad]);

  const columns = useMemo(() => {
    return [
      { key: t("Start Date"), isSortable: true, correspondingKey: "createdAt" },
      { key: t("Start Hour"), isSortable: true },
      { key: t("End Date"), isSortable: true, correspondingKey: "completedAt" },
      { key: t("End Hour"), isSortable: true },
      { key: t("NounCheck"), isSortable: true, correspondingKey: "checklist" },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      { key: t("User"), isSortable: true, correspondingKey: "user" },
      { key: t("Completed"), isSortable: true },
      { key: t("Status"), isSortable: false },
      { key: t("Actions"), isSortable: false },
    ];
  }, [t]);

  const rowKeys = useMemo(
    () => [
      {
        key: "startDate",
        node: (row: any) => (
          <p
            className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              if (row?.isCompleted) {
                resetGeneralContext();
                navigate(`/check-archive/${row?._id}`);
              } else {
                resetGeneralContext();
                navigate(`/check/${row?.location}/${row?.checklist}`);
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
        node: (row: any) => {
          return <p>{row?.formattedEndDate}</p>;
        },
      },
      {
        key: "endHour",
        className: "min-w-32 pr-1",
      },
      {
        key: "chcLst",
        className: "min-w-32 pr-1",
      },
      { key: "lctn" },
      { key: "usr" },
      {
        key: "completed",
        node: (row: any) => {
          const completedDutiesNumber =
            row?.duties?.filter((duty: any) => duty.isCompleted)?.length ?? 0;
          const dutiesLength = row?.duties?.length ?? 0;
          return (
            <p
              className={`px-2 ${
                completedDutiesNumber === dutiesLength
                  ? "text-green-500"
                  : "text-red-500 font-bold"
              }`}
            >{`${completedDutiesNumber} / ${dutiesLength}`}</p>
          );
        },
      },
      {
        key: "isCompleted",
        node: (row: any) => {
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
        options: users.map((user) => ({
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
        formKey: "checklist",
        label: t("NounCheck"),
        options: checklists?.map((checklist) => ({
          value: checklist._id,
          label: checklist.name,
        })),
        placeholder: t("NounCheck"),
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
    [t, users, locations, checklists]
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
              deleteCheck(rowToAction?._id as any);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Check")}
            text={`Check ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl  ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: checkArchivePageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Toggle Active"),
        isDisabled: checkArchivePageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.TOGGLE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: any) => (
          <div className="mt-2">
            <CheckSwitch
              checked={row.isCompleted}
              onChange={() => {
                updateCheck({
                  id: row._id,
                  updates: {
                    isCompleted: !row.isCompleted,
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
      deleteCheck,
      checkArchivePageDisabledCondition,
      user,
      updateCheck,
    ]
  );

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements, setFilterPanelFormElements]);

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );
  const pagination = useMemo(() => {
    return checksPayload
      ? {
          totalPages: checksPayload.totalPages,
          totalRows: checksPayload.totalNumber,
        }
      : null;
  }, [checksPayload]);

  // Effect to reset current page when filters change
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
          title={t("Check Archive")}
          filterPanel={filterPanel}
          outsideSearchProps={outsideSearchProps}
          isSearch={false}
          filters={filters}
          actions={actions}
          isActionsActive={true}
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
          isAllRowPerPageOption={false}
        />
      </div>
    </>
  );
};

export default CheckArchive;
