import { Visit } from "../types";

type VisitUser = {
  _id: string;
  isVisitDisabled?: boolean;
};

export function getActiveUserIds(
  visits: Visit[],
  users: VisitUser[],
  selectedLocationId?: number
) {
  const activeUserIds = new Set(
    visits
      .filter(
        (visit) => !visit.finishHour && visit.location === selectedLocationId
      )
      .map((visit) => visit.user)
  );

  users.forEach((user) => {
    if (user.isVisitDisabled) {
      activeUserIds.add(user._id);
    }
  });

  return Array.from(activeUserIds);
}
