import { PlusIcon } from "@heroicons/react/24/solid";
import { useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import { RoleEnum } from "../../types";
import {
  AssignmentPriorityEnum,
  useAssignmentMutations,
} from "../../utils/api/assignment";
import {
  GameWithGameplayCount,
  useGetGamesSortedByGameplayCount,
} from "../../utils/api/game";
import { useGetUsers } from "../../utils/api/user";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

const AssignGame = () => {
  const { t } = useTranslation();
  const games = useGetGamesSortedByGameplayCount() || [];
  const { user } = useUserContext();
  const { createGameAssignments } = useAssignmentMutations();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<GameWithGameplayCount>();
  const formDataRef = useRef<{
    dueDate?: string;
    assignUsers?: string[];
    priority?: AssignmentPriorityEnum;
  }>({
    dueDate: "",
    assignUsers: [],
    priority: AssignmentPriorityEnum.MEDIUM,
  });

  const users = useGetUsers();
  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true },
      { key: t("Gameplay Count"), isSortable: true },
      { key: t("Known User Count"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );
  const inputs = useMemo(
    () => [
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
        formKey: "assignUsers",
        label: t("Assign Users"),
        options: users
          ?.filter((user) =>
            [RoleEnum.GAMEMASTER, RoleEnum.GAMEMANAGER].includes(
              user.role._id as RoleEnum
            )
          )
          ?.filter(
            (user) =>
              user.userGames &&
              !user.userGames.find(
                (userGameObject) => userGameObject.game === rowToAction?._id
              )
          )
          .map((user) => ({
            value: user._id,
            label: user.name,
          })),
        placeholder: t("Assign Users"),
        isMultiple: true,
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "priority",
        label: t("Priority"),
        options: [
          {
            value: AssignmentPriorityEnum.LOW,
            label: t("Low"),
          },
          {
            value: AssignmentPriorityEnum.MEDIUM,
            label: t("Medium"),
          },
          {
            value: AssignmentPriorityEnum.HIGH,
            label: t("High"),
          },
        ],
        placeholder: t("Priority"),
        required: false,
      },
    ],
    [t, users, rowToAction]
  );

  const formKeys = useMemo(
    () => [
      { key: "dueDate", type: FormKeyTypeEnum.DATE },
      { key: "assignUsers", type: FormKeyTypeEnum.ARRAY },
      { key: "priority", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const rowKeys = useMemo(
    () => [
      { key: "name", className: "min-w-32 pr-1" },
      { key: "gameplayCount", className: "min-w-24 pr-1" },
      { key: "knownUserCount", className: "min-w-24 pr-1" },
    ],
    []
  );

  const actions = useMemo(
    () => [
      {
        name: t("Assign"),
        icon: <PlusIcon className="w-5 h-5" />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        isPath: false,
        setRow: setRowToAction,
        setIsModal: setIsAssignModalOpen,
        isModalOpen: isAssignModalOpen,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isAssignModalOpen}
            close={() => setIsAssignModalOpen(false)}
            inputs={inputs}
            formKeys={formKeys}
            submitItem={() => undefined}
            buttonName={t("Assign")}
            submitFunction={() => {
              if (!user?._id || !rowToAction?._id) return;
              createGameAssignments({
                gameId: rowToAction._id,
                assignedBy: user._id,
                assignUsers: (Array.isArray(formDataRef.current.assignUsers)
                  ? formDataRef.current.assignUsers
                  : []) as string[],
                dueDate: formDataRef.current.dueDate,
                priority:
                  (formDataRef.current.priority as AssignmentPriorityEnum) ||
                  AssignmentPriorityEnum.MEDIUM,
                title: rowToAction.name,
              });
            }}
            setForm={(item) => {
              formDataRef.current = item as {
                dueDate?: string;
                assignUsers?: string[];
                priority?: AssignmentPriorityEnum;
              };
            }}
            constantValues={{
              priority: AssignmentPriorityEnum.MEDIUM,
            }}
            generalClassName="overflow-scroll min-w-[90%] sm:min-w-[60%]"
            anotherPanelTopClassName=""
            topClassName="flex flex-col gap-2"
          />
        ) : null,
      },
    ],
    [
      t,
      rowToAction,
      isAssignModalOpen,
      inputs,
      formKeys,
      formDataRef,
      user?._id,
      createGameAssignments,
    ]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={t("AssignGame")}
        rows={games}
        columns={columns}
        rowKeys={rowKeys}
        actions={actions}
        isActionsActive={true}
        isSearch={false}
        isColumnFilter={false}
        isPagination={false}
        isRowsPerPage={false}
      />
    </div>
  );
};

export default AssignGame;
