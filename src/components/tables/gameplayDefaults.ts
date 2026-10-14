import { ButtonCall, ButtonCallTypeEnum } from "../../types";

// A new gameplay at a table with an open game master call: whoever the call
// is assigned to explains, and the game it asks for is preselected.
export function getGameplayDefaultsFromCall(
  calls: ButtonCall[],
  tableName: string
): { mentor?: string; game?: number } {
  const openGmCall = calls.find(
    (call) =>
      call.tableName === tableName &&
      call.type === ButtonCallTypeEnum.GAMEMASTERCALL &&
      !call.finishHour
  );
  return {
    ...(openGmCall?.assignedTo && { mentor: openGmCall.assignedTo }),
    ...(openGmCall?.game && { game: openGmCall.game }),
  };
}

// An activity table gathers several tables and the calls come from those.
// When exactly one of them has an open game master call, the game is most
// likely for that table.
export function getActivityTableWithGmCall(
  calls: ButtonCall[],
  tableNames: string[]
): string | undefined {
  const withCall = tableNames.filter((tableName) =>
    calls.some(
      (call) =>
        call.tableName === tableName &&
        call.type === ButtonCallTypeEnum.GAMEMASTERCALL &&
        !call.finishHour
    )
  );
  return withCall.length === 1 ? withCall[0] : undefined;
}
