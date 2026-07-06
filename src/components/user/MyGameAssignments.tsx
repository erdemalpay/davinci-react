import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { DateRangeKey, FormElementsState, commonDateOptions } from "../../types";
import {
  Assignment,
  AssignmentPriorityEnum,
  AssignmentQueryDto,
  AssignmentStatusEnum,
  AssignmentTypeEnum,
  useGetAssignments,
} from "../../utils/api/assignment";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetGamesMinimal } from "../../utils/api/game";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type Props = {
  userId: string;
};

type AssignmentRow = Assignment & {
  assignedByName?: string;
  formattedDueDate?: string;
  formattedCreatedAt?: string;
};

function getAssignmentStatusSortPriority(status: AssignmentStatusEnum) {
  switch (status) {
    case AssignmentStatusEnum.OVERDUE:
      return 0;
    case AssignmentStatusEnum.ASSIGNED:
      return 1;
    case AssignmentStatusEnum.COMPLETED:
      return 2;
    default:
      return 3;
  }
}

const initialFilters: FormElementsState = {
  assignmentType: [AssignmentTypeEnum.GAME_LEARNING],
  status: [],
  priority: [],
  subjectId: [],
  ...dateRanges.thisYear(),
};

const MyGameAssignments = ({ userId }: Props) => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const games = useGetGamesMinimal();
  const { currentPage, rowsPerPage, setCurrentPage } = useGeneralContext();
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilters);

  const queryFilters = useMemo<AssignmentQueryDto>(
    () => ({
      assignmentType: filterPanelFormElements.assignmentType as
        | AssignmentTypeEnum
        | AssignmentTypeEnum[],
      status: filterPanelFormElements.status as
        | AssignmentStatusEnum
        | AssignmentStatusEnum[],
      priority: filterPanelFormElements.priority as
        | AssignmentPriorityEnum
        | AssignmentPriorityEnum[],
      assignedTo: userId,
      subjectId: filterPanelFormElements.subjectId,
      after: filterPanelFormElements.after,
      before: filterPanelFormElements.before,
    }),
    [filterPanelFormElements, userId]
  );

  const assignmentsPayload = useGetAssignments(
    currentPage,
    rowsPerPage,
    queryFilters
  );

  const rows = useMemo<AssignmentRow[]>(() => {
    return (
      assignmentsPayload?.data
        ?.map((assignment) => {
          const assignedByUser =
            typeof assignment.assignedBy === "object" && assignment.assignedBy
              ? assignment.assignedBy
              : users?.find(
                  (userItem) => userItem._id === assignment.assignedBy
                );

          return {
            ...assignment,
            assignedByName:
              typeof assignedByUser === "object"
                ? assignedByUser.name
                : String(assignment.assignedBy),
            formattedDueDate: assignment.dueDate
              ? formatAsLocalDate(
                  assignment.dueDate instanceof Date
                    ? assignment.dueDate.toISOString()
                    : String(assignment.dueDate)
                )
              : "",
            formattedCreatedAt: assignment.createdAt
              ? formatAsLocalDate(
                  assignment.createdAt instanceof Date
                    ? assignment.createdAt.toISOString()
                    : String(assignment.createdAt)
                )
              : "",
          };
        })
        ?.filter(
          (assignment) => assignment.status !== AssignmentStatusEnum.CANCELLED
        )
        ?.sort(
          (firstAssignment, secondAssignment) =>
            getAssignmentStatusSortPriority(firstAssignment.status) -
            getAssignmentStatusSortPriority(secondAssignment.status)
        ) ?? []
    );
  }, [assignmentsPayload, users]);

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true, correspondingKey: "title" },
      { key: t("Status"), isSortable: true, correspondingKey: "status" },
      { key: t("Priority"), isSortable: true, correspondingKey: "priority" },
      {
        key: t("Assigned By"),
        isSortable: true,
        correspondingKey: "assignedByName",
      },
      {
        key: t("Assigned Date"),
        isSortable: true,
        correspondingKey: "formattedCreatedAt",
      },
      {
        key: t("Due Date"),
        isSortable: true,
        correspondingKey: "formattedDueDate",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "title", className: "min-w-40 pr-2" },
      { key: "status", className: "min-w-28 pr-2" },
      { key: "priority", className: "min-w-24 pr-2" },
      { key: "assignedByName", className: "min-w-32 pr-2" },
      { key: "formattedCreatedAt", className: "min-w-28 pr-2" },
      { key: "formattedDueDate", className: "min-w-28 pr-2" },
    ],
    []
  );

  const pagination = useMemo(
    () =>
      assignmentsPayload
        ? {
            totalRows: assignmentsPayload.totalNumber,
            totalPages: assignmentsPayload.totalPages,
          }
        : null,
    [assignmentsPayload]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
        placeholder: t("Date"),
        required: false,
        additionalOnChange: ({ value }: { value: string }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setFilterPanelFormElements({
              ...filterPanelFormElements,
              ...dateRange(),
            });
          }
        },
      },
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: Object.values(AssignmentStatusEnum).map((value) => ({
          value,
          label: t(value),
        })),
        placeholder: t("Status"),
        isMultiple: true,
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "priority",
        label: t("Priority"),
        options: Object.values(AssignmentPriorityEnum).map((value) => ({
          value,
          label: t(value),
        })),
        placeholder: t("Priority"),
        isMultiple: true,
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "subjectId",
        label: t("Game"),
        options: games.map((game) => ({
          value: game._id,
          label: game.name,
        })),
        placeholder: t("Game"),
        isMultiple: true,
        required: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("After"),
        placeholder: t("After"),
        required: false,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("Before"),
        placeholder: t("Before"),
        required: false,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
    ],
    [t, games, filterPanelFormElements, setFilterPanelFormElements]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: false,
        node: (
          <SwitchButton
            checked={showFilters}
            onChange={() => setShowFilters(!showFilters)}
          />
        ),
      },
    ],
    [t, showFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilters);
      },
    }),
    [showFilters, filterPanelInputs, filterPanelFormElements]
  );

  const getRowBgColor = (row: AssignmentRow) => {
    if (row.status === AssignmentStatusEnum.OVERDUE) {
      return "bg-red-100";
    }

    if (row.status === AssignmentStatusEnum.ASSIGNED) {
      return "bg-yellow-50";
    }

    if (row.status === AssignmentStatusEnum.COMPLETED) {
      return "bg-green-100";
    }

    return "";
  };

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={t("My Game Assignments")}
        rows={rows}
        columns={columns}
        rowKeys={rowKeys}
        isActionsActive={false}
        isSearch={false}
        isColumnFilter={false}
        isPagination={true}
        isRowsPerPage={false}
        rowClassNameFunction={getRowBgColor}
        pagination={pagination ?? undefined}
        filterPanel={filterPanel}
        filters={filters}
      />
    </div>
  );
};

export default MyGameAssignments;
