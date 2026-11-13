import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ConfirmationStatus,
  DeclineSource,
  ListPosition,
  ListStatus,
  RegistrationSource,
  Tournament,
  TournamentRegistration,
  TournamentStatus,
} from "../../types/tournament";
import {
  useGetTournamentParticipants,
  useGetTournamentRegistrations,
  useTournamentActions,
} from "../../utils/api/tournament";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { GenericButton } from "../common/GenericButton";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

export const useRegistrationLabels = () => {
  const { t } = useTranslation();
  const sourceLabels: Record<RegistrationSource, string> = {
    [RegistrationSource.QR]: "QR",
    [RegistrationSource.SOCIAL]: t("Social Media"),
    [RegistrationSource.OTHER]: t("Unknown"),
  };
  // Görevlinin WhatsApp/telefonla aramasının sonucu
  const confirmationLabels: Record<ConfirmationStatus, string> = {
    [ConfirmationStatus.PENDING]: t("Not Called"),
    [ConfirmationStatus.CONFIRMED]: t("Will Come"),
    [ConfirmationStatus.DECLINED]: t("Not Coming"),
    [ConfirmationStatus.UNREACHABLE]: t("Unreachable"),
  };
  return { sourceLabels, confirmationLabels };
};

// Turnuva günü durumu saklanmaz; katılımcı listesi, geliş saati ve turnuva durumundan çıkar
enum ArrivalStatus {
  JOINED = "joined",
  AT_CAFE = "atCafe",
  EXPECTED = "expected",
  NO_SHOW = "noShow",
}

// Sıra sütununun sıralama değeri: önce asiller (kayıt sırasıyla), sonra yedekler (yedek numarasıyla)
const WAITLIST_ORDER_BASE = 1_000_000;
const placeOrderOf = (row: TournamentRegistration) => {
  if (row.position?.listStatus === ListStatus.MAIN) return row.sequence ?? 0;
  if (row.position?.listStatus === ListStatus.WAITLIST)
    return WAITLIST_ORDER_BASE + (row.position.waitlist ?? 0);
  return 2 * WAITLIST_ORDER_BASE;
};

const isSamePosition = (a?: ListPosition, b?: ListPosition) =>
  a?.listStatus === b?.listStatus && a?.waitlist === b?.waitlist;

// Bekleyen değişiklik: liste güncellenince bu başvurunun yeri değişecek
const hasPendingChange = (row: TournamentRegistration) =>
  !!row.nextPosition && !isSamePosition(row.position, row.nextPosition);

interface Props {
  tournament: Tournament;
}

const RegistrationsTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const registrations = useGetTournamentRegistrations(tournament._id);
  const participants = useGetTournamentParticipants(tournament._id);
  const {
    updateConfirmation,
    admitRegistration,
    setManualMain,
    publishWaitlist,
    isPublishingWaitlist,
  } = useTournamentActions();
  const { sourceLabels, confirmationLabels } = useRegistrationLabels();
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAdmit, setRowToAdmit] = useState<TournamentRegistration>();
  const [isAdmitDialogOpen, setIsAdmitDialogOpen] = useState(false);
  const [rowToMakeMain, setRowToMakeMain] = useState<TournamentRegistration>();
  const [isMakeMainDialogOpen, setIsMakeMainDialogOpen] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [filterFormElements, setFilterFormElements] = useState<
    Record<string, string>
  >({
    source: "",
    confirmationStatus: "",
    arrivalStatus: "",
    listStatus: "",
    pendingChange: "",
  });

  const hasCapacity = Boolean(tournament.capacity);
  const joinedIds = new Set(participants.map((p) => p.registrationId));
  const arrivalStatusOf = (row: TournamentRegistration) => {
    if (joinedIds.has(row._id)) return ArrivalStatus.JOINED;
    if (row.arrivedAt) return ArrivalStatus.AT_CAFE;
    return tournament.status === TournamentStatus.NOT_STARTED
      ? ArrivalStatus.EXPECTED
      : ArrivalStatus.NO_SHOW;
  };
  const arrivalLabels: Record<ArrivalStatus, string> = {
    [ArrivalStatus.JOINED]: t("Joined"),
    [ArrivalStatus.AT_CAFE]: t("At Cafe"),
    [ArrivalStatus.EXPECTED]: t("Expected"),
    [ArrivalStatus.NO_SHOW]: t("Did Not Come"),
  };
  const positionLabel = (position?: ListPosition) => {
    if (position?.listStatus === ListStatus.MAIN) return t("Primary");
    if (position?.listStatus === ListStatus.WAITLIST)
      return t("Waitlist N", { number: position.waitlist });
    if (position?.listStatus === ListStatus.WITHDRAWN) return t("Not Coming");
    return "-";
  };
  const placeLabel = (row: TournamentRegistration) =>
    positionLabel(row.position);
  const declineSourceLabels: Record<DeclineSource, string> = {
    [DeclineSource.LINK]: t("Via Link"),
    [DeclineSource.PANEL]: t("Via Panel"),
  };

  const isDeclined = (row: TournamentRegistration) =>
    row.confirmationStatus === ConfirmationStatus.DECLINED;
  // Elle asil yapılan boş yeri alır: asile geçmek üzere olan son yedek yedekte kalır; boş yer
  // yoksa asil sayısı kontenjanı aşar
  const makeMainWarning = (row: TournamentRegistration) => {
    // Zaten asile geçecekse kimse yedekte kalmaz, kontenjan da aşılmaz
    if (row.nextPosition?.listStatus === ListStatus.MAIN) return "";
    const bumped = registrations
      .filter(
        (r) =>
          r._id !== row._id &&
          r.position?.listStatus === ListStatus.WAITLIST &&
          r.nextPosition?.listStatus === ListStatus.MAIN &&
          !r.isManualMain
      )
      .sort(
        (a, b) => (b.position?.waitlist ?? 0) - (a.position?.waitlist ?? 0)
      )[0];
    if (bumped)
      return t("MakeMainBumpsMessage", {
        name: bumped.fullName,
        place: placeLabel(bumped),
      });
    const mainCount =
      registrations.filter(
        (r) => r.nextPosition?.listStatus === ListStatus.MAIN
      ).length + 1;
    return mainCount > (tournament.capacity ?? 0)
      ? t("MakeMainOverCapacityMessage", {
          count: mainCount,
          capacity: tournament.capacity,
        })
      : "";
  };
  const pendingRows = registrations.filter(hasPendingChange);
  const listStatusLabels: Record<ListStatus, string> = {
    [ListStatus.MAIN]: t("Primary"),
    [ListStatus.WAITLIST]: t("Waitlist"),
    [ListStatus.WITHDRAWN]: t("Not Coming"),
  };
  // Asil/Yedek Sıra sütunundaki gibi bildirilen yere bakar; vazgeçenler yalnızca "Gelmeyecek"te çıkar
  const matchesListStatus = (row: TournamentRegistration) => {
    const wanted = filterFormElements.listStatus;
    if (!wanted) return true;
    const isWithdrawn =
      isDeclined(row) || row.position?.listStatus === ListStatus.WITHDRAWN;
    return wanted === ListStatus.WITHDRAWN
      ? isWithdrawn
      : !isWithdrawn && row.position?.listStatus === wanted;
  };
  const promotedNames = pendingRows
    .filter((r) => r.nextPosition?.listStatus === ListStatus.MAIN)
    .map((r) => r.fullName);
  const mailCount = pendingRows.filter(
    (r) => r.nextPosition?.listStatus !== ListStatus.WITHDRAWN
  ).length;

  const rows = useMemo(() => {
    const filtered = registrations.filter(
      (r) =>
        (!filterFormElements.source ||
          r.source === filterFormElements.source) &&
        (!filterFormElements.confirmationStatus ||
          r.confirmationStatus === filterFormElements.confirmationStatus) &&
        (!filterFormElements.arrivalStatus ||
          arrivalStatusOf(r) === filterFormElements.arrivalStatus) &&
        matchesListStatus(r) &&
        (!filterFormElements.pendingChange ||
          hasPendingChange(r) === (filterFormElements.pendingChange === "true"))
    );
    // Kafede bekleyenler sırayla alınır: asiller, sonra en küçük yedek numarası üstte
    const ordered =
      filterFormElements.arrivalStatus === ArrivalStatus.AT_CAFE
        ? [...filtered].sort(
            (a, b) => (a.position?.waitlist ?? 0) - (b.position?.waitlist ?? 0)
          )
        : filtered;
    return ordered.map((r) => ({ ...r, placeOrder: placeOrderOf(r) }));
  }, [registrations, participants, tournament.status, filterFormElements]);

  const columns = [
    { key: t("Name"), isSortable: true },
    ...(hasCapacity ? [{ key: t("Place"), isSortable: true }] : []),
    { key: t("Arrival"), isSortable: false },
    ...(tournament.hasEntryFee
      ? [{ key: t("Entry Fee"), isSortable: false }]
      : []),
    { key: t("Phone"), isSortable: false },
    { key: t("Email"), isSortable: false },
    { key: t("Source"), isSortable: true },
    { key: t("Call Status"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    { key: "fullName" },
    ...(hasCapacity
      ? [
          {
            key: "placeOrder",
            node: (row: TournamentRegistration) => (
              <span className="whitespace-nowrap">
                {placeLabel(row)}
                {hasPendingChange(row) && (
                  <span
                    className="ml-1 text-amber-600"
                    title={t("Applies when the waitlist is updated")}
                  >
                    → {positionLabel(row.nextPosition)}
                  </span>
                )}
                {row.isManualMain && (
                  <button
                    type="button"
                    className="ml-2 text-xs text-gray-500 underline"
                    onClick={() =>
                      setManualMain({
                        tournamentId: tournament._id,
                        registrationId: row._id,
                        isManualMain: false,
                      })
                    }
                  >
                    {t("Undo")}
                  </button>
                )}
              </span>
            ),
          },
        ]
      : []),
    {
      key: "arrivedAt",
      node: (row: TournamentRegistration) =>
        arrivalLabels[arrivalStatusOf(row)],
    },
    ...(tournament.hasEntryFee
      ? [
          {
            key: "isPaid",
            node: (row: TournamentRegistration) =>
              joinedIds.has(row._id)
                ? row.isPaid
                  ? t("Fee Paid")
                  : t("Fee Not Paid")
                : "-",
          },
        ]
      : []),
    { key: "phone" },
    { key: "email", node: (row: TournamentRegistration) => row.email ?? "-" },
    {
      key: "source",
      node: (row: TournamentRegistration) => sourceLabels[row.source],
    },
    {
      key: "confirmationStatus",
      node: (row: TournamentRegistration) => (
        <div className="flex flex-col items-start gap-0.5">
          <select
            className="border rounded px-2 py-1 text-sm"
            value={row.confirmationStatus}
            onChange={(e) =>
              updateConfirmation({
                registrationId: row._id,
                confirmationStatus: e.target.value as ConfirmationStatus,
              })
            }
          >
            {Object.entries(confirmationLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {isDeclined(row) && row.declineSource && (
            <span className="text-xs text-gray-500">
              {declineSourceLabels[row.declineSource]}
            </span>
          )}
        </div>
      ),
    },
  ];

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: [
      {
        type: InputTypes.SELECT,
        formKey: "source",
        label: t("Source"),
        options: Object.entries(sourceLabels).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Source"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "confirmationStatus",
        label: t("Call Status"),
        options: Object.entries(confirmationLabels).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Call Status"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "arrivalStatus",
        label: t("Arrival"),
        options: Object.entries(arrivalLabels).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Arrival"),
        required: false,
      },
      ...(hasCapacity
        ? [
            {
              type: InputTypes.SELECT,
              formKey: "listStatus",
              label: t("List"),
              options: Object.entries(listStatusLabels).map(
                ([value, label]) => ({ value, label })
              ),
              placeholder: t("List"),
              required: false,
            },
            {
              type: InputTypes.SELECT,
              formKey: "pendingChange",
              label: t("Pending Change"),
              options: [
                { value: "true", label: t("Yes") },
                { value: "false", label: t("No") },
              ],
              placeholder: t("Pending Change"),
              required: false,
            },
          ]
        : []),
    ],
    formElements: filterFormElements,
    setFormElements: setFilterFormElements,
    closeFilters: () => setShowFilters(false),
  };

  const filters = [
    ...(hasCapacity
      ? [
          {
            isUpperSide: true,
            node: (
              <GenericButton
                variant="primary"
                size="sm"
                disabled={!pendingRows.length}
                isLoading={isPublishingWaitlist}
                onClick={() => setIsPublishDialogOpen(true)}
              >
                {t("Update Waitlist")}
              </GenericButton>
            ),
          },
        ]
      : []),
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showFilters}
          onChange={() => setShowFilters(!showFilters)}
        />
      ),
    },
  ];

  // Kafede bekleyen (yedek ya da ödeme bekleyen asil) tek tek katılımcı yapılır
  const admitLabel = tournament.hasEntryFee
    ? t("Take Fee And Add Participant")
    : t("Add As Participant");
  const actions = [
    ...(hasCapacity
      ? [
          {
            name: t("Make Main"),
            isButton: true,
            setRow: setRowToMakeMain,
            isDisabled: (row: TournamentRegistration) =>
              row.position?.listStatus !== ListStatus.WAITLIST ||
              !!row.isManualMain ||
              isDeclined(row) ||
              tournament.status !== TournamentStatus.NOT_STARTED,
            modal: rowToMakeMain ? (
              <ConfirmationDialog
                isOpen={isMakeMainDialogOpen}
                close={() => setIsMakeMainDialogOpen(false)}
                confirm={() => {
                  setManualMain({
                    tournamentId: tournament._id,
                    registrationId: rowToMakeMain._id,
                    isManualMain: true,
                  });
                  setIsMakeMainDialogOpen(false);
                }}
                title={t("Make Main")}
                text={[
                  t("MakeMainMessage", { name: rowToMakeMain.fullName }),
                  makeMainWarning(rowToMakeMain),
                ].join(" ")}
              />
            ) : null,
            isModal: true,
            isModalOpen: isMakeMainDialogOpen,
            setIsModal: setIsMakeMainDialogOpen,
            isPath: false,
          },
        ]
      : []),
    {
      name: admitLabel,
      isButton: true,
      setRow: setRowToAdmit,
      isDisabled: (row: TournamentRegistration) =>
        arrivalStatusOf(row) !== ArrivalStatus.AT_CAFE ||
        tournament.status === TournamentStatus.FINISHED,
      modal: rowToAdmit ? (
        <ConfirmationDialog
          isOpen={isAdmitDialogOpen}
          close={() => setIsAdmitDialogOpen(false)}
          confirm={() => {
            admitRegistration({
              tournamentId: tournament._id,
              registrationId: rowToAdmit._id,
            }).catch(() => undefined); // hata toast'ı mutation'ın onError'ında
            setIsAdmitDialogOpen(false);
          }}
          title={admitLabel}
          text={t(
            tournament.hasEntryFee
              ? "AdmitWithFeeMessage"
              : "AdmitParticipantMessage",
            { name: rowToAdmit.fullName, place: placeLabel(rowToAdmit) }
          )}
        />
      ) : null,
      isModal: true,
      isModalOpen: isAdmitDialogOpen,
      setIsModal: setIsAdmitDialogOpen,
      isPath: false,
    },
  ];

  return (
    <div className="w-[95%] mx-auto my-4">
      <ConfirmationDialog
        isOpen={isPublishDialogOpen}
        close={() => setIsPublishDialogOpen(false)}
        confirm={() => {
          publishWaitlist(tournament._id);
          setIsPublishDialogOpen(false);
        }}
        title={t("Update Waitlist")}
        text={t("PublishWaitlistMessage", {
          promoted: promotedNames.join(", ") || "-",
          updated: mailCount - promotedNames.length,
          mails: mailCount,
        })}
      />
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows}
        actions={actions}
        isActionsActive={true}
        title={t("Registrations")}
        filterPanel={filterPanel}
        filters={filters}
      />
    </div>
  );
};

export default RegistrationsTab;
