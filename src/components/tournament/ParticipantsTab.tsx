import { Suspense, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  ConfirmationStatus,
  ListStatus,
  PairingMode,
  Tournament,
  TournamentCheckIn,
  TournamentParticipant,
  TournamentStatus,
} from "../../types/tournament";
import {
  useGetTournamentParticipants,
  useGetTournamentRegistrations,
  useTournamentActions,
} from "../../utils/api/tournament";
import { lazyWithReload } from "../../utils/lazyWithReload";
import { normalizeText } from "../../utils/slug";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { GenericButton } from "../common/GenericButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import PromoteRegistrationsModal from "./PromoteRegistrationsModal";
import { useRegistrationLabels } from "./RegistrationsTab";

// QR okuyucu (zxing) sadece açıldığında yüklenir
const QrScannerModal = lazyWithReload(() =>
  import("../tables/QrScannerModal").then((m) => ({
    default: m.QrScannerModal,
  }))
);

// Başvurudan gelmeyen katılımcılar kaynak filtresinde bu değerle seçilir
const MANUAL_SOURCE = "manual";

// Adı ve soyadı aynı olanlar (ortadaki isim farklı olsa da) aynı kişi olabilir
const nameKey = (name: string) => {
  const words = normalizeText(name).trim().split(/\s+/);
  return `${words[0]} ${words[words.length - 1]}`;
};

interface Props {
  tournament: Tournament;
}

const ParticipantsTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const participants = useGetTournamentParticipants(tournament._id);
  const registrations = useGetTournamentRegistrations(tournament._id);
  const {
    addParticipant,
    removeParticipant,
    updateParticipant,
    checkIn,
    admitRegistration,
  } = useTournamentActions();
  const { sourceLabels } = useRegistrationLabels();

  const [rowToAction, setRowToAction] = useState<TournamentParticipant>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  // Ücretli turnuvada QR'ı okutulan, ödemesi alınınca katılımcı olacak asil
  const [awaitingPayment, setAwaitingPayment] = useState<TournamentCheckIn>();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({ name: "" });
  const [showFilters, setShowFilters] = useState(false);
  const [filterFormElements, setFilterFormElements] = useState<
    Record<string, string>
  >({ source: "", isActive: "", isPaid: "" });

  const isFinished = tournament.status === TournamentStatus.FINISHED;
  const isCatanPlan = tournament.pairingMode === PairingMode.CATAN_PLAN;
  const promotedIds = new Set(participants.map((p) => p.registrationId));
  const promotable = registrations.filter((r) => !promotedIds.has(r._id));

  const sourceOptions: Record<string, string> = {
    ...sourceLabels,
    [MANUAL_SOURCE]: t("Added Manually"),
  };
  const statusOptions: Record<string, string> = {
    true: t("Active"),
    false: t("Withdrawn"),
  };
  const similar = addForm.name.trim()
    ? participants.find((p) => nameKey(p.name) === nameKey(addForm.name))
    : undefined;
  const registrationOf = (participant: TournamentParticipant) =>
    registrations.find((r) => r._id === participant.registrationId);
  const sourceOf = (participant: TournamentParticipant) =>
    registrationOf(participant)?.source ?? MANUAL_SOURCE;
  // Ödeme bilgisi başvuruda tutulur; elle eklenen katılımcının ödeme kaydı yoktur
  const feeOptions: Record<string, string> = {
    true: t("Fee Paid"),
    false: t("Fee Not Paid"),
  };
  const feeStatusOf = (participant: TournamentParticipant) => {
    const registration = registrationOf(participant);
    return registration && String(!!registration.isPaid);
  };

  const rows = useMemo(
    () =>
      participants.filter(
        (p) =>
          (!filterFormElements.source ||
            sourceOf(p) === filterFormElements.source) &&
          (!filterFormElements.isActive ||
            String(p.isActive) === filterFormElements.isActive) &&
          (!filterFormElements.isPaid ||
            feeStatusOf(p) === filterFormElements.isPaid)
      ),
    [participants, registrations, filterFormElements]
  );

  const columns = [
    { key: t("Name"), isSortable: true },
    ...(isCatanPlan
      ? [
          { key: t("Draw Number"), isSortable: true },
          { key: t("Plan Schedule"), isSortable: false },
        ]
      : []),
    { key: t("Added From"), isSortable: false },
    ...(tournament.hasEntryFee
      ? [{ key: t("Entry Fee"), isSortable: false }]
      : []),
    { key: t("Status"), isSortable: false },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    { key: "name" },
    ...(isCatanPlan
      ? [
          { key: "drawNumber" },
          {
            key: "schedule",
            node: (row: TournamentParticipant) =>
              row.schedule
                ?.map(
                  (slot) =>
                    `${slot.round}: ${t("Table")} ${slot.tableNo} / ${t(
                      "Seat N",
                      { seat: slot.seat }
                    )}`
                )
                .join(" · ") ?? "-",
          },
        ]
      : []),
    {
      key: "registrationId",
      node: (row: TournamentParticipant) => sourceOptions[sourceOf(row)],
    },
    ...(tournament.hasEntryFee
      ? [
          {
            key: "isPaid",
            node: (row: TournamentParticipant) => {
              const status = feeStatusOf(row);
              return status ? feeOptions[status] : "-";
            },
          },
        ]
      : []),
    {
      key: "isActive",
      node: (row: TournamentParticipant) =>
        row.isActive ? (
          t("Active")
        ) : (
          <div className="flex items-center gap-2">
            {t("Withdrawn")}
            {!isFinished && (
              <GenericButton
                size="sm"
                variant="outline"
                onClick={() =>
                  updateParticipant({
                    id: row._id,
                    updates: { isActive: true },
                  })
                }
              >
                {t("Undo")}
              </GenericButton>
            )}
          </div>
        ),
    },
  ];

  const nameInput = {
    type: InputTypes.TEXT,
    formKey: "name",
    label: t("Name"),
    placeholder: t("Name"),
    required: true,
  };
  const nameFormKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];

  const addButton = {
    name: t("Add Participant"),
    isModal: true,
    isDisabled: isFinished,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={[nameInput]}
        formKeys={nameFormKeys}
        nonImageInputsClassName="grid grid-cols-1 gap-4"
        setForm={setAddForm}
        isConfirmationDialogRequired={() => !!similar}
        confirmationDialogHeader={t("Similar Name")}
        confirmationDialogText={t("SimilarNameMessage", {
          name: similar?.name,
        })}
        submitItem={(item) =>
          addParticipant({
            tournamentId: tournament._id,
            name: (item as { name: string }).name,
          })
        }
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: [
      {
        type: InputTypes.SELECT,
        formKey: "source",
        label: t("Added From"),
        options: Object.entries(sourceOptions).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Added From"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "isActive",
        label: t("Status"),
        options: Object.entries(statusOptions).map(([value, label]) => ({
          value,
          label,
        })),
        placeholder: t("Status"),
        required: false,
      },
      ...(tournament.hasEntryFee
        ? [
            {
              type: InputTypes.SELECT,
              formKey: "isPaid",
              label: t("Entry Fee"),
              options: Object.entries(feeOptions).map(([value, label]) => ({
                value,
                label,
              })),
              placeholder: t("Entry Fee"),
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
    {
      isUpperSide: true,
      isDisabled: isFinished,
      node: (
        <GenericButton
          variant="success"
          size="sm"
          disabled={promotable.length === 0}
          onClick={() => setIsPromoteModalOpen(true)}
        >
          {t("Take Participants From Registrations")}
        </GenericButton>
      ),
    },
    {
      isUpperSide: true,
      isDisabled: isFinished,
      node: (
        <GenericButton
          variant="primary"
          size="sm"
          onClick={() => setIsScannerOpen(true)}
        >
          {t("Check In With QR")}
        </GenericButton>
      ),
    },
  ];

  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      isDisabled: (row: TournamentParticipant) => !row.isActive || isFinished,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          close={() => setIsDeleteDialogOpen(false)}
          confirm={() => {
            removeParticipant(rowToAction._id);
            setIsDeleteDialogOpen(false);
          }}
          title={t("Remove Participant")}
          text={t("RemoveParticipantMessage", { name: rowToAction.name })}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isDeleteDialogOpen,
      setIsModal: setIsDeleteDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel<Partial<TournamentParticipant>>
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={[nameInput]}
          formKeys={nameFormKeys}
          submitItem={(item) => {
            if ("updates" in item) updateParticipant(item);
          }}
          isEditMode
          topClassName="flex flex-col gap-2"
          itemToEdit={{
            id: rowToAction._id,
            updates: { name: rowToAction.name },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
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
        title={`${t("Participants")} (${
          participants.filter((p) => p.isActive).length
        })`}
        addButton={addButton}
        filterPanel={filterPanel}
        filters={filters}
      />
      {isPromoteModalOpen && (
        <PromoteRegistrationsModal
          tournamentId={tournament._id}
          registrations={promotable}
          initiallySelected={promotable
            .filter(
              (r) => r.confirmationStatus === ConfirmationStatus.CONFIRMED
            )
            .map((r) => r._id)}
          close={() => setIsPromoteModalOpen(false)}
        />
      )}
      {isScannerOpen && (
        <Suspense fallback={null}>
          <QrScannerModal
            isOpen={isScannerOpen}
            close={() => {
              setIsScannerOpen(false);
              setAwaitingPayment(undefined);
            }}
            onScan={async (code) => {
              const result = await checkIn({
                tournamentId: tournament._id,
                code,
              });
              setAwaitingPayment(
                result.hasEntryFee &&
                  !result.isParticipant &&
                  result.listStatus !== ListStatus.WITHDRAWN &&
                  !result.waitlistNumber
                  ? result
                  : undefined
              );
            }}
            title={t("Check In With QR")}
            hint={t("Scan the QR on the player's phone")}
            footer={
              awaitingPayment && (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                  <p className="text-sm text-gray-800">
                    <span className="font-semibold">
                      {awaitingPayment.fullName}
                    </span>
                    {` · ${t("Primary")} · ${t("Entry fee not paid")}`}
                  </p>
                  <GenericButton
                    variant="success"
                    size="sm"
                    onClick={
                      () =>
                        admitRegistration({
                          tournamentId: tournament._id,
                          registrationId: awaitingPayment.registrationId,
                        })
                          .then(() => setAwaitingPayment(undefined))
                          .catch(() => undefined) // hata toast'ı mutation'ın onError'ında
                    }
                  >
                    {t("Fee Paid")}
                  </GenericButton>
                </div>
              )
            }
          />
        </Suspense>
      )}
    </div>
  );
};

export default ParticipantsTab;
