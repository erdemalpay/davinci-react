import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserContext } from "../../context/User.context";
import { Game, UserGameUpdateType } from "../../types";
import { useGetGames } from "../../utils/api/game";

import {
  updateUserGamesMutation,
  useGetUserWithId,
} from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {
  userId: string;
};

const GamesIKnow = ({ userId }: Props) => {
  const { t } = useTranslation();
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
  const inputs = [
    {
      type: InputTypes.DATE,
      formKey: "learnDate",
      label: t("Learn Date"),
      placeholder: t("Learn Date"),
      required: true,
    },
  ];
  const formKeys = [{ key: "learnDate", type: FormKeyTypeEnum.STRING }];
  const columns =
    user?._id === panelUser?._id && isEnableEdit
      ? [
          { key: t("Game"), isSortable: true },
          { key: t("Learn Date"), isSortable: true },
          { key: t("Active"), isSortable: false },
        ]
      : [
          { key: t("Game"), isSortable: true },
          { key: t("Learn Date"), isSortable: true },
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
            {userGame?.learnDate ? formatAsLocalDate(userGame.learnDate) : "-"}
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
  ];
  const actions = [
    {
      name: t("Toggle Active"),
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
        title={t("Known Games")}
        isRowsPerPage={isEnableEdit ? false : true}
        isActionsActive={isEnableEdit}
      />
      {learnDateModal && rowToAction && (
        <GenericAddEditPanel
          key={tableKey}
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
