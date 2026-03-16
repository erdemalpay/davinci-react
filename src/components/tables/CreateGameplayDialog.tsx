import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import useIsSmallScreen from "../../hooks/useIsSmallScreen";
import { Gameplay, RoleEnum, Table, User, Visit } from "../../types";
import { MinimalGame } from "../../utils/api/game";
import {
  useCreateGameplayMutation,
  useGetPopularGamesLast30Days,
} from "../../utils/api/gameplay";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  GenericInputType,
  InputTypes,
} from "../panelComponents/shared/types";

type CreateGameplayDto = Gameplay & {
  isAutoEntry?: boolean;
};

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
  const isSmallScreen = useIsSmallScreen();
  const [data, setData] = useState<Partial<CreateGameplayDto>>({
    ...gameplay,
    isGameplayTime: true,
    isAutoEntry: true,
  });
  const { users } = useDataContext();
  const popularGames = useGetPopularGamesLast30Days();
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
        type: InputTypes.NUMBER,
        formKey: "playerCount",
        label: t("Player Count"),
        placeholder: t("Player Count"),
        required: true,
        minNumber: 0,
        isNumberButtonsActive: true,
        isTopFlexRow: true,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "isAutoEntry",
        label: t("Is Auto Entry"),
        placeholder: t("Is Auto Entry"),
        required: data?.playerCount && table.playerCount < data?.playerCount,
        isDisabled: !(
          data?.playerCount && table.playerCount < data?.playerCount
        ),
      },
      {
        type: InputTypes.QUICKSELECT,
        formKey: "mentor",
        isTopFlexRow: true,
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
        allOptions: users
          ?.map((user) => {
            return {
              value: user._id,
              label: `${user.name}`,
            };
          })
          .filter(Boolean),
        required: true,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "isGameplayTime",
        label: t("Is Gameplay Time"),
        placeholder: t("Is Gameplay Time"),
        required: false,
        isDisabled: !doesMentorHaveActiveVisit,
      },
      {
        type: InputTypes.QUICKSELECT,
        formKey: "game",
        placeholder: t("Game"),
        quickOptions: popularGames,
        allOptions: games.map((game) => ({
          value: game._id,
          label: game.name,
        })),
        isSelectAbove: true,
        required: true,
        isSelectAlwaysVisible: true,
        gridRow: isSmallScreen ? 5 : 3,
        gridCol: isSmallScreen ? 3 : 5,
      },
    ],
    [
      mentors,
      games,
      t,
      users,
      doesMentorHaveActiveVisit,
      data,
      popularGames,
      isSmallScreen,
    ]
  );

  const gameplayFormKeys = [
    { key: "playerCount", type: FormKeyTypeEnum.NUMBER },
    { key: "isAutoEntry", type: FormKeyTypeEnum.BOOLEAN },
    { key: "mentor", type: FormKeyTypeEnum.STRING },
    { key: "isGameplayTime", type: FormKeyTypeEnum.BOOLEAN },
    { key: "game", type: FormKeyTypeEnum.NUMBER },
    { key: "startHour", type: FormKeyTypeEnum.STRING },
  ];

  if (!isOpen) return null;

  return (
    <GenericAddEditPanel
      header={t("Table") + `: ${table.name} `}
      isOpen={isOpen}
      close={close}
      inputs={gameplayInputs as GenericInputType[]}
      formKeys={gameplayFormKeys}
      setForm={setData}
      constantValues={{
        date: gameplay.date || table.date,
        location: gameplay.location || table.location,
        playerCount: table.playerCount,
        isGameplayTime: true,
        isAutoEntry: true,
        startHour: format(new Date(), "HH:mm"),
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
      topClassName="flex flex-col gap-0 "
      cancelButtonLabel="Cancel"
      generalClassName=" overflow-visible "
      stickyFooterButtons={true}
    />
  );
}
