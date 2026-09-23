import { useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import {
  ConfirmationStatus,
  Tournament,
  TournamentParticipant,
  TournamentStatus,
} from "../../types/tournament";
import {
  useGetTournamentParticipants,
  useGetTournamentRegistrations,
  useTournamentActions,
} from "../../utils/api/tournament";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { GenericButton } from "../common/GenericButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import PromoteRegistrationsModal from "./PromoteRegistrationsModal";

interface Props {
  tournament: Tournament;
}

const ParticipantsTab = ({ tournament }: Props) => {
  const { t } = useTranslation();
  const participants = useGetTournamentParticipants(tournament._id);
  const registrations = useGetTournamentRegistrations(tournament._id);
  const { addParticipant, removeParticipant } = useTournamentActions();

  const [rowToAction, setRowToAction] = useState<TournamentParticipant>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPromoteModalOpen, setIsPromoteModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isFinished = tournament.status === TournamentStatus.FINISHED;
  const promotedIds = new Set(participants.map((p) => p.registrationId));
  const promotable = registrations.filter((r) => !promotedIds.has(r._id));

  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Added From"), isSortable: false },
    { key: t("Status"), isSortable: false },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    { key: "name" },
    {
      key: "registrationId",
      node: (row: TournamentParticipant) =>
        row.registrationId ? t("Registration") : t("Added Manually"),
    },
    {
      key: "isActive",
      node: (row: TournamentParticipant) =>
        row.isActive ? t("Active") : t("Withdrawn"),
    },
  ];

  const addButton = {
    name: t("Add Participant"),
    isModal: true,
    isDisabled: isFinished,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={[
          {
            type: InputTypes.TEXT,
            formKey: "name",
            label: t("Name"),
            placeholder: t("Name"),
            required: true,
          },
        ]}
        formKeys={[{ key: "name", type: FormKeyTypeEnum.STRING }]}
        nonImageInputsClassName="grid grid-cols-1 gap-4"
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

  const filters = [
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
  ];

  return (
    <>
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={participants}
        actions={actions}
        isActionsActive={true}
        title={`${t("Participants")} (${
          participants.filter((p) => p.isActive).length
        })`}
        addButton={addButton}
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
    </>
  );
};

export default ParticipantsTab;
