import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { formatAsLocalDate } from "../../utils/format";
import { useGetUsersMinimal } from "../../utils/api/user";
import { useGetStoreLocations } from "../../utils/api/location";
import { getItem } from "../../utils/getItem";
import { ShiftActivityPayload, ShiftValue } from "../../types";

type Props = {
  activityType?: string;
  payload: unknown;
  actorName?: string;
  middlemanUserName?: string;
};

type DetailField = {
  label: string;
  value: string;
};

const ACTION_COLORS: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  ADD: "bg-emerald-100 text-emerald-700",
  UPDATE: "bg-amber-100 text-amber-700",
  DELETE: "bg-red-100 text-red-700",
  CANCEL: "bg-rose-100 text-rose-700",
  LOGIN: "bg-sky-100 text-sky-700",
  LOGOUT: "bg-slate-100 text-slate-700",
  START: "bg-teal-100 text-teal-700",
  FINISH: "bg-orange-100 text-orange-700",
  APPROVED: "bg-green-100 text-green-700",
  REJECTED: "bg-red-100 text-red-700",
};

const MAX_FIELD_COUNT = 16;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stripVersionKeys = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => stripVersionKeys(item));
  }
  if (!isObject(value)) return value;

  return Object.entries(value).reduce<Record<string, unknown>>(
    (acc, [key, nestedValue]) => {
      if (key === "__v") return acc;
      acc[key] = stripVersionKeys(nestedValue);
      return acc;
    },
    {}
  );
};

const safeParsePayload = (payload: unknown): unknown => {
  if (typeof payload !== "string") return payload;
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
};

const isPrimitive = (
  value: unknown
): value is string | number | boolean | null => {
  return (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  );
};

const toTitleCase = (value: string) => {
  if (!value) return "";
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const keyToLabel = (key: string) => {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());
};

const isParsableDate = (value: string) => {
  if (!value || typeof value !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value)) return false;
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const formatDateValue = (value: string) => {
  const parsed = new Date(value);
  const formattedDate = formatAsLocalDate(format(parsed, "yyyy-MM-dd"));
  const hasTime = value.includes("T");
  if (!hasTime) return formattedDate;
  return `${formattedDate} ${format(parsed, "HH:mm")}`;
};

const toDisplayValue = (key: string, value: unknown): string => {
  if (value === undefined) return "-";
  if (value === null) return "null";
  if (typeof value === "string") {
    if (isParsableDate(value)) {
      return formatDateValue(value);
    }
    return value || "-";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return "[]";
    const primitiveItems = value.filter(isPrimitive);
    if (primitiveItems.length === value.length && value.length <= 4) {
      return primitiveItems.map((item) => String(item)).join(", ");
    }
    return `${value.length} items`;
  }
  if (isObject(value)) {
    const id = value.id ?? value._id;
    if (typeof id === "string" || typeof id === "number") return `#${id}`;
    const shortTextKeys = [
      "name",
      "fullName",
      "title",
      "label",
      "tableName",
      "groupName",
      "status",
      "email",
    ];
    for (const shortKey of shortTextKeys) {
      const textValue = value[shortKey];
      if (typeof textValue === "string" && textValue.trim()) return textValue;
    }
    return `${Object.keys(value).length} keys`;
  }
  return String(value);
};

const buildDetailFields = (obj: Record<string, unknown>): DetailField[] => {
  return Object.entries(obj)
    .filter(([, value]) => value !== undefined)
    .slice(0, MAX_FIELD_COUNT)
    .map(([key, value]) => ({
      label: keyToLabel(key),
      value: toDisplayValue(key, value),
    }));
};

const getActionAndEntity = (activityType: string) => {
  const normalized = activityType.trim();
  if (!normalized) {
    return { action: null as string | null, entity: null as string | null };
  }

  const parts = normalized.split("_").filter(Boolean);
  if (parts.length === 0) {
    return { action: null as string | null, entity: null as string | null };
  }

  const action = parts[0].toUpperCase();
  const entityRaw = parts.slice(1).join(" ");
  return {
    action,
    entity: entityRaw ? toTitleCase(entityRaw.toLocaleLowerCase("en-US")) : null,
  };
};

const SHIFT_ACTIVITY_TYPES = new Set([
  "CREATE_SHIFT",
  "UPDATE_SHIFT",
  "DELETE_SHIFT",
  "ASSIGN_CHEF",
  "ASSIGN_MIDDLEMAN",
]);

const ShiftActivityRenderer = ({
  activityType,
  payload,
}: {
  activityType: string;
  payload: ShiftActivityPayload;
}) => {
  const { t } = useTranslation();
  const users = useGetUsersMinimal();
  const locations = useGetStoreLocations();

  const locationName =
    payload.location !== undefined
      ? (getItem(payload.location, locations)?.name ?? String(payload.location))
      : "-";

  const formattedDay = payload.day
    ? formatAsLocalDate(payload.day)
    : "-";

  const resolveUserName = (userId: string) =>
    getItem(userId, users)?.name ?? userId;

  if (activityType === "CREATE_SHIFT") {
    const shifts: ShiftValue[] = payload.shifts ?? [];
    const assignedShifts = shifts.filter((s) => (s.user?.length ?? 0) > 0);
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {t("Date")}: <strong>{formattedDay}</strong>
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {t("Location")}: <strong>{locationName}</strong>
          </span>
        </div>
        {assignedShifts.length > 0 ? (
          <div className="space-y-1">
            {assignedShifts.map((s) => (
              <div
                key={s.shift}
                className="flex items-center gap-2 rounded border border-gray-200 bg-white px-3 py-1.5 text-sm"
              >
                <span className="min-w-[90px] font-mono font-semibold text-gray-700">
                  {s.shift}
                  {s.shiftEndHour ? ` → ${s.shiftEndHour}` : ""}
                </span>
                <span className="text-gray-500">
                  {s.user?.map(resolveUserName).join(", ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t("No users assigned")}</p>
        )}
      </div>
    );
  }

  if (activityType === "DELETE_SHIFT") {
    return (
      <div className="flex flex-wrap gap-2 text-sm">
        <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
          {t("Date")}: <strong>{formattedDay}</strong>
        </span>
        <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
          {t("Location")}: <strong>{locationName}</strong>
        </span>
      </div>
    );
  }

  if (activityType === "UPDATE_SHIFT") {
    const prevShifts: ShiftValue[] = payload.previousShifts ?? [];
    const newShifts: ShiftValue[] = payload.updatedShifts ?? [];

    const allShiftKeys = Array.from(
      new Set([
        ...prevShifts.map((s) => s.shift),
        ...newShifts.map((s) => s.shift),
      ])
    );

    const changedShifts = allShiftKeys.filter((key) => {
      const prev = prevShifts.find((s) => s.shift === key);
      const next = newShifts.find((s) => s.shift === key);
      const prevUsers = (prev?.user ?? []).slice().sort().join(",");
      const nextUsers = (next?.user ?? []).slice().sort().join(",");
      return prevUsers !== nextUsers;
    });

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {t("Date")}: <strong>{formattedDay}</strong>
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {t("Location")}: <strong>{locationName}</strong>
          </span>
        </div>
        {changedShifts.length > 0 ? (
          <div className="space-y-1.5">
            {changedShifts.map((key) => {
              const prev = prevShifts.find((s) => s.shift === key);
              const next = newShifts.find((s) => s.shift === key);
              const prevUsers = prev?.user ?? [];
              const nextUsers = next?.user ?? [];
              const added = nextUsers.filter((u) => !prevUsers.includes(u));
              const removed = prevUsers.filter((u) => !nextUsers.includes(u));
              return (
                <div
                  key={key}
                  className="rounded border border-gray-200 bg-white px-3 py-2 text-sm"
                >
                  <p className="mb-1 font-mono font-semibold text-gray-700">
                    {key}
                    {next?.shiftEndHour
                      ? ` → ${next.shiftEndHour}`
                      : prev?.shiftEndHour
                      ? ` → ${prev.shiftEndHour}`
                      : ""}
                  </p>
                  {added.length > 0 && (
                    <p className="text-green-600">
                      + {added.map(resolveUserName).join(", ")}
                    </p>
                  )}
                  {removed.length > 0 && (
                    <p className="text-red-500">
                      - {removed.map(resolveUserName).join(", ")}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">{t("No user changes detected")}</p>
        )}
      </div>
    );
  }

  if (activityType === "ASSIGN_CHEF" || activityType === "ASSIGN_MIDDLEMAN") {
    const isChef = activityType === "ASSIGN_CHEF";
    const prevId = isChef
      ? (payload.previousChefUserId ?? "")
      : (payload.previousMiddlemanUserId ?? "");
    const newId = isChef
      ? (payload.chefUserId ?? "")
      : (payload.middlemanUserId ?? "");
    const label = isChef ? `★ ${t("Chef")}` : `● ${t("Middleman")}`;

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {t("Date")}: <strong>{formattedDay}</strong>
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {t("Location")}: <strong>{locationName}</strong>
          </span>
          <span className="rounded bg-gray-100 px-2 py-0.5 text-gray-600">
            {t("Shift")}:{" "}
            <strong className="font-mono">{payload.shift ?? "-"}</strong>
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-xs font-semibold text-gray-500">{label}:</span>
          {!prevId && newId && (
            <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
              + <strong>{resolveUserName(newId)}</strong>
            </span>
          )}
          {prevId && !newId && (
            <span className="rounded bg-red-100 px-2 py-0.5 text-red-600">
              - <strong>{resolveUserName(prevId)}</strong>
            </span>
          )}
          {prevId && newId && prevId !== newId && (
            <>
              <span className="rounded bg-red-100 px-2 py-0.5 text-red-600 line-through">
                {resolveUserName(prevId)}
              </span>
              <span className="text-gray-400">→</span>
              <span className="rounded bg-green-100 px-2 py-0.5 text-green-700">
                <strong>{resolveUserName(newId)}</strong>
              </span>
            </>
          )}
        </div>
      </div>
    );
  }

  return null;
};

const RawJsonSection = ({ raw, t }: { raw: string; t: (key: string) => string }) => (
  <details className="mt-3 rounded-md border border-gray-200 bg-white p-2">
    <summary className="cursor-pointer text-xs font-semibold text-gray-600">
      {t("Raw JSON")}
    </summary>
    <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-100 p-2 text-xs text-gray-800">
      {raw || "{}"}
    </pre>
  </details>
);

const ActivityPayloadRenderer = ({
  payload,
  activityType,
  actorName,
  middlemanUserName,
}: Props) => {
  const { t } = useTranslation();
  const resolvedType = activityType ?? "";

  const isFinishMiddlemanByManager =
    resolvedType === "FINISH_MIDDLEMAN_BY_MANAGER";
  const summaryLine =
    isFinishMiddlemanByManager && (actorName || middlemanUserName)
      ? t("Middleman session of {{name}} closed by {{actor}}", {
          name: middlemanUserName ?? t("Someone"),
          actor: actorName ?? t("Someone"),
        })
      : null;

  // Parse ve stripVersionKeys tek seferinde yapılıyor — hem shift hem default branch kullanır
  const { action, entity, detailFields, rawPayload, hasReadableDetails, parsedPayload } =
    useMemo(() => {
      const parsed = stripVersionKeys(safeParsePayload(payload));
      const parsedType = getActionAndEntity(resolvedType);
      const raw = JSON.stringify(parsed, null, 2);

      if (!isObject(parsed)) {
        const isNullPayload = parsed === null || parsed === undefined;
        const primitiveField: DetailField[] = isNullPayload
          ? []
          : [{ label: t("Value"), value: toDisplayValue("value", parsed) }];
        return {
          action: parsedType.action,
          entity: parsedType.entity,
          detailFields: primitiveField,
          rawPayload: raw,
          hasReadableDetails: !isNullPayload && primitiveField.length > 0,
          parsedPayload: parsed,
        };
      }

      const details = buildDetailFields(parsed);
      return {
        action: parsedType.action,
        entity: parsedType.entity,
        detailFields: details,
        rawPayload: raw,
        hasReadableDetails: details.length > 0,
        parsedPayload: parsed,
      };
    }, [payload, resolvedType, t]);

  // Shift branch — parse ve action/entity useMemo'dan geliyor
  if (SHIFT_ACTIVITY_TYPES.has(resolvedType)) {
    return (
      <div className="w-full rounded-md border border-gray-200 bg-gray-50 p-3">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {action && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                ACTION_COLORS[action] ?? "bg-gray-200 text-gray-700"
              }`}
            >
              {action}
            </span>
          )}
          {entity && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
              {entity}
            </span>
          )}
        </div>
        <ShiftActivityRenderer
          activityType={resolvedType}
          payload={parsedPayload as ShiftActivityPayload}
        />
        <RawJsonSection raw={rawPayload} t={t} />
      </div>
    );
  }

  return (
    <div className="w-full rounded-md border border-gray-200 bg-gray-50 p-3">
      {summaryLine && (
        <p className="mb-3 text-sm font-medium text-gray-800">{summaryLine}</p>
      )}
      {(action || entity) && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {action && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                ACTION_COLORS[action] || "bg-gray-200 text-gray-700"
              }`}
            >
              {action}
            </span>
          )}
          {entity && (
            <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-gray-700">
              {entity}
            </span>
          )}
        </div>
      )}
      {hasReadableDetails && (
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {detailFields.map((field) => (
            <div
              key={`${field.label}-${field.value}`}
              className="rounded-md border border-gray-200 bg-white px-3 py-2"
            >
              <p className="text-[11px] font-semibold text-gray-500">
                {field.label}
              </p>
              <p className="break-words text-sm text-gray-800">{field.value}</p>
            </div>
          ))}
        </div>
      )}
      <RawJsonSection raw={rawPayload} t={t} />
    </div>
  );
};

export default ActivityPayloadRenderer;
