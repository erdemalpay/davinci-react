import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import {
  DateRangeKey,
  FormElementsState,
  RoleEnum,
  TaskTrack,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import {
  useGetTaskTracks,
  useTaskTrackMutations,
} from "../../utils/api/panelControl/taskTrack";
import { useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

export interface TaskTrackRow extends TaskTrack {
  userNames: string;
  typeNames: string;
  formattedDate: string;
}
const TaskTrackPage = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const taskTracks = useGetTaskTracks();
  const users = useGetUsers();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAction, setRowToAction] = useState<TaskTrackRow>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createTaskTrack, deleteTaskTrack, updateTaskTrack } =
    useTaskTrackMutations();
  const initialFilterPanelFormElements = {
    date: "thisWeek",
    after: dateRanges.thisWeek().after,
    before: dateRanges.thisWeek().before,
    users: [],
    type: [],
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);

  const allRows = useMemo(() => {
    return taskTracks.map((track) => {
      const foundUserNames = track.users.map((userId) => {
        const foundUser = getItem(userId, users);
        return foundUser?.name || userId;
      });
      const zonedTime = toZonedTime(track.createdAt, "UTC");
      const trackDate = new Date(zonedTime);
      return {
        ...track,
        userNames: foundUserNames.join(", "),
        typeNames: track.type.join(", "),
        formattedDate: format(trackDate, "yyyy-MM-dd"),
      };
    });
  }, [taskTracks, users]);

  const rows = useMemo(() => {
    return allRows.filter((row) => {
      return (
        (filterPanelFormElements.before === "" ||
          row.formattedDate <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.formattedDate >= filterPanelFormElements.after) &&
        (filterPanelFormElements.users.length === 0 ||
          row.users.some((userId) =>
            filterPanelFormElements.users.includes(userId)
          )) &&
        (filterPanelFormElements.type.length === 0 ||
          row.type.some((typeItem) =>
            filterPanelFormElements.type.includes(typeItem)
          ))
      );
    });
  }, [allRows, filterPanelFormElements]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Users"), isSortable: true },
      { key: t("Task"), isSortable: true },
      { key: t("Type"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const typeNameOptions = useMemo(
    () => [
      { value: "Backend", label: "Backend", backgroundColor: "bg-red-500" },
      { value: "Frontend", label: "Frontend", backgroundColor: "bg-blue-500" },
    ],
    []
  );

  const rowKeys = useMemo(
    () => [
      { key: "createdAt", node: (row: TaskTrackRow) => row.formattedDate },
      { key: "userNames" },
      { key: "task" },
      {
        key: "typeNames",
        node: (row: TaskTrackRow) => (
          <div className="flex flex-wrap gap-1">
            {row.type.map((typeItem, index) => {
              const foundType = typeNameOptions.find(
                (type) => type.value === typeItem
              );

              return (
                <span
                  key={index}
                  className={`w-fit rounded-md text-sm  px-2 py-1 font-semibold  ${foundType?.backgroundColor} text-white`}
                >
                  {typeItem}
                </span>
              );
            })}
          </div>
        ),
      },
    ],
    [typeNameOptions]
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.DATE,
        formKey: "createdAt",
        label: t("Date"),
        placeholder: t("Date"),
        required: true,
        isDatePicker: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "users",
        label: t("Users"),
        options: users
          ?.filter((user) => user?.role?._id === RoleEnum.MANAGER)
          ?.map((user) => {
            return {
              value: user._id,
              label: user.name,
            };
          }),
        isMultiple: true,
        placeholder: t("Users"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "type",
        label: t("Type"),
        options: typeNameOptions,
        isMultiple: true,
        placeholder: t("Type"),
        required: true,
      },
      {
        type: InputTypes.TEXTAREA,
        formKey: "task",
        label: t("Task"),
        placeholder: t("Task"),
        required: true,
      },
    ],
    [t, users, typeNameOptions]
  );
  const filterPanelInputs = useMemo(
    () => [
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
            setFilterPanelFormElements({
              ...filterPanelFormElements,
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
      {
        type: InputTypes.SELECT,
        formKey: "users",
        label: t("Users"),
        options: users
          ?.filter((user) => user?.role?._id === RoleEnum.MANAGER)
          ?.map((user) => {
            return {
              value: user._id,
              label: user.name,
            };
          }),
        isMultiple: true,
        placeholder: t("Users"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "type",
        label: t("Type"),
        options: typeNameOptions,
        isMultiple: true,
        placeholder: t("Type"),
        required: true,
      },
    ],
    [
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
      users,
      typeNameOptions,
    ]
  );
  const formKeys = useMemo(
    () => [
      { key: "createdAt", type: FormKeyTypeEnum.DATE },
      { key: "users", type: FormKeyTypeEnum.STRING },
      { key: "type", type: FormKeyTypeEnum.STRING },
      { key: "task", type: FormKeyTypeEnum.STRING },
    ],
    []
  );
  const addButton = useMemo(
    () => ({
      name: t(`Add Task Track`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          constantValues={{
            createdAt: format(new Date(), "yyyy-MM-dd"),
          }}
          formKeys={formKeys}
          submitItem={createTaskTrack as any}
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    }),
    [t, isAddModalOpen, inputs, formKeys, createTaskTrack, user]
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
              deleteTaskTrack(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Action")}
            text={`${rowToAction.task} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl  ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      },
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl ",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={inputs}
            formKeys={formKeys}
            submitItem={updateTaskTrack as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{
              id: rowToAction._id,
              updates: {
                ...rowToAction,
                createdAt: rowToAction.formattedDate,
              },
            }}
          />
        ) : null,

        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteTaskTrack,
      isEditModalOpen,
      inputs,
      formKeys,
      updateTaskTrack,
      user,
    ]
  );
  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
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

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Task Tracks")}
          addButton={addButton}
          isActionsActive={true}
          filters={filters}
          filterPanel={filterPanel}
        />
      </div>
    </>
  );
};

export default TaskTrackPage;
