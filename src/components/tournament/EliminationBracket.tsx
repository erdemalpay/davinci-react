import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCrown, FaMedal } from "react-icons/fa";
import {
  MatchStage,
  Tournament,
  TournamentMatch,
  TournamentStatus,
} from "../../types/tournament";
import {
  autoRules,
  eliminationSize,
  eliminationRound,
  eliminationTables,
  useEliminationRoundName,
} from "./useTournamentForm";
import { TieBreakPicker, useScoreEntry } from "./useScoreEntry";
import { GenericButton } from "../common/GenericButton";

interface Props {
  tournament: Tournament;
  matches: TournamentMatch[];
  names: Map<number, string>;
  editableRound?: number; // skoru girilebilen (son) eleme turu
}

type BracketTable = {
  key: string;
  tableNo: number;
  isThirdPlace?: boolean;
  isBye?: boolean;
  match?: TournamentMatch; // henüz oynanmayan turlarda boş kutu
  seats?: (number | undefined)[]; // kurulmamış masaya skoru girilen masalardan gelenler
  sources?: string[]; // kurulmamış masaya oyuncu gönderen masalar
};

type Column = { round: number; tables: BracketTable[] };

// Oynanan eleme turlarına, henüz kurulmamış turları boş kutu olarak ekler (Challonge gibi)
export const buildColumns = (
  tournament: Tournament,
  elimination: TournamentMatch[]
): Column[] => {
  const byRound = new Map<number, TournamentMatch[]>();
  elimination.forEach((match) =>
    byRound.set(match.round, [...(byRound.get(match.round) ?? []), match])
  );
  const columns: Column[] = Array.from(byRound.entries())
    .sort(([a], [b]) => a - b)
    .map(([round, roundMatches]) => ({
      round,
      tables: roundMatches
        .sort((a, b) => a.tableNo - b.tableNo)
        .map((match) => ({
          key: match.isBye
            ? `${round}-bye-${match.players[0]?.participantId}`
            : `${round}-${match.tableNo}`,
          tableNo: match.tableNo,
          isThirdPlace: match.isThirdPlace,
          match,
        })),
    }));

  const last = columns[columns.length - 1];
  if (!last || last.tables.filter((t) => !t.isThirdPlace).length === 1)
    return columns;
  const tableSize = eliminationSize(tournament);
  const perTable =
    tournament.advancePerTable ?? autoRules(tableSize).advancePerTable;
  // Backend'deki nextEliminationRound'un aynısı: bay geçen doğrudan çıkar, masadan ilk
  // `perTable` kişi çıkar (en az biri elenir); sıra önce tüm birinciler, sonra ikinciler.
  // Skoru girilen (beraberlik kararı beklemeyen) masada kimin çıktığı bellidir.
  const results = last.tables.map((table) => {
    const players = table.match?.players ?? [];
    const count =
      players.length === 1 ? 1 : Math.min(perTable, players.length - 1);
    const ids = [...players]
      .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
      .map((p) =>
        table.match?.isCompleted && !table.match.pendingTie
          ? p.participantId
          : undefined
      );
    return {
      key: table.key,
      players: players.map((p) => p.participantId),
      advancers: ids.slice(0, count),
      rest: ids.slice(count),
    };
  });
  const slots = Array.from({ length: perTable }, (_, place) =>
    results.flatMap(({ key, players, advancers }) =>
      place < advancers.length
        ? [{ key, players, participantId: advancers[place] }]
        : []
    )
  ).flat();
  type Slot = (typeof slots)[number];
  const seat = (group: Slot[]) => ({
    seats: group.map((slot) => slot.participantId),
    sources: Array.from(new Set(group.map((slot) => slot.key))),
  });

  // Artanlar bay geçer: önce daha önce bay geçmemiş olanlar, üst sıradan başlayarak.
  // Masası oynanmamış biri bu seçimi değiştirebiliyorsa yerleşim henüz belli değildir.
  const { sizes, byes: byeCount } = eliminationRound(
    slots.length,
    tableSize,
    perTable
  );
  const byeIds = new Set(
    elimination
      .filter((m) => m.isBye)
      .flatMap((m) => m.players.map((p) => p.participantId))
  );
  const hadBye = ({ participantId, players }: Slot) =>
    participantId !== undefined
      ? byeIds.has(participantId)
      : players.every((id) => byeIds.has(id))
      ? true
      : players.some((id) => byeIds.has(id))
      ? undefined
      : false;
  const isKnown =
    !byeCount || slots.every((slot) => hadBye(slot) !== undefined);
  const byeSlots = [
    ...slots.filter((slot) => !hadBye(slot)),
    ...slots.filter((slot) => hadBye(slot)),
  ].slice(0, byeCount);
  const seated = slots.filter((slot) => !byeSlots.includes(slot));

  // Kalanlar masalara yılan sırasıyla dağılır (1-4 / 2-3)
  const groups: Slot[][] = sizes.map(() => []);
  const snake: number[] = [];
  while (snake.length < seated.length * 2) {
    sizes.forEach((_, i) => snake.push(i));
    sizes.forEach((_, i) => snake.push(sizes.length - 1 - i));
  }
  let cursor = 0;
  seated.forEach((slot) => {
    while (groups[snake[cursor]].length >= sizes[snake[cursor]]) cursor++;
    groups[snake[cursor++]].push(slot);
  });
  const nextRound = last.round + 1;
  const nextTables: BracketTable[] = [
    ...byeSlots.map((slot, n) => ({
      key: `${nextRound}-bye-${n}`,
      tableNo: 0,
      isBye: true,
      ...(isKnown && seat([slot])),
    })),
    ...groups.map((group, n) => ({
      key: `${nextRound}-${n + 1}`,
      tableNo: n + 1,
      ...(isKnown && seat(group)),
    })),
  ];

  const upcoming = eliminationTables(slots.length, tableSize, perTable);
  const eliminatedNow = results.flatMap(({ rest }) => rest);
  let players = slots.length;
  let eliminated = eliminatedNow.length;
  upcoming.forEach((_, i) => {
    const round = last.round + i + 1;
    // Daha ileriki turlarda kimin oturacağı belli değil; sadece masa ve bay kutuları
    const { sizes, byes, advancing } = eliminationRound(
      players,
      tableSize,
      perTable
    );
    const tables: BracketTable[] =
      i === 0
        ? nextTables
        : [
            ...Array.from({ length: byes }, (_, n) => ({
              key: `${round}-bye-${n}`,
              tableNo: 0,
              isBye: true,
            })),
            ...sizes.map((_, n) => ({
              key: `${round}-${n + 1}`,
              tableNo: n + 1,
            })),
          ];
    // Backend 3.'lük masasını ancak finalden önceki turda en az iki kişi elendiyse kurar
    // (ör. 1 masa + bay oynandıysa elenen tek kişidir)
    if (
      i === upcoming.length - 1 &&
      tournament.thirdPlaceMatch &&
      eliminated >= 2
    )
      tables.push({
        key: `${round}-third`,
        tableNo: 2,
        isThirdPlace: true,
        // Final hemen sonraki turdaysa 3.'lük masasına bu turda elenenler oturur
        ...(i === 0 && {
          seats: eliminatedNow.slice(0, tableSize),
        }),
      });
    columns.push({ round, tables });
    eliminated = players - advancing;
    players = advancing;
  });
  return columns;
};

// Bir masadan çıkanların bir sonraki turda oturduğu masalar; oyuncuları henüz belli
// olmayan turda backend gibi yılan sırasıyla (1-4 / 2-3) dağıtılır.
// 3.'lük masasına çizgi çekilmez (Challonge'daki gibi ayrı durur).
const targetsOf = (table: BracketTable, index: number, next: Column) => {
  const nextTables = next.tables.filter((t) => !t.isThirdPlace);
  const fed = nextTables.filter((t) => t.sources?.includes(table.key));
  if (fed.length) return fed.map((t) => t.key);
  const nextIds = new Map<number, string>();
  nextTables.forEach((t) =>
    t.match?.players.forEach((p) => nextIds.set(p.participantId, t.key))
  );
  const targets = new Set<string>();
  table.match?.players.forEach((p) => {
    const key = nextIds.get(p.participantId);
    if (key) targets.add(key);
  });
  if (!targets.size) {
    const lap = index % (nextTables.length * 2);
    const slot =
      lap < nextTables.length ? lap : nextTables.length * 2 - 1 - lap;
    targets.add(nextTables[slot].key);
  }
  return Array.from(targets);
};

// Kutuları Challonge'daki gibi dizer: aynı masaya oyuncu gönderen masalar alt alta
// durur, çizgiler kesişmez. Son sütundan geriye doğru her masa gittiği kutunun sırasını alır.
const arrangeColumns = (columns: Column[]) => {
  const targets = new Map<string, string[]>();
  columns
    .slice(0, -1)
    .forEach((column, c) =>
      column.tables.forEach((table, i) =>
        targets.set(table.key, targetsOf(table, i, columns[c + 1]))
      )
    );
  const arranged = [...columns];
  for (let c = columns.length - 2; c >= 0; c--) {
    const position = new Map(
      arranged[c + 1].tables.map((table, i) => [table.key, i])
    );
    const order = (table: BracketTable) =>
      Math.min(
        ...(targets.get(table.key) ?? []).map(
          (key) => position.get(key) ?? Infinity
        )
      );
    arranged[c] = {
      ...columns[c],
      tables: [...columns[c].tables].sort((a, b) => order(a) - order(b)),
    };
  }
  return { columns: arranged, targets };
};

interface BracketBoxProps {
  table: BracketTable;
  names: Map<number, string>;
  isEditable: boolean;
  isChampionTable: boolean;
  isAdvancer: (participantId: number) => boolean | undefined;
  boxRef: (el: HTMLDivElement | null) => void;
}

// Ağaçtaki tek masa kutusu; son turda skorlar doğrudan isimlerin yanına girilir
const BracketBox = ({
  table,
  names,
  isEditable,
  isChampionTable,
  isAdvancer,
  boxRef,
}: BracketBoxProps) => {
  const { t } = useTranslation();
  const { match } = table;
  const players = match?.isCompleted
    ? [...match.players].sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    : match?.players ?? [];

  return (
    <div
      ref={boxRef}
      className={`relative z-10 rounded-md border bg-white text-sm shadow-sm ${
        match ? "border-gray-300" : "border-dashed border-gray-300"
      }`}
    >
      <p className="px-2 py-1 text-xs text-gray-400 border-b">
        {match?.isBye || table.isBye
          ? t("Bye")
          : table.isThirdPlace
          ? t("Third Place Match")
          : `${t("Table")} ${table.tableNo}`}
      </p>
      {!match &&
        table.seats?.map(
          (participantId) =>
            participantId !== undefined && (
              <div
                key={participantId}
                className="px-2 py-1 border-b last:border-b-0"
              >
                {names.get(participantId)}
              </div>
            )
        )}
      {!match && !table.seats?.every((id) => id !== undefined) && (
        <p className="px-2 py-3 text-xs text-gray-400 italic">
          {table.isThirdPlace
            ? t("Waiting for eliminated players")
            : t("Waiting for winners")}
        </p>
      )}
      {match && isEditable ? (
        <BracketScoreEditor match={match} players={players} names={names} />
      ) : (
        players.map((player) => {
          const tied =
            match?.isCompleted &&
            players.filter((p) => p.score === player.score).length > 1;
          const isChampion = isChampionTable && player.rank === 1;
          const isThird =
            table.isThirdPlace && match?.isCompleted && player.rank === 1;
          const advanced =
            isAdvancer(player.participantId) || isChampion || isThird;
          return (
            <div
              key={player.participantId}
              className={`flex items-center gap-2 px-2 py-1 border-b last:border-b-0 ${
                advanced ? "bg-green-50 font-medium" : ""
              } ${match?.isCompleted && !advanced ? "text-gray-400" : ""}`}
            >
              <span className="w-4 text-xs text-gray-400">
                {match?.isCompleted ? player.rank : ""}
              </span>
              <span className="flex-1 truncate">
                {names.get(player.participantId)}
              </span>
              {isChampion && <FaCrown className="text-amber-500" />}
              {isThird && <FaMedal className="text-amber-700" />}
              {tied && (
                <span className="text-[10px] rounded bg-amber-100 text-amber-700 px-1">
                  {t("Tie")}
                </span>
              )}
              <span className="w-8 text-right text-gray-500">
                {player.score ?? "-"}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
};

interface BracketScoreEditorProps {
  match: TournamentMatch;
  players: TournamentMatch["players"];
  names: Map<number, string>;
}

const BracketScoreEditor = ({
  match,
  players,
  names,
}: BracketScoreEditorProps) => {
  const { t } = useTranslation();
  const { scores, setScore, isFilled, save } = useScoreEntry(match);
  return (
    <div className="flex flex-col">
      {players.map((player) => (
        <div
          key={player.participantId}
          className="flex items-center gap-2 px-2 py-1 border-b"
        >
          <span className="w-4 text-xs text-gray-400">
            {match.isCompleted ? player.rank : ""}
          </span>
          <span className="flex-1 truncate">
            {names.get(player.participantId)}
            {player.wonTieBreak && (
              <span className="ml-1 text-[10px] rounded bg-amber-100 text-amber-700 px-1">
                {t("Chosen in tie")}
              </span>
            )}
          </span>
          <input
            type="number"
            className="w-14 border rounded px-1 py-0.5 text-right"
            placeholder={t("Score")}
            value={scores[player.participantId]}
            onChange={(e) => setScore(player.participantId, e.target.value)}
          />
        </div>
      ))}
      <div className="p-2 flex flex-col gap-2">
        <GenericButton
          size="sm"
          variant="primary"
          disabled={!isFilled}
          onClick={save}
        >
          {match.isCompleted ? t("Update Scores") : t("Save Scores")}
        </GenericButton>
        <TieBreakPicker match={match} names={names} />
      </div>
    </div>
  );
};

const EliminationBracket = ({
  tournament,
  matches,
  names,
  editableRound,
}: Props) => {
  const roundName = useEliminationRoundName();
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRefs = useRef(new Map<string, HTMLDivElement>());
  const [paths, setPaths] = useState<string[]>([]);

  const elimination = matches.filter((m) => m.stage === MatchStage.ELIMINATION);
  const { columns, targets } = arrangeColumns(
    buildColumns(tournament, elimination)
  );
  const isFinished = tournament.status === TournamentStatus.FINISHED;

  // Kutular çizildikten sonra konumlarını ölçüp aralarına çizgi çeker
  useLayoutEffect(() => {
    const draw = () => {
      const container = containerRef.current;
      if (!container) return;
      const origin = container.getBoundingClientRect();
      const next: string[] = [];
      columns.slice(0, -1).forEach((column) => {
        column.tables.forEach((table) => {
          const from = boxRefs.current.get(table.key)?.getBoundingClientRect();
          if (!from) return;
          targets.get(table.key)?.forEach((key) => {
            const to = boxRefs.current.get(key)?.getBoundingClientRect();
            if (!to) return;
            const x1 = from.right - origin.left;
            const y1 = from.top + from.height / 2 - origin.top;
            const x2 = to.left - origin.left;
            const y2 = to.top + to.height / 2 - origin.top;
            const midX = (x1 + x2) / 2;
            next.push(`M${x1},${y1} H${midX} V${y2} H${x2}`);
          });
        });
      });
      setPaths(next);
    };
    draw();
    window.addEventListener("resize", draw);
    return () => window.removeEventListener("resize", draw);
  }, [matches, tournament]);

  if (!columns.length) return null;

  const isAdvancer = (participantId: number, c: number) =>
    columns[c + 1]?.tables.some(
      (next) =>
        !next.isThirdPlace &&
        (next.match?.players.some((p) => p.participantId === participantId) ||
          next.seats?.includes(participantId))
    );

  return (
    <div className="overflow-x-auto">
      <div ref={containerRef} className="relative inline-flex gap-16 p-2">
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {paths.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              className="stroke-gray-300"
              strokeWidth={2}
            />
          ))}
        </svg>
        {columns.map((column, c) => (
          <div key={column.round} className="flex flex-col w-60">
            <p className="text-xs font-semibold uppercase text-gray-500 mb-3 text-center">
              {roundName(column.round, columns.length)}
            </p>
            <div className="flex flex-col justify-around flex-1 gap-4">
              {column.tables.map((table) => (
                <BracketBox
                  key={table.key}
                  table={table}
                  names={names}
                  isEditable={
                    column.round === editableRound && !table.match?.isBye
                  }
                  isChampionTable={
                    c === columns.length - 1 &&
                    !!table.match &&
                    !table.isThirdPlace &&
                    isFinished
                  }
                  isAdvancer={(participantId) => isAdvancer(participantId, c)}
                  boxRef={(el) => {
                    if (el) boxRefs.current.set(table.key, el);
                    else boxRefs.current.delete(table.key);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EliminationBracket;
