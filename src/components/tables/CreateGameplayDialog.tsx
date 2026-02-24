import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import { Gameplay, RoleEnum, Table, User, Visit } from "../../types";
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
  visits = [],
}: {
  isOpen: boolean;
  close: () => void;
  gameplay: Partial<Gameplay>;
  table: Table;
  mentors: User[];
  games: MinimalGame[];
  visits?: Visit[];
}) {
  const { t } = useTranslation();
  const [data, setData] = useState<Partial<Gameplay>>(gameplay);
  const { users } = useDataContext();
  const { mutate: createGameplay } = useCreateGameplayMutation();
  const gameRelatedRoles = [
    RoleEnum.GAMEMANAGER,
    RoleEnum.GAMEMASTER,
    RoleEnum.MANAGER,
  ];
  // Helper function to check if a specific mentor has an active visit
  const checkMentorHasActiveVisit = (mentorId: string | undefined) => {
    if (!mentorId || !visits || visits.length === 0) return false;
    return visits.some((visit) => visit.user === mentorId && !visit.finishHour);
  };

  // Check if selected mentor has an active visit
  const doesMentorHaveActiveVisit = useMemo(() => {
    if (!data.mentor) return false;
    const mentorId =
      typeof data.mentor === "object" ? data.mentor._id : data.mentor;
    return checkMentorHasActiveVisit(mentorId);
  }, [data.mentor, visits]);

  function handleCreate() {
    // Mentor ve game kontrolü
    if (!data.mentor || !data.game) {
      toast.error(t("Please select mentor and game"));
      return;
    }

    // Get mentor ID
    const mentorId =
      typeof data.mentor === "object" ? data.mentor._id : data.mentor;

    // If mentor has active visit, default isGameplayTime to true
    // If mentor doesn't have active visit, force isGameplayTime to false
    const finalPayload = {
      ...data,
      isGameplayTime: checkMentorHasActiveVisit(mentorId)
        ? data.isGameplayTime ?? true // Default to true if checkbox is visible
        : false,
    } as Gameplay;

    createGameplay(
      { table: table._id as number, payload: finalPayload },
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
        type: InputTypes.QUICKSELECT,
        formKey: "mentor",
        label: t("Mentor"),
        placeholder: t("All"),
        quickOptions: mentors
          .map((mentor) => {
            const foundUser = users?.find(
              (user) =>
                user._id === mentor._id &&
                gameRelatedRoles.includes(user.role._id)
            );
            if (foundUser) {
              return {
                value: foundUser._id,
                label: `${foundUser.name}`,
              };
            }
            return null;
          })
          .filter(Boolean),
        allOptions: mentors
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
      // Only show "Is Gameplay Time" checkbox if selected mentor has an active visit
      ...(doesMentorHaveActiveVisit
        ? [
            {
              type: InputTypes.CHECKBOX,
              formKey: "isGameplayTime",
              label: t("Is Gameplay Time"),
              placeholder: t("Is Gameplay Time"),
              required: false,
            },
          ]
        : []),
    ],
    [mentors, games, t, users, doesMentorHaveActiveVisit]
  );

  const gameplayFormKeys = [
    { key: "tableName", type: FormKeyTypeEnum.STRING },
    { key: "playerCount", type: FormKeyTypeEnum.NUMBER },
    { key: "mentor", type: FormKeyTypeEnum.STRING },
    { key: "game", type: FormKeyTypeEnum.NUMBER },
    { key: "startHour", type: FormKeyTypeEnum.STRING },
    { key: "finishHour", type: FormKeyTypeEnum.STRING },
    { key: "isGameplayTime", type: FormKeyTypeEnum.BOOLEAN },
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
          startHour: format(new Date(), "HH:mm"),
          mentor:
            typeof gameplay.mentor === "object"
              ? gameplay.mentor?._id
              : gameplay.mentor,
          game:
            typeof gameplay.game === "object"
              ? gameplay.game?._id
              : gameplay.game,
          isGameplayTime: gameplay.isGameplayTime ?? true,
        }}
        submitItem={handleCreate}
        submitFunction={handleCreate}
        buttonName={t("Create")}
        cancelButtonLabel="Cancel"
        topClassName="flex flex-col gap-2 [&>div]:grid [&>div]:grid-cols-1 sm:[&>div]:grid-cols-2 [&>div]:gap-4 [&>div>div]:col-span-1 sm:[&>div>div:not(:nth-child(5)):not(:nth-child(6))]:col-span-2"
        generalClassName="shadow-none"
      />
    </div>
  );
}
