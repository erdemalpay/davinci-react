import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useUserContext } from "../../context/User.context";
import { Game, UserGameUpdateType } from "../../types";
import { useGetGames } from "../../utils/api/game";
import {
  updateUserGamesMutation,
  useGetUserWithId,
} from "../../utils/api/user";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {
  userId: string;
};
const inputs = [
  {
    type: InputTypes.DATE,
    formKey: "learnDate",
    label: "Learn Date",
    placeholder: "Learn Date",
    required: true,
  },
];
const formKeys = [{ key: "learnDate", type: FormKeyTypeEnum.STRING }];
const GamesIKnow = ({ userId }: Props) => {
  const { user: panelUser } = useUserContext();
  if (!panelUser) return <></>;
  const [learnDateModal, setLearnDateModal] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<Game>();
  const { updateUserGame } = updateUserGamesMutation();
  const user = useGetUserWithId(userId);
  const games = useGetGames();

  const columns =
    user?._id === panelUser?._id && isEnableEdit
      ? [
          { key: "Game", isSortable: true },
          { key: "Learn Date", isSortable: true },
          { key: "Active", isSortable: false },
        ]
      : [
          { key: "Game", isSortable: true },
          { key: "Learn Date", isSortable: true },
        ];

  const userGamesGameArray = user?.userGames.map((item) => item.game);
  const rows =
    user?._id === panelUser?._id
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
  const rowKeys = [
    {
      key: "name",
    },
    {
      key: "learnDate",
      className: `min-w-32 ${!isEnableEdit && "flex justify-center"}  `,
      node: (row: Game) => {
        const userGame = user?.userGames.find(
          (userGame) => userGame.game === row._id
        );

        return (
          <p>
            {userGame?.learnDate
              ? format(new Date(userGame.learnDate), "dd-MM-yyyy")
              : "-"}
          </p>
        );
      },
    },
  ];

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
  const filters = [
    {
      label: "Enable Edit",
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
  ];
  const actions = [
    {
      name: "Toggle Active",
      isModal: false,
      isPath: false,
      icon: null,
      isDisabled: user?._id !== panelUser?._id || !isEnableEdit,
      node: (row: Game) => (
        <CheckSwitch
          checked={userGamesGameArray?.includes(row._id) ?? false}
          onChange={() => {
            if (userGamesGameArray?.includes(row._id)) {
              setRowToAction(row);
              setIsCloseAllConfirmationDialogOpen(true);
            } else {
              setLearnDateModal(true);
              setRowToAction(row);
            }
          }}
        ></CheckSwitch>
      ),
    },
  ];
  const filteredRows = () => {
    if (isEnableEdit) {
      return rows;
    }
    return rows.filter((row) => userGamesGameArray?.includes(row._id));
  };
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [user, isEnableEdit]);

  return (
    <div className="w-full  h-fit">
      <GenericTable
        key={tableKey}
        columns={columns}
        rows={filteredRows()}
        rowKeys={rowKeys}
        actions={isEnableEdit ? actions : []}
        filters={user?._id === panelUser?._id ? filters : []}
        title={`${
          user?._id === panelUser?._id
            ? "Known Games"
            : `Games ${user?.name} Knows`
        }`}
        isRowsPerPage={isEnableEdit ? false : true}
      />
      {learnDateModal && rowToAction && (
        <GenericAddEditPanel
          key={tableKey}
          isOpen={learnDateModal}
          close={() => setLearnDateModal(false)}
          inputs={inputs}
          formKeys={formKeys}
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
          title="Remove Game"
          text={`${rowToAction.name} will be removed. Are you sure you want to continue?`}
        />
      )}
    </div>
  );
};

export default GamesIKnow;
