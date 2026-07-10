import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
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
  useAssignmentMutations,
  useGetAssignments,
} from "../../utils/api/assignment";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetGamesMinimal } from "../../utils/api/game";
import {
  useCompleteGameLearningTaskMutation,
  useGetUsers,
} from "../../utils/api/user";
import { formatAsLocalDate, formatDateInTurkey } from "../../utils/format";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import Loading from "../common/Loading";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type AssignmentRow = Assignment & {
  assignedByName?: string;
  assignedToName?: string;
  subjectEntityType?: string;
  subjectEntityId?: string;
  formattedDueDate?: string;
  formattedCreatedAt?: string;
  formattedCompletedDate?: string;
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
  assignedBy: [],
  assignedTo: [],
  subjectId: [],
  subjectEntityType: "",
  subjectEntityId: "",
  ...dateRanges.thisYear(),
};

const GameAssignments = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const users = useGetUsers();
  const games = useGetGamesMinimal();
  const { currentPage, rowsPerPage, setCurrentPage } = useGeneralContext();
  const { updateAssignment, isUpdatingAssignment, deleteAssignment } =
    useAssignmentMutations();
  const { completeGameLearningTask, isCompletingGameLearningTask } =
    useCompleteGameLearningTaskMutation();
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilters);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AssignmentRow>();
  const { searchQuery } = useGeneralContext();
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
      assignedTo: filterPanelFormElements.assignedTo,
      subjectId: filterPanelFormElements.subjectId,
      subjectEntityType: filterPanelFormElements.subjectEntityType,
      subjectEntityId: filterPanelFormElements.subjectEntityId,
      after: filterPanelFormElements.after,
      before: filterPanelFormElements.before,
    }),
    [filterPanelFormElements]
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
          const assignedToUser =
            typeof assignment.assignedTo === "object" && assignment.assignedTo
              ? assignment.assignedTo
              : users?.find(
                  (userItem) => userItem._id === assignment.assignedTo
                );

          return {
            ...assignment,
            assignedByName:
              typeof assignedByUser === "object"
                ? assignedByUser.name
                : String(assignment.assignedBy),
            assignedToName:
              typeof assignedToUser === "object"
                ? assignedToUser.name
                : String(assignment.assignedTo),
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
            formattedCompletedDate: assignment.completedAt
              ? formatAsLocalDate(
                  assignment.completedAt instanceof Date
                    ? assignment.completedAt.toISOString()
                    : String(assignment.completedAt)
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
      {
        key: t("Status"),
        isSortable: true,
        correspondingKey: "status",
      },
      {
        key: t("Priority"),
        isSortable: true,
        correspondingKey: "priority",
      },
      {
        key: t("Assigned By"),
        isSortable: true,
        correspondingKey: "assignedByName",
      },
      {
        key: t("Assigned To"),
        isSortable: true,
        correspondingKey: "assignedToName",
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
        key: t("Actions"),
        isSortable: false,
      },
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
      { key: "assignedToName", className: "min-w-32 pr-2" },
      { key: "formattedCreatedAt", className: "min-w-28 pr-2" },
      { key: "formattedDueDate", className: "min-w-28 pr-2" },
      { key: "formattedCompletedDate", className: "min-w-28 pr-2" },
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

  const editInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "assignedTo",
        label: t("Assigned To"),
        options: users
          ?.filter((currentUser) =>
            [RoleEnum.GAMEMASTER, RoleEnum.GAMEMANAGER].includes(
              currentUser.role._id as RoleEnum
            )
          )
          ?.map((currentUser) => ({
            value: currentUser._id,
            label: currentUser.name,
          })),
        placeholder: t("Assigned To"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "dueDate",
        label: t("Due Date"),
        placeholder: t("Due Date"),
        required: true,
        isDatePicker: true,
        isOnClearActive: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "priority",
        label: t("Priority"),
        options: [
          { value: AssignmentPriorityEnum.LOW, label: t("Low") },
          { value: AssignmentPriorityEnum.MEDIUM, label: t("Medium") },
          { value: AssignmentPriorityEnum.HIGH, label: t("High") },
        ],
        placeholder: t("Priority"),
        required: false,
      },
    ],
    [t, users]
  );

  const editFormKeys = useMemo(
    () => [
      { key: "assignedTo", type: FormKeyTypeEnum.STRING },
      { key: "dueDate", type: FormKeyTypeEnum.DATE },
      { key: "priority", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Completed"),
        node: (row: AssignmentRow) => (
          <ButtonTooltip content={t("Completed")}>
            <input
              type="checkbox"
              className="w-4 h-4 cursor-pointer"
              checked={row.status === AssignmentStatusEnum.COMPLETED}
              onChange={(event) => {
                if (event.target.checked) {
                  completeGameLearningTask({ assignmentId: row._id });
                } else {
                  updateAssignment({
                    id: row._id,
                    updates: {
                      status: AssignmentStatusEnum.ASSIGNED,
                    },
                  });
                }
              }}
            />
          </ButtonTooltip>
        ),
      },
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        isPath: false,
        setRow: setRowToAction,
        setIsModal: setIsEditModalOpen,
        isModalOpen: isEditModalOpen,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={editInputs}
            formKeys={editFormKeys}
            submitItem={updateAssignment as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2"
            itemToEdit={{
              id: rowToAction._id,
              updates: {
                assignedTo:
                  typeof rowToAction.assignedTo === "object" &&
                  rowToAction.assignedTo
                    ? (rowToAction.assignedTo as unknown as { _id: string })
                        ._id
                    : rowToAction.assignedTo,
                dueDate: rowToAction.dueDate
                  ? formatDateInTurkey(new Date(rowToAction.dueDate))
                  : "",
                priority: rowToAction.priority,
              },
            }}
          />
        ) : null,
      },
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        className: "text-red-500 cursor-pointer text-xl",
        isModal: true,
        isPath: false,
        setRow: setRowToAction,
        setIsModal: setIsDeleteModalOpen,
        isModalOpen: isDeleteModalOpen,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isDeleteModalOpen}
            close={() => setIsDeleteModalOpen(false)}
            confirm={() => {
              deleteAssignment(rowToAction._id);
              setIsDeleteModalOpen(false);
            }}
            title={t("Delete Assignment")}
            text={t("AssignmentDeleteMessage", {
              userName: rowToAction.assignedToName,
              title: rowToAction.title,
            })}
          />
        ) : null,
      },
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      editInputs,
      editFormKeys,
      updateAssignment,
      completeGameLearningTask,
      isDeleteModalOpen,
      deleteAssignment,
    ]
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
        formKey: "assignedTo",
        label: t("Assigned To"),
        options: users
          ?.filter((user) =>
            [RoleEnum.GAMEMASTER, RoleEnum.GAMEMANAGER].includes(
              user.role._id as RoleEnum
            )
          )
          ?.map((currentUser) => ({
            value: currentUser._id,
            label: currentUser.name,
          })),
        placeholder: t("Assigned To"),
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
        type: InputTypes.TEXT,
        formKey: "subjectEntityType",
        label: t("Subject Type"),
        placeholder: t("Subject Type"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "subjectEntityId",
        label: t("Subject ID"),
        placeholder: t("Subject ID"),
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
    [t, users, games, filterPanelFormElements, setFilterPanelFormElements]
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

  if (!user) return <></>;

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={t("Game Assignments")}
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
      {(isUpdatingAssignment || isCompletingGameLearningTask) && <Loading />}
    </div>
  );
};

export default GameAssignments;
