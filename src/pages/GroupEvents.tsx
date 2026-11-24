import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import {
  GroupEvent,
  GroupEventStatus,
  groupEventStatusLabels,
  groupEventTypeLabels,
  useGetGroupEvents,
  useUpdateGroupEventStatus,
} from "../utils/api/groupEvent";

const CAPACITY = 100;

const statusClass: Record<GroupEventStatus, string> = {
  [GroupEventStatus.PENDING]: "bg-yellow-500",
  [GroupEventStatus.APPROVED]: "bg-green-600",
  [GroupEventStatus.REJECTED]: "bg-red-600",
  [GroupEventStatus.CANCELLED]: "bg-gray-500",
};

const formatDate = (date: string) => {
  const [y, m, d] = date.split("-");
  return `${d}.${m}.${y}`;
};

const todayIso = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Istanbul" }).format(
    new Date()
  );

type Decision = {
  mode: GroupEventStatus.APPROVED | GroupEventStatus.REJECTED | null;
  row: GroupEvent | null;
};

// Group event applications sent from davinciboardgame.com
export default function GroupEvents() {
  const { t } = useTranslation();
  const events = useGetGroupEvents();
  const { mutate: updateStatus } = useUpdateGroupEventStatus();
  const [status, setStatus] = useState<GroupEventStatus | "">(
    GroupEventStatus.PENDING
  );
  const [showPast, setShowPast] = useState(false);
  const [decision, setDecision] = useState<Decision>({ mode: null, row: null });

  // Approved seats per day, to show how full a day already is
  const approvedByDate = useMemo(() => {
    const map: Record<string, GroupEvent[]> = {};
    for (const e of events) {
      if (e.status === GroupEventStatus.APPROVED) {
        (map[e.date] ??= []).push(e);
      }
    }
    return map;
  }, [events]);

  const usedSeats = (row: GroupEvent) => {
    const toMin = (time: string) => {
      const [h, m] = time.split(":").map(Number);
      return h * 60 + m;
    };
    let most = 0;
    for (
      let hour = toMin(row.startTime);
      hour < toMin(row.endTime);
      hour += 60
    ) {
      const used = (approvedByDate[row.date] ?? [])
        .filter(
          (e) =>
            e._id !== row._id &&
            toMin(e.startTime) < hour + 60 &&
            toMin(e.endTime) > hour
        )
        .reduce((sum, e) => sum + e.participantCount, 0);
      most = Math.max(most, used);
    }
    return most;
  };

  const rows = useMemo(() => {
    const today = todayIso();
    return events
      .filter((e) => !status || e.status === status)
      .filter((e) => showPast || e.date >= today)
      .map((e) => ({
        ...e,
        dateLabel: formatDate(e.date),
        timeLabel: `${e.startTime} - ${e.endTime}`,
      }));
  }, [events, status, showPast]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Time"), isSortable: false },
      { key: t("Group"), isSortable: true },
      { key: t("Contact"), isSortable: false },
      { key: t("People"), isSortable: true },
      { key: t("Seats taken at that time"), isSortable: false },
      { key: t("Event Type"), isSortable: false },
      { key: t("Requests"), isSortable: false },
      { key: t("Invoice"), isSortable: false },
      { key: t("Notes"), isSortable: false },
      { key: t("Status"), isSortable: false },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = [
    { key: "dateLabel" },
    { key: "timeLabel" },
    { key: "organization" },
    {
      key: "contactName",
      node: (row: GroupEvent) => (
        <div className="flex flex-col text-sm">
          <span className="font-medium">{row.contactName}</span>
          <a className="text-blue-700" href={`tel:${row.phone}`}>
            {row.phone}
          </a>
          <a className="text-blue-700" href={`mailto:${row.email}`}>
            {row.email}
          </a>
        </div>
      ),
    },
    { key: "participantCount" },
    {
      key: "seats",
      node: (row: GroupEvent) => {
        const used = usedSeats(row);
        const fits = used + row.participantCount <= CAPACITY;
        return (
          <span
            className={fits ? "text-gray-700" : "text-red-600 font-semibold"}
          >
            {used} / {CAPACITY}
          </span>
        );
      },
    },
    {
      key: "eventType",
      node: (row: GroupEvent) => (
        <span>{t(groupEventTypeLabels[row.eventType] ?? row.eventType)}</span>
      ),
    },
    {
      key: "requests",
      node: (row: GroupEvent) => (
        <div className="flex flex-col gap-1 text-sm max-w-64">
          {row.wantsGameMaster && (
            <span>
              🎲 {t("Game master")}
              {row.gamePreferences ? `: ${row.gamePreferences}` : ""}
            </span>
          )}
          {row.wantsFood && (
            <span>
              🍽 {t("Food & drinks")}
              {row.foodRequest ? `: ${row.foodRequest}` : ""}
              {row.budgetPerPerson
                ? ` (${row.budgetPerPerson} ₺ / ${t("person")})`
                : ""}
            </span>
          )}
          {!row.wantsGameMaster && !row.wantsFood && <span>-</span>}
        </div>
      ),
    },
    {
      key: "invoice",
      node: (row: GroupEvent) =>
        row.needsInvoice ? (
          <div className="flex flex-col text-sm">
            <span>{row.invoiceTitle}</span>
            <span className="text-gray-500">
              {row.taxOffice} {row.taxNumber}
            </span>
          </div>
        ) : (
          <span>-</span>
        ),
    },
    {
      key: "notes",
      node: (row: GroupEvent) => (
        <div className="flex flex-col text-sm max-w-64 whitespace-pre-line">
          <span>{row.notes || "-"}</span>
          {row.responseNote && (
            <span className="text-gray-500">
              {t("Our note")}: {row.responseNote}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      node: (row: GroupEvent) => (
        <span
          className={`px-2 py-1 rounded-md text-white text-xs ${
            statusClass[row.status]
          }`}
        >
          {t(groupEventStatusLabels[row.status])}
        </span>
      ),
    },
    {
      key: "actions",
      node: (row: GroupEvent) => (
        <div className="flex gap-2">
          {row.status !== GroupEventStatus.APPROVED && (
            <button
              className="px-2 py-1 rounded bg-green-600 text-white text-sm"
              onClick={() =>
                setDecision({ mode: GroupEventStatus.APPROVED, row })
              }
            >
              {t("Approve")}
            </button>
          )}
          {row.status !== GroupEventStatus.REJECTED && (
            <button
              className="px-2 py-1 rounded bg-red-600 text-white text-sm"
              onClick={() =>
                setDecision({ mode: GroupEventStatus.REJECTED, row })
              }
            >
              {t("Reject")}
            </button>
          )}
        </div>
      ),
    },
  ];

  const filters = [
    {
      label: t("Status"),
      isUpperSide: true,
      node: (
        <select
          className="border border-gray-300 rounded px-2 py-1 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value as GroupEventStatus | "")}
        >
          <option value="">{t("All")}</option>
          {Object.values(GroupEventStatus).map((s) => (
            <option key={s} value={s}>
              {t(groupEventStatusLabels[s])}
            </option>
          ))}
        </select>
      ),
    },
    {
      label: t("Show past events"),
      isUpperSide: true,
      node: (
        <input
          type="checkbox"
          checked={showPast}
          onChange={(e) => setShowPast(e.target.checked)}
        />
      ),
    },
  ];

  const isApprove = decision.mode === GroupEventStatus.APPROVED;
  const overCapacity =
    isApprove &&
    decision.row !== null &&
    usedSeats(decision.row) + decision.row.participantCount > CAPACITY;

  const inputs = [
    {
      type: InputTypes.TEXTAREA,
      formKey: "responseNote",
      label: t("Note to the group (sent in the email)"),
      placeholder: t("Optional"),
      required: false,
    },
    ...(overCapacity
      ? [
          {
            type: InputTypes.CHECKBOX,
            formKey: "force",
            label: t("Approve even though it goes over 100 people"),
            required: false,
          },
        ]
      : []),
  ];
  const formKeys = [
    { key: "responseNote", type: FormKeyTypeEnum.STRING },
    ...(overCapacity ? [{ key: "force", type: FormKeyTypeEnum.BOOLEAN }] : []),
  ];

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] my-5 mx-auto">
        <GenericTable
          title={t("Group Events")}
          columns={columns}
          rowKeys={rowKeys as any}
          rows={rows}
          filters={filters}
          isActionsActive={false}
        />
      </div>
      {decision.mode && decision.row && (
        <GenericAddEditPanel
          isOpen
          close={() => setDecision({ mode: null, row: null })}
          inputs={inputs}
          formKeys={formKeys}
          constantValues={{ responseNote: decision.row.responseNote ?? "" }}
          submitItem={(form: any) => {
            if (!decision.row || !decision.mode) return;
            updateStatus({
              id: decision.row._id,
              status: decision.mode,
              responseNote: form?.responseNote || undefined,
              force: Boolean(form?.force) || undefined,
            });
            setDecision({ mode: null, row: null });
          }}
          buttonName={isApprove ? t("Approve") : t("Reject")}
          topClassName="flex flex-col gap-4"
        />
      )}
    </>
  );
}
