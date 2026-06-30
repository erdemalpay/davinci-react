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

type Props = {
  userId: string;
};

const UserGameAssignments = ({ userId }: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const games = useGetGamesSortedByGameplayCount() || [];
  const users = useGetUsers() || [];
  const { createGameAssignments } = useAssignmentMutations();
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<GameWithGameplayCount>();
  const formDataRef = useRef<{
    dueDate?: string;
    priority?: AssignmentPriorityEnum;
  }>({
    dueDate: "",
    priority: AssignmentPriorityEnum.MEDIUM,
  });

  const selectedUser = useMemo(
    () => users.find((currentUser) => currentUser._id === userId),
    [users, userId]
  );

  const isAllowedRole = useMemo(
    () =>
      !!selectedUser &&
      [RoleEnum.GAMEMASTER, RoleEnum.GAMEMANAGER].includes(
        selectedUser.role._id as RoleEnum
      ),
    [selectedUser]
  );

  const visibleGames = useMemo(() => {
    if (!selectedUser) return [];

    return games.filter(
      (game) =>
        !selectedUser.userGames?.some(
          (userGameObject) => userGameObject.game === game._id
        )
    );
  }, [games, selectedUser]);

  const columns = useMemo(
    () => [
      { key: t("Game"), isSortable: true },
      { key: t("Gameplay Count"), isSortable: true },
      { key: t("Known User Count"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name", className: "min-w-32 pr-1" },
      { key: "gameplayCount", className: "min-w-24 pr-1" },
      { key: "knownUserCount", className: "min-w-24 pr-1" },
    ],
    []
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
    [t]
  );

  const formKeys = useMemo(
    () => [
      { key: "dueDate", type: FormKeyTypeEnum.DATE },
      { key: "priority", type: FormKeyTypeEnum.STRING },
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
        isDisabled: !selectedUser,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isAssignModalOpen}
            close={() => setIsAssignModalOpen(false)}
            inputs={inputs}
            formKeys={formKeys}
            submitItem={() => undefined}
            buttonName={t("Assign")}
            submitFunction={() => {
              if (!user?._id || !rowToAction?._id || !selectedUser?._id) return;

              createGameAssignments({
                gameId: rowToAction._id,
                assignedBy: user._id,
                assignUsers: [selectedUser._id],
                dueDate: formDataRef.current.dueDate,
                priority:
                  formDataRef.current.priority ?? AssignmentPriorityEnum.MEDIUM,
                title: rowToAction.name,
              });
            }}
            setForm={(item) => {
              formDataRef.current = item as {
                dueDate?: string;
                priority?: AssignmentPriorityEnum;
              };
            }}
            constantValues={{
              priority: AssignmentPriorityEnum.MEDIUM,
            }}
            topClassName="flex flex-col gap-2"
            generalClassName="overflow-visible"
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
      user?._id,
      createGameAssignments,
      selectedUser,
    ]
  );

  if (!isAllowedRole) return <></>;

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        title={t("Assign Game")}
        rows={visibleGames}
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

export default UserGameAssignments;
