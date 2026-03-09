import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import { formatAsLocalDate } from "../../utils/format";

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

  const {
    action,
    entity,
    detailFields,
    rawPayload,
    hasReadableDetails,
  } = useMemo(() => {
    const parsedPayload = stripVersionKeys(safeParsePayload(payload));
    const parsedType = getActionAndEntity(resolvedType);
    const raw = JSON.stringify(parsedPayload, null, 2);

    if (!isObject(parsedPayload)) {
      const isNullPayload = parsedPayload === null || parsedPayload === undefined;
      const primitiveField: DetailField[] = isNullPayload
        ? []
        : [
            {
              label: t("Value"),
              value: toDisplayValue("value", parsedPayload),
            },
          ];
      return {
        action: parsedType.action,
        entity: parsedType.entity,
        detailFields: primitiveField,
        rawPayload: raw,
        hasReadableDetails: !isNullPayload && primitiveField.length > 0,
      };
    }

    const details = buildDetailFields(parsedPayload);

    return {
      action: parsedType.action,
      entity: parsedType.entity,
      detailFields: details,
      rawPayload: raw,
      hasReadableDetails: details.length > 0,
    };
  }, [payload, resolvedType, t]);

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

      <details className="mt-3 rounded-md border border-gray-200 bg-white p-2">
        <summary className="cursor-pointer text-xs font-semibold text-gray-600">
          {t("Raw JSON")}
        </summary>
        <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-md bg-gray-100 p-2 text-xs text-gray-800">
          {rawPayload || "{}"}
        </pre>
      </details>
    </div>
  );
};

export default ActivityPayloadRenderer;
