import { useTranslation } from "react-i18next";
import { TournamentParticipant } from "../../types/tournament";
import { groupCatanPlan } from "./catanPlan";

type PlannedParticipant = Pick<
  TournamentParticipant,
  "_id" | "name" | "isActive" | "drawNumber" | "schedule"
>;

interface Props {
  participants: PlannedParticipant[];
}

// Numaralar çekilince 3 turun tüm masaları ve kimin hangi sırada oturacağı baştan bellidir
const CatanPlanOverview = ({ participants }: Props) => {
  const { t } = useTranslation();
  const rounds = groupCatanPlan(participants);
  if (!rounds.length) return null;

  return (
    <details className="rounded-2xl border border-gray-200 bg-white p-4">
      <summary className="cursor-pointer font-semibold">
        {t("All Rounds")}
      </summary>
      <div className="mt-3 flex flex-col gap-4">
        {rounds.map((round) => (
          <div key={round.round}>
            <p className="mb-2 font-medium">
              {t("Round Short N", { round: round.round })}
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {round.tables.map((table) => (
                <div
                  key={table.tableNo}
                  className="rounded-md border p-2 text-sm"
                >
                  <p className="font-semibold">
                    {t("Table")} {table.tableNo}
                  </p>
                  {table.seats.map((seat) => (
                    <p
                      key={seat.participantId}
                      className={
                        seat.isActive ? "" : "text-gray-400 line-through"
                      }
                    >
                      <span className="text-gray-500">{seat.seat}.</span>{" "}
                      {seat.name}
                      {seat.drawNumber !== undefined && (
                        <span className="ml-1 text-[10px] text-gray-400">
                          #{seat.drawNumber}
                        </span>
                      )}
                    </p>
                  ))}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </details>
  );
};

export default CatanPlanOverview;

interface PlayerScheduleProps {
  participants: PlannedParticipant[];
}

// Oyuncunun takip sayfasında adını yazınca numarası ve 3 turluk programı
export const PlayerSchedule = ({ participants }: PlayerScheduleProps) => {
  const { t } = useTranslation();
  const planned = participants.filter((p) => p.schedule?.length);
  if (!planned.length || planned.length > 3) return null;

  return (
    <div className="mt-2 flex flex-col gap-2">
      {planned.map((p) => (
        <div
          key={p._id}
          className="rounded-lg border border-indigo-100 bg-indigo-50 p-3 text-sm"
        >
          <p className="font-semibold text-indigo-900">
            {p.name} · {t("Draw Number")} {p.drawNumber}
          </p>
          {p.schedule?.map((slot) => (
            <p key={slot.round} className="text-indigo-800">
              {t("Round Short N", { round: slot.round })}: {t("Table")}{" "}
              {slot.tableNo}, {t("Seat N", { seat: slot.seat })}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
};
