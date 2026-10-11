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
