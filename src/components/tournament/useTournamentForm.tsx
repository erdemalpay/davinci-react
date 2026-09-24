import { useTranslation } from "react-i18next";
import { useDataContext } from "../../context/Data.context";
import {
  PairingMode,
  Tournament,
  TournamentFormat,
} from "../../types/tournament";
import { useGetStoreLocations } from "../../utils/api/location";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

// Organizatöre sadece biçim + en fazla iki soru sorulur; puanlama ve masa ayarları
// masa büyüklüğünden türetilir (BGA gibi: bay geçen birincilik puanını alır).
export const autoRules = (tableSize: number) => {
  const size = Math.max(2, Number(tableSize) || 2);
  const middle = Array.from({ length: size - 2 }, (_, i) => size - 2 - i);
  return {
    pairingMode: PairingMode.SWISS,
    placementPoints: [size, ...middle, 0],
    byePoints: size,
    minTableSize: Math.max(2, size - 1),
    advancePerTable: Math.ceil(size / 2),
  };
};

type FormValues = Record<string, unknown>;

// Eleme aşamasının masa büyüklüğü; ayrıca girilmediyse puan turlarındakiyle aynı
export const eliminationSize = (rules: {
  tableSize?: unknown;
  eliminationTableSize?: unknown;
}) => Number(rules.eliminationTableSize) || Number(rules.tableSize) || 0;

const hasRounds = (format: TournamentFormat) =>
  format !== TournamentFormat.ELIMINATION;

// Turnuva başladıktan sonra backend bu alanların değişmesine izin vermez
export const RULE_KEYS = [
  "format",
  "tableSize",
  "eliminationTableSize",
  "pairingMode",
  "minTableSize",
  "leagueRounds",
  "placementPoints",
  "byePoints",
  "advanceCount",
  "advancePerTable",
];
const ADVANCED_KEYS = [
  "pairingMode",
  "minTableSize",
  "placementPoints",
  "byePoints",
];
const FORM_ONLY_KEYS = ["customizeRules"];

export const DEFAULT_FORM_VALUES = {
  format: TournamentFormat.LEAGUE_THEN_ELIMINATION,
  tableSize: 4,
  leagueRounds: 3,
  advanceCount: 4,
  advancePerTable: 2,
  customizeRules: false,
  pairingMode: PairingMode.SWISS,
};

const pointsText = (points?: number[]) => points?.join(",") ?? "";

export const toFormValues = (tournament: Tournament) => {
  const auto = autoRules(tournament.tableSize);
  const isCustomized =
    tournament.pairingMode !== auto.pairingMode ||
    pointsText(tournament.placementPoints) !==
      pointsText(auto.placementPoints) ||
    (tournament.byePoints ?? auto.byePoints) !== auto.byePoints ||
    (tournament.minTableSize ?? auto.minTableSize) !== auto.minTableSize ||
    (tournament.format === TournamentFormat.LEAGUE_THEN_ELIMINATION &&
      tournament.advancePerTable !==
        autoRules(eliminationSize(tournament)).advancePerTable);
  return {
    ...tournament,
    placementPoints: pointsText(tournament.placementPoints),
    customizeRules: isCustomized,
  };
};

const isEmpty = (value: unknown) =>
  value === "" || value === null || value === undefined;

// Formu backend'e gidecek kurallara çevirir: seçilen biçimde kullanılmayan ayarlar
// gönderilmez, özelleştirilmeyen ya da boş bırakılan ayarlar otomatik değerini alır.
export const toPayload = (item: object, emptyValue?: null) => {
  const values = item as FormValues;
  const format = values.format as TournamentFormat;
  const auto = autoRules(Number(values.tableSize));
  const payload: FormValues = {};
  Object.entries(values).forEach(([key, value]) => {
    if (FORM_ONLY_KEYS.includes(key) || RULE_KEYS.includes(key)) return;
    if (!isEmpty(value)) payload[key] = value;
    else if (emptyValue === null) payload[key] = null;
  });

  const pick = (key: keyof typeof auto) =>
    values.customizeRules && !isEmpty(values[key]) ? values[key] : auto[key];

  payload.format = format;
  payload.tableSize = Number(values.tableSize);
  if (hasRounds(format)) {
    payload.leagueRounds = values.leagueRounds;
    ADVANCED_KEYS.forEach((key) => {
      payload[key] = pick(key as keyof typeof auto);
    });
    if (typeof payload.placementPoints === "string")
      payload.placementPoints = payload.placementPoints
        .split(",")
        .map((p) => Number(p.trim()))
        .filter((p) => !Number.isNaN(p));
  }
  if (format === TournamentFormat.ELIMINATION)
    payload.advancePerTable = values.advancePerTable;
  if (format === TournamentFormat.LEAGUE_THEN_ELIMINATION) {
    payload.advanceCount = values.advanceCount;
    // Masadan çıkan sayısı eleme masasının büyüklüğünden türetilir
    payload.advancePerTable =
      values.customizeRules && !isEmpty(values.advancePerTable)
        ? values.advancePerTable
        : autoRules(eliminationSize(values)).advancePerTable;
    if (!isEmpty(values.eliminationTableSize))
      payload.eliminationTableSize = Number(values.eliminationTableSize);
    else if (emptyValue === null) payload.eliminationTableSize = null;
  }
  return payload;
};

export const TOURNAMENT_FORM_KEYS = [
  { key: "name", type: FormKeyTypeEnum.STRING },
  { key: "game", type: FormKeyTypeEnum.NUMBER },
  { key: "location", type: FormKeyTypeEnum.NUMBER },
  { key: "date", type: FormKeyTypeEnum.DATE },
  { key: "registrationDeadline", type: FormKeyTypeEnum.DATE },
  { key: "format", type: FormKeyTypeEnum.STRING },
  { key: "tableSize", type: FormKeyTypeEnum.NUMBER },
  { key: "eliminationTableSize", type: FormKeyTypeEnum.NUMBER },
  { key: "leagueRounds", type: FormKeyTypeEnum.NUMBER },
  { key: "advanceCount", type: FormKeyTypeEnum.NUMBER },
  { key: "advancePerTable", type: FormKeyTypeEnum.NUMBER },
  { key: "customizeRules", type: FormKeyTypeEnum.BOOLEAN },
  { key: "pairingMode", type: FormKeyTypeEnum.STRING },
  { key: "minTableSize", type: FormKeyTypeEnum.NUMBER },
  { key: "placementPoints", type: FormKeyTypeEnum.STRING },
  { key: "byePoints", type: FormKeyTypeEnum.NUMBER },
];

const MIN_EXAMPLE_PLAYER_COUNT = 16;

// Eleme turlarında kaç masa oynanacağını backend'deki akışla aynı şekilde tahmin eder:
// masalar eşit dağıtılır (sığmayan bay geçer), bir masadan en fazla "masa - 1" kişi çıkar.
// Her turda en az bir kişi elendiği için döngü her zaman biter.
export const eliminationTables = (
  players: number,
  tableSize: number,
  perTable: number
) => {
  const tables: number[] = [];
  let remaining = players;
  while (remaining > tableSize && tableSize >= 2 && perTable > 0) {
    const count = Math.ceil(remaining / tableSize);
    const base = Math.floor(remaining / count);
    const sizes =
      base >= 2
        ? Array.from(
            { length: count },
            (_, i) => base + (i < remaining % count ? 1 : 0)
          )
        : new Array(Math.floor(remaining / tableSize)).fill(tableSize);
    const byes = remaining - sizes.reduce((sum, size) => sum + size, 0);
    tables.push(sizes.length + byes);
    remaining =
      byes + sizes.reduce((sum, size) => sum + Math.min(perTable, size - 1), 0);
  }
  return [...tables, 1];
};

// Eleme turlarını sondan sayarak adlandırır: Final, Yarı Final, Çeyrek Final
export const useEliminationRoundName = () => {
  const { t } = useTranslation();
  return (round: number, totalRounds: number) => {
    const fromEnd = totalRounds - round;
    if (fromEnd === 0) return t("Final");
    if (fromEnd === 1) return t("Semi-final");
    if (fromEnd === 2) return t("Quarter-final");
    return t("Elimination Round N", { round });
  };
};

// Formun altında "bu ayarlarla turnuva nasıl oynanır" özetini gösterir
const PlanSummary = ({ values }: { values: FormValues }) => {
  const { t } = useTranslation();
  const roundName = useEliminationRoundName();
  const format = values.format as TournamentFormat;
  const tableSize = Number(values.tableSize) || 0;
  if (!format || tableSize < 2) return null;

  const auto = autoRules(tableSize);
  const finalTableSize =
    format === TournamentFormat.ELIMINATION
      ? tableSize
      : eliminationSize(values);
  const points =
    values.customizeRules && values.placementPoints
      ? String(values.placementPoints)
      : pointsText(auto.placementPoints);
  const autoPerTable = autoRules(finalTableSize).advancePerTable;
  const perTable = Number(
    format === TournamentFormat.ELIMINATION || values.customizeRules
      ? values.advancePerTable || autoPerTable
      : autoPerTable
  );
  const rounds = Number(values.leagueRounds) || 0;
  const advanceCount = Number(values.advanceCount) || 0;
  // Örnek, devam edecek kişi sayısının en az iki katı katılımcıyla anlatılır
  const exampleCount =
    format === TournamentFormat.LEAGUE_THEN_ELIMINATION
      ? Math.max(MIN_EXAMPLE_PLAYER_COUNT, advanceCount * 2)
      : MIN_EXAMPLE_PLAYER_COUNT;
  const firstTables = Math.ceil(exampleCount / tableSize);

  const steps: string[] = [];
  if (hasRounds(format)) {
    steps.push(
      t("PlanRounds", { rounds, tables: firstTables, tableSize, points })
    );
  }
  if (format !== TournamentFormat.LEAGUE) {
    const start =
      format === TournamentFormat.ELIMINATION ? exampleCount : advanceCount;
    if (format === TournamentFormat.LEAGUE_THEN_ELIMINATION)
      steps.push(
        t(advanceCount > finalTableSize ? "PlanAdvance" : "PlanAdvanceFinal", {
          players: advanceCount,
        })
      );
    const tables = eliminationTables(start, finalTableSize, perTable);
    tables.slice(0, -1).forEach((count, i) =>
      steps.push(
        t("PlanEliminationRound", {
          name: roundName(i + 1, tables.length),
          tables: count,
          perTable,
        })
      )
    );
    steps.push(t("PlanFinal"));
  } else {
    steps.push(t("PlanLeagueWinner"));
  }

  return (
    <div className="mt-2 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm text-gray-700">
      <p className="font-medium text-blue-800 mb-1">
        {t("PlanTitle", { players: exampleCount })}
      </p>
      <ol className="list-decimal ml-5 space-y-0.5">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
};

// Seçilen biçime göre sadece gereken soruları döner; gelişmiş ayarlar isteğe bağlı açılır.
export const useTournamentFormInputs = (
  form: object,
  isRuleLocked: boolean
) => {
  const values = form as FormValues;
  const { t } = useTranslation();
  const { games } = useDataContext();
  const locations = useGetStoreLocations();

  const format = values.format as TournamentFormat;
  const auto = autoRules(Number(values.tableSize));
  const isCustomizing = Boolean(values.customizeRules);
  const isTwoStage = format === TournamentFormat.LEAGUE_THEN_ELIMINATION;

  const ruleInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "format",
      label: t("How Will It Be Played?"),
      options: [
        {
          value: TournamentFormat.LEAGUE_THEN_ELIMINATION,
          label: t("Point Rounds + Final"),
        },
        { value: TournamentFormat.ELIMINATION, label: t("Elimination") },
        { value: TournamentFormat.LEAGUE, label: t("Point Rounds") },
      ],
      placeholder: t("How Will It Be Played?"),
      required: true,
      helperText: t(`FormatHelp_${format}`),
      helperNode: <PlanSummary values={values} />,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "tableSize",
      label: t("Players Per Table"),
      placeholder: "4",
      required: true,
      helperText: t("TableSizeHelp"),
    },
    ...(hasRounds(format)
      ? [
          {
            type: InputTypes.NUMBER,
            formKey: "leagueRounds",
            label: t("Number Of Rounds"),
            placeholder: "3",
            required: true,
            helperText: t("LeagueRoundsHelp"),
          },
        ]
      : []),
    ...(isTwoStage
      ? [
          {
            type: InputTypes.NUMBER,
            formKey: "advanceCount",
            label: t("Players Continuing After Rounds"),
            placeholder: "4",
            required: true,
            helperText: t("AdvanceCountHelp"),
          },
          {
            type: InputTypes.NUMBER,
            formKey: "eliminationTableSize",
            label: t("Players Per Table In Elimination"),
            placeholder: String(Number(values.tableSize) || 4),
            required: false,
            helperText: t("EliminationTableSizeHelp"),
          },
        ]
      : []),
    ...(format === TournamentFormat.ELIMINATION
      ? [
          {
            type: InputTypes.NUMBER,
            formKey: "advancePerTable",
            label: t("Players Advancing Per Table"),
            placeholder: String(auto.advancePerTable),
            required: true,
            helperText: t("AdvancePerTableHelp"),
          },
        ]
      : []),
    ...(hasRounds(format)
      ? [
          {
            type: InputTypes.CHECKBOX,
            formKey: "customizeRules",
            label: t("Change Scoring Settings"),
            required: false,
            helperText: t("CustomizeRulesHelp", {
              points: pointsText(auto.placementPoints),
            }),
          },
        ]
      : []),
    ...(hasRounds(format) && isCustomizing
      ? [
          {
            type: InputTypes.TEXT,
            formKey: "placementPoints",
            label: t("Placement Points"),
            placeholder: pointsText(auto.placementPoints),
            required: false,
            helperText: t("PlacementPointsHelp"),
          },
          {
            type: InputTypes.NUMBER,
            formKey: "byePoints",
            label: t("Bye Points"),
            placeholder: String(auto.byePoints),
            required: false,
            helperText: t("ByePointsHelp"),
          },
          {
            type: InputTypes.NUMBER,
            formKey: "minTableSize",
            label: t("Minimum Table Size"),
            placeholder: String(auto.minTableSize),
            required: false,
            helperText: t("MinTableSizeHelp"),
          },
          {
            type: InputTypes.SELECT,
            formKey: "pairingMode",
            label: t("Pairing"),
            options: [
              { value: PairingMode.SWISS, label: t("Swiss") },
              { value: PairingMode.RANDOM, label: t("Random") },
            ],
            placeholder: t("Swiss"),
            required: false,
            helperText: t("PairingModeHelp"),
          },
          ...(isTwoStage
            ? [
                {
                  type: InputTypes.NUMBER,
                  formKey: "advancePerTable",
                  label: t("Players Advancing Per Table"),
                  placeholder: String(
                    autoRules(eliminationSize(values)).advancePerTable
                  ),
                  required: false,
                  helperText: t("AdvancePerTableHelp"),
                },
              ]
            : []),
        ]
      : []),
  ].map((input) => ({ ...input, isDisabled: isRuleLocked }));

  return [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      label: t("Tournament Name"),
      placeholder: "Catan Turnuvası",
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "game",
      label: t("Game"),
      options: games?.map((game) => ({ value: game._id, label: game.name })),
      placeholder: t("Game"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations?.map((location) => ({
        value: location._id,
        label: location.name,
      })),
      placeholder: t("Location"),
      required: false,
    },
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Tournament Date"),
      placeholder: t("Tournament Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "registrationDeadline",
      label: t("Registration Deadline"),
      placeholder: t("Registration Deadline"),
      required: false,
      isDatePicker: true,
      helperText: t("RegistrationDeadlineHelp"),
    },
    ...ruleInputs,
  ];
};
