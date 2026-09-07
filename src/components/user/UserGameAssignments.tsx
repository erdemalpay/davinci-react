import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  DateRangeKey,
  FormElementsState,
  RoleEnum,
  commonDateOptions,
} from "../../types";
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
import {
  useCompleteGameLearningTaskMutation,
  useGetUsers,
  useVerifyGameLearningTaskMutation,
} from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import Loading from "../common/Loading";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

type Props = {
  userId?: string;
};

type AssignmentRow = Assignment & {
  assignedByName?: string;
  subjectEntityType?: string;
  subjectEntityId?: string;
  formattedDueDate?: string;
  formattedCreatedAt?: string;
  formattedCompletedDate?: string;
  verifiedByName?: string;
  formattedLearnedAt?: string;
};

function getAssignmentStatusSortPriority(status: AssignmentStatusEnum) {
  if (status === AssignmentStatusEnum.COMPLETED) return 2;
  if (status === AssignmentStatusEnum.IN_PROGRESS) return 1;
  return 0;
}

function getAssignedToId(row: AssignmentRow) {
  return typeof row.assignedTo === "object" && row.assignedTo
    ? (row.assignedTo as unknown as { _id: string })._id
    : row.assignedTo;
}

function buildInitialFilters(userId: string): FormElementsState {
  return {
    assignmentType: [AssignmentTypeEnum.GAME_LEARNING],
    status: [],
    priority: [],
    assignedBy: [],
    assignedTo: [userId],
    subjectId: [],
    ...dateRanges.thisYear(),
  };
}

const UserGameAssignments = ({ userId }: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const users = useGetUsers();
  const games = useGetGamesMinimal();
  const { currentPage, rowsPerPage, setCurrentPage, searchQuery } =
    useGeneralContext();
  const { completeGameLearningTask, isCompletingGameLearningTask } =
    useCompleteGameLearningTaskMutation();
  const { verifyGameLearningTask, isVerifyingGameLearningTask } =
    useVerifyGameLearningTaskMutation();

  const canVerify = [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(
    user?.role?._id as RoleEnum
  );

  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(() => buildInitialFilters(userId ?? ""));

  const resolvedUserId = userId ?? user?._id;

  useEffect(() => {
    if (!resolvedUserId) return;

    setFilterPanelFormElements(buildInitialFilters(resolvedUserId));
    setCurrentPage(1);
  }, [resolvedUserId, setCurrentPage]);

  const queryFilters = useMemo<AssignmentQueryDto>(
    () => ({
      search: searchQuery,
      assignmentType: filterPanelFormElements.assignmentType as
        | AssignmentTypeEnum
        | AssignmentTypeEnum[],
      status: filterPanelFormElements.status as
        | AssignmentStatusEnum
        | AssignmentStatusEnum[],
      priority: filterPanelFormElements.priority as
        | AssignmentPriorityEnum
        | AssignmentPriorityEnum[],
      assignedBy: filterPanelFormElements.assignedBy,
      assignedTo: resolvedUserId,
      subjectId: filterPanelFormElements.subjectId,
      subjectEntityType: filterPanelFormElements.subjectEntityType,
      subjectEntityId: filterPanelFormElements.subjectEntityId,
      after: filterPanelFormElements.after,
      before: filterPanelFormElements.before,
    }),
    [filterPanelFormElements, resolvedUserId, searchQuery]
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
            subjectEntityType: assignment.subject?.entityType ?? "",
            subjectEntityId:
              typeof assignment.subject?.entityId === "string"
                ? assignment.subject.entityId
                : String(assignment.subject?.entityId ?? ""),
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
            formattedCompletedDate:
              assignment.status === AssignmentStatusEnum.COMPLETED &&
              assignment.completedAt
                ? formatAsLocalDate(
                    assignment.completedAt instanceof Date
                      ? assignment.completedAt.toISOString()
                      : String(assignment.completedAt)
                  )
                : "",
            verifiedByName: assignment.verifiedBy
              ? users?.find(
                  (userItem) => userItem._id === assignment.verifiedBy
                )?.name ?? String(assignment.verifiedBy)
              : "",
            formattedLearnedAt: assignment.learnedAt
              ? formatAsLocalDate(
                  assignment.learnedAt instanceof Date
                    ? assignment.learnedAt.toISOString()
                    : String(assignment.learnedAt)
                )
              : assignment.status === AssignmentStatusEnum.COMPLETED &&
                assignment.completedAt
              ? formatAsLocalDate(
                  assignment.completedAt instanceof Date
                    ? assignment.completedAt.toISOString()
                    : String(assignment.completedAt)
                )
              : "",
          };
        })
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
        key: t("Game"),
        isSortable: true,
        correspondingKey: "subjectEntityId",
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
      {
        key: t("Completed Date"),
        isSortable: true,
        correspondingKey: "formattedCompletedDate",
      },
      {
        key: t("Learned Date"),
        isSortable: true,
        correspondingKey: "formattedLearnedAt",
      },
      {
        key: t("Verified By"),
        isSortable: true,
        correspondingKey: "verifiedByName",
      },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "title", className: "min-w-40 pr-2" },
      {
        key: "status",
        className: "min-w-28 pr-2",
        node: (row: AssignmentRow) => t(row.status),
      },
      {
        key: "priority",
        className: "min-w-24 pr-2",
        node: (row: AssignmentRow) => t(row.priority),
      },
      { key: "assignedByName", className: "min-w-32 pr-2" },
      {
        key: "subjectEntityId",
        className: "min-w-32 pr-2",
        node: (row: AssignmentRow) => {
          const game = games?.find(
            (game) =>
              row.subjectEntityId && game._id === Number(row.subjectEntityId)
          );
          return <p>{game ? game.name : row.subjectEntityId}</p>;
        },
      },
      { key: "formattedCreatedAt", className: "min-w-28 pr-2" },
      { key: "formattedDueDate", className: "min-w-28 pr-2" },
      { key: "formattedCompletedDate", className: "min-w-28 pr-2" },
      { key: "formattedLearnedAt", className: "min-w-28 pr-2" },
      { key: "verifiedByName", className: "min-w-32 pr-2" },
    ],
    [games, t]
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

  const actions = useMemo(
    () => [
      {
        name: t("Learned"),
        node: (row: AssignmentRow) => (
          <ButtonTooltip content={t("Learned")}>
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              checked={!!row.learnedAt}
              disabled={getAssignedToId(row) !== user?._id || !!row.verifiedAt}
              onChange={(event) => {
                completeGameLearningTask({
                  assignmentId: row._id,
                  isLearned: event.target.checked,
                });
              }}
            />
          </ButtonTooltip>
        ),
      },
      {
        name: t("Verified"),
        node: (row: AssignmentRow) => (
          <ButtonTooltip content={t("Verified")}>
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
              checked={!!row.verifiedAt}
              disabled={!canVerify || !row.learnedAt}
              onChange={(event) => {
                verifyGameLearningTask({
                  assignmentId: row._id,
                  isVerified: event.target.checked,
                });
              }}
            />
          </ButtonTooltip>
        ),
      },
    ],
    [t, user?._id, canVerify, completeGameLearningTask, verifyGameLearningTask]
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
        formKey: "assignedBy",
        label: t("Assigned By"),
        options: users.map((currentUser) => ({
          value: currentUser._id,
          label: currentUser.name,
        })),
        placeholder: t("Assigned By"),
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
    [filterPanelFormElements, games, setFilterPanelFormElements, t, users]
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
    [showFilters, t]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(buildInitialFilters(resolvedUserId ?? ""));
      },
    }),
    [filterPanelInputs, filterPanelFormElements, resolvedUserId, showFilters]
  );

  const getRowBgColor = (row: AssignmentRow) => {
    if (row.status === AssignmentStatusEnum.COMPLETED) {
      return "bg-green-100";
    }

    if (row.status === AssignmentStatusEnum.IN_PROGRESS) {
      return "bg-blue-50";
    }

    if (row.status === AssignmentStatusEnum.ASSIGNED) {
      return "bg-red-100";
    }

    return "";
  };

  if (!resolvedUserId) return <></>;

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={t("User Game Assignments")}
        rows={rows}
        columns={columns}
        rowKeys={rowKeys}
        actions={actions}
        isActionsActive={true}
        isSearch={true}
        isColumnFilter={false}
        isPagination={true}
        isRowsPerPage={true}
        rowClassNameFunction={getRowBgColor}
        pagination={pagination ?? undefined}
        filterPanel={filterPanel}
        filters={filters}
      />
      {(isCompletingGameLearningTask || isVerifyingGameLearningTask) && (
        <Loading />
      )}
    </div>
  );
};

export default UserGameAssignments;
