import { useTranslation } from "react-i18next";
import { UserGameUpdateType } from "../../types";
import { updateUserGamesMutation } from "../../utils/api/user";
import { ConfirmationDialog } from "../common/ConfirmationDialog";

// Asks the person whether their "games I know" list should follow what they
// just did: explained a game that isn't on it (add), or declined a call
// saying they don't know a game that is on it (remove).
export type KnownGamePromptState = {
  type: UserGameUpdateType;
  gameId: number;
  gameName: string;
  // The cafe day the game was explained on, used as the learn date.
  learnDate: string;
};

export function knowsGame(
  user: { userGames?: { game: number }[] } | undefined,
  gameId: number
) {
  return (user?.userGames ?? []).some((ug) => Number(ug.game) === gameId);
}

export function KnownGamePrompt({
  prompt,
  close,
}: {
  prompt: KnownGamePromptState | null;
  close: () => void;
}) {
  if (!prompt) return null;
  return <KnownGamePromptDialog prompt={prompt} close={close} />;
}

function KnownGamePromptDialog({
  prompt,
  close,
}: {
  prompt: KnownGamePromptState;
  close: () => void;
}) {
  const { t } = useTranslation();
  const { updateUserGame } = updateUserGamesMutation();
  const isAdd = prompt.type === UserGameUpdateType.ADD;
  return (
    <ConfirmationDialog
      isOpen
      close={close}
      confirm={() => {
        updateUserGame({
          gameId: prompt.gameId,
          updateType: prompt.type,
          learnDate: prompt.learnDate,
        });
        close();
      }}
      title={t(isAdd ? "Add to games I know?" : "Remove from games I know?")}
      text={t(
        isAdd
          ? "{{game}} is not on your list of games you know. Shall we add it?"
          : "{{game}} is on your list of games you know. Shall we remove it?",
        { game: prompt.gameName }
      )}
      confirmLabel={t(isAdd ? "Add" : "Remove")}
      cancelLabel={t("No")}
    />
  );
}
