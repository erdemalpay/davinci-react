import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import { Gameplay, Table, User } from "../../types";
import { MinimalGame } from "../../utils/api/game";
import { useCreateGameplayMutation } from "../../utils/api/gameplay";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

export function CreateGameplayDialog({
  isOpen,
  close,
  gameplay,
  table,
  mentors,
  games,
}: {
  isOpen: boolean;
  close: () => void;
  gameplay: Partial<Gameplay>;
  table: Table;
  mentors: User[];
  games: MinimalGame[];
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<Partial<Gameplay>>(gameplay);
  const { users } = useDataContext();
  const { mutate: createGameplay } = useCreateGameplayMutation();

  function handleCreate() {
    // Mentor ve game kontrolü
    if (!data.mentor || !data.game) {
      toast.error(t("Please select mentor and game"));
      return;
    }

    createGameplay(
      { table: table._id as number, payload: data as Gameplay },
      {
        onSuccess: () => {
          toast.success(
            t("New gameplay added to table {{tableName}}", {
              tableName: table.name,
            })
          );
          close();
        },
      }
    );
  }

  const gameplayInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "tableName",
        label: t("Table Name"),
        placeholder: t("Table Name"),
        required: false,
        isReadOnly: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "playerCount",
        label: t("Player Count"),
        placeholder: t("Player Count"),
        required: true,
        minNumber: 0,
        isNumberButtonsActive: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "mentor",
        label: t("Mentor"),
        placeholder: t("Mentor"),
        options: mentors
          .map((mentor) => {
            const foundUser = users?.find((user) => user._id === mentor._id);
            if (foundUser) {
              return {
                value: foundUser._id,
                label: `${foundUser.name}`,
              };
            }
            return null;
          })
          .filter(Boolean),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "game",
        label: t("Game"),
        placeholder: t("Game"),
        options: games.map((game) => ({
          value: game._id,
          label: game.name,
        })),
        required: true,
      },
      {
        type: InputTypes.HOUR,
        formKey: "startHour",
        label: t("Start Time"),
        placeholder: t("Start Time"),
        required: true,
      },
      {
        type: InputTypes.HOUR,
        formKey: "finishHour",
        label: t("End Time"),
        placeholder: t("End Time"),
        required: false,
      },
    ],
    [mentors, games, t, users]
  );

  const gameplayFormKeys = [
    { key: "tableName", type: FormKeyTypeEnum.STRING },
    { key: "playerCount", type: FormKeyTypeEnum.NUMBER },
    { key: "mentor", type: FormKeyTypeEnum.STRING },
    { key: "game", type: FormKeyTypeEnum.NUMBER },
    { key: "startHour", type: FormKeyTypeEnum.STRING },
    { key: "finishHour", type: FormKeyTypeEnum.STRING },
  ];

  if (!isOpen) return null;

  return (
    <div
      className="z-20 fixed w-full flex justify-center inset-0 items-center"
      onClick={close}
    >
      <div className="w-full h-full bg-gray-500 bg-opacity-50 z-0 absolute inset-0" />
      <GenericAddEditPanel
        isOpen={isOpen}
        close={close}
        inputs={gameplayInputs}
        formKeys={gameplayFormKeys}
        setForm={setData}
        constantValues={{
          tableName: table.name,
          date: gameplay.date || table.date,
          location: gameplay.location || table.location,
          playerCount: gameplay.playerCount,
          startHour: gameplay.startHour,
          finishHour: gameplay.finishHour || "",
          mentor:
            typeof gameplay.mentor === "object"
              ? gameplay.mentor?._id
              : gameplay.mentor,
          game:
            typeof gameplay.game === "object"
              ? gameplay.game?._id
              : gameplay.game,
        }}
        submitItem={handleCreate}
        submitFunction={handleCreate}
        buttonName={t("Create")}
        cancelButtonLabel={t("Cancel")}
        topClassName="flex flex-col gap-2 [&>div]:grid [&>div]:grid-cols-1 sm:[&>div]:grid-cols-2 [&>div]:gap-4 [&>div>div]:col-span-1 sm:[&>div>div:not(:nth-child(5)):not(:nth-child(6))]:col-span-2"
        generalClassName="shadow-none"
      />
    </div>
  );
}
