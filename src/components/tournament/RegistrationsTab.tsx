import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ConfirmationStatus,
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
  const confirmationLabels: Record<ConfirmationStatus, string> = {
    [ConfirmationStatus.PENDING]: t("Pending"),
    [ConfirmationStatus.CONFIRMED]: t("Confirmed"),
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

// Kontenjanı aşan kaydın yedek numarası (backend'deki waitlistNumber); asilse undefined
const waitlistNumber = (tournament: Tournament, row: TournamentRegistration) =>
  tournament.capacity && row.sequence && row.sequence > tournament.capacity
    ? row.sequence - tournament.capacity
    : undefined;

interface Props {
  tournament: Tournament;
}

const RegistrationsTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const registrations = useGetTournamentRegistrations(tournament._id);
  const participants = useGetTournamentParticipants(tournament._id);
  const { updateConfirmation, admitRegistration } = useTournamentActions();
  const { sourceLabels, confirmationLabels } = useRegistrationLabels();
  const [showFilters, setShowFilters] = useState(false);
  const [rowToAdmit, setRowToAdmit] = useState<TournamentRegistration>();
  const [isAdmitDialogOpen, setIsAdmitDialogOpen] = useState(false);
  const [filterFormElements, setFilterFormElements] = useState<
    Record<string, string>
  >({ source: "", confirmationStatus: "", arrivalStatus: "" });

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
  const placeLabel = (row: TournamentRegistration) => {
    if (!row.sequence) return "-";
    const waitlist = waitlistNumber(tournament, row);
    return waitlist ? t("Waitlist N", { number: waitlist }) : t("Primary");
  };

  const rows = useMemo(() => {
    const filtered = registrations.filter(
      (r) =>
        (!filterFormElements.source ||
          r.source === filterFormElements.source) &&
        (!filterFormElements.confirmationStatus ||
          r.confirmationStatus === filterFormElements.confirmationStatus) &&
        (!filterFormElements.arrivalStatus ||
          arrivalStatusOf(r) === filterFormElements.arrivalStatus)
    );
    // Kafede bekleyenler sırayla alınır: en küçük sıra numarası üstte
    return filterFormElements.arrivalStatus === ArrivalStatus.AT_CAFE
      ? [...filtered].sort((a, b) => (a.sequence ?? 0) - (b.sequence ?? 0))
      : filtered;
  }, [registrations, participants, tournament.status, filterFormElements]);

  const columns = [
    { key: t("Name"), isSortable: true },
    ...(hasCapacity ? [{ key: t("Place"), isSortable: false }] : []),
    { key: t("Arrival"), isSortable: false },
    ...(tournament.hasEntryFee
      ? [{ key: t("Entry Fee"), isSortable: false }]
      : []),
    { key: t("Phone"), isSortable: false },
    { key: t("Email"), isSortable: false },
    { key: t("Source"), isSortable: true },
    { key: t("Confirmation"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    { key: "fullName" },
    ...(hasCapacity
      ? [
          {
            key: "sequence",
            node: (row: TournamentRegistration) => placeLabel(row),
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
        label: t("Confirmation"),
        options: Object.entries(confirmationLabels).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Confirmation"),
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
    ],
    formElements: filterFormElements,
    setFormElements: setFilterFormElements,
    closeFilters: () => setShowFilters(false),
  };

  const filters = [
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
