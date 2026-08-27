import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import { Game, RowPerPageEnum, UserGameUpdateType } from "../../types";
import {
  Assignment,
  AssignmentStatusEnum,
  AssignmentTypeEnum,
  useGetAssignments,
} from "../../utils/api/assignment";
import { useGetGamesMinimal } from "../../utils/api/game";

import {
  updateUserGamesMutation,
  useGetUserWithId,
} from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  userId: string;
};

const GamesIKnow = ({ userId }: Props) => {
  const { t } = useTranslation();
  const { user: panelUser } = useUserContext();
  if (!panelUser) return <></>;
  const [learnDateModal, setLearnDateModal] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<Game>();
  const { updateUserGame } = updateUserGamesMutation();
  const user = useGetUserWithId(userId);
  const games = useGetGamesMinimal();
  const isOwnProfile = user?._id === panelUser?._id;

  const assignmentFilters = useMemo(
    () => ({
      assignmentType: AssignmentTypeEnum.GAME_LEARNING,
      assignedTo: userId,
    }),
    [userId]
  );

  const assignmentsPayload = useGetAssignments(
    1,
    RowPerPageEnum.ALL,
    assignmentFilters,
    { enabled: isOwnProfile && isEnableEdit }
  );

  const assignmentStatusByGameId = useMemo(() => {
    const latestByGameId = new Map<number, Assignment>();
    (assignmentsPayload?.data ?? []).forEach((assignment) => {
      const gameId = Number(assignment.subject?.entityId);
      if (Number.isNaN(gameId)) return;
      if (assignment.status === AssignmentStatusEnum.CANCELLED) return;
      const latestAssignment = latestByGameId.get(gameId);
      if (
        !latestAssignment ||
        new Date(assignment.createdAt ?? 0).getTime() >
          new Date(latestAssignment.createdAt ?? 0).getTime()
      ) {
        latestByGameId.set(gameId, assignment);
      }
    });

    const statusMap = new Map<number, AssignmentStatusEnum>();
    latestByGameId.forEach((assignment, gameId) => {
      statusMap.set(gameId, assignment.status);
    });
    return statusMap;
  }, [assignmentsPayload]);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.DATE,
        formKey: "learnDate",
        label: t("Learn Date"),
        placeholder: t("Learn Date"),
        required: true,
      },
    ],
    [t]
  );

  const formKeys = useMemo(
    () => [{ key: "learnDate", type: FormKeyTypeEnum.STRING }],
    []
  );

  const columns = useMemo(() => {
    return user?._id === panelUser?._id && isEnableEdit
      ? [
          { key: t("Game"), isSortable: true },
          { key: t("Learn Date"), isSortable: true },
          { key: t("Active"), isSortable: false },
        ]
      : [
          { key: t("Game"), isSortable: true },
          { key: t("Learn Date"), isSortable: true },
        ];
  }, [t, user, panelUser, isEnableEdit]);

  const userGamesGameArray = useMemo(() => {
    return user?.userGames.map((item) => item.game);
  }, [user]);

  const rows = useMemo(() => {
    return user?._id === panelUser?._id
      ? games.map((game) =>
          userGamesGameArray?.includes(game._id)
            ? {
                ...game,
                learnDate: user?.userGames.find(
                  (userGame) => userGame.game === game._id
                )?.learnDate,
              }
            : game
        )
      : games
          .filter((game) => userGamesGameArray?.includes(game._id))
          .map((game) => {
            const userGame = user?.userGames.find(
              (userGame) => userGame.game === game._id
            );
            return { ...game, learnDate: userGame?.learnDate };
          });
  }, [user, panelUser, games, userGamesGameArray]);

  const rowKeys = useMemo(
    () => [
      {
        key: "name",
      },
      {
        key: "learnDate",
        className: `min-w-32  `,
        node: (row: Game) => {
          const userGame = user?.userGames.find(
            (userGame) => userGame.game === row._id
          );

          if (
            !userGame &&
            assignmentStatusByGameId.get(row._id) ===
              AssignmentStatusEnum.IN_PROGRESS
          ) {
            return <p className="text-blue-600">{t("in_progress")}</p>;
          }

          return (
            <p>
              {userGame?.learnDate
                ? formatAsLocalDate(userGame.learnDate)
                : "-"}
            </p>
          );
        },
      },
    ],
    [user, t, assignmentStatusByGameId]
  );

  function handleUpdateUserGame({
    gameId,
    updateType,
    learnDate,
  }: {
    gameId: number;
    updateType: UserGameUpdateType;
    learnDate: string;
  }) {
    updateUserGame({ gameId, updateType, learnDate: learnDate });
  }

  const filters = useMemo(
    () => [
      {
        label: t("Enable Edit"),
        isUpperSide: false,
        node: (
          <>
            <CheckSwitch
              checked={isEnableEdit}
              onChange={() => setIsEnableEdit((value) => !value)}
              checkedBg="bg-green-500"
            ></CheckSwitch>
          </>
        ),
      },
    ],
    [t, isEnableEdit]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Toggle Active"),
        isModal: false,
        isPath: false,
        icon: null,
        isDisabled: user?._id !== panelUser?._id || !isEnableEdit,
        node: (row: Game) => {
          const assignmentStatus = assignmentStatusByGameId.get(row._id);
          const isKnown = userGamesGameArray?.includes(row._id) ?? false;
          const isPendingVerification =
            assignmentStatus === AssignmentStatusEnum.IN_PROGRESS;
          const isVerified =
            assignmentStatus === AssignmentStatusEnum.COMPLETED;

          return (
            <CheckSwitch
              checked={isKnown || isPendingVerification}
              disabled={isVerified}
              onChange={() => {
                if (isVerified) return;
                if (isKnown || isPendingVerification) {
                  setRowToAction(row);
                  setIsCloseAllConfirmationDialogOpen(true);
                } else {
                  setLearnDateModal(true);
                  setRowToAction(row);
                }
              }}
            ></CheckSwitch>
          );
        },
      },
    ],
    [
      t,
      user,
      panelUser,
      isEnableEdit,
      userGamesGameArray,
      assignmentStatusByGameId,
    ]
  );

  const filteredRows = useMemo(() => {
    if (isEnableEdit) {
      return rows;
    }
    return rows.filter((row) => userGamesGameArray?.includes(row._id));
  }, [isEnableEdit, rows, userGamesGameArray]);

  return (
    <div className="w-full  h-fit">
      <GenericTable
        columns={columns}
        rows={filteredRows}
        rowKeys={rowKeys}
        actions={isEnableEdit ? actions : []}
        filters={user?._id === panelUser?._id ? filters : []}
        title={t("Known Games")}
        isRowsPerPage={isEnableEdit ? false : true}
        isActionsActive={isEnableEdit}
      />
      {learnDateModal && rowToAction && (
        <GenericAddEditPanel
          isOpen={learnDateModal}
          close={() => setLearnDateModal(false)}
          inputs={inputs}
          formKeys={formKeys}
          constantValues={{ learnDate: format(new Date(), "yyyy-MM-dd") }}
          folderName="user"
          topClassName="flex flex-col gap-2 "
          submitItem={(formElements: any) => {
            handleUpdateUserGame({
              gameId: rowToAction._id,
              updateType: UserGameUpdateType.ADD,
              learnDate: formElements.learnDate,
            });
          }}
        />
      )}
      {isCloseAllConfirmationDialogOpen && rowToAction && (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            handleUpdateUserGame({
              gameId: rowToAction._id,
              updateType: UserGameUpdateType.REMOVE,
              learnDate: "",
            });
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Remove Game")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      )}
    </div>
  );
};

export default GamesIKnow;
