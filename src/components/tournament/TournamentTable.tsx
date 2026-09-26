import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { MdContentCopy, MdPrint } from "react-icons/md";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import {
  RegistrationSource,
  Tournament,
  TournamentFormat,
  TournamentStatus,
} from "../../types/tournament";
import { UpdatePayload } from "../../utils/api";
import {
  useGetTournaments,
  useTournamentMutations,
} from "../../utils/api/tournament";
import { printQrCode } from "../../utils/printQrCode";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import {
  DEFAULT_FORM_VALUES,
  RULE_KEYS,
  toFormValues,
  toPayload,
  TOURNAMENT_FORM_KEYS,
  useTournamentFormInputs,
} from "./useTournamentForm";

const registrationUrl = (slug: string, source: RegistrationSource) =>
  `${window.location.origin}/tournament/${slug}?source=${source}`;

interface Props {
  onSelectTournament: (tournament: Tournament) => void;
}

const TournamentTable = ({ onSelectTournament }: Props) => {
  const { t } = useTranslation();
  const tournaments = useGetTournaments();
  const { games } = useDataContext();
  const { createTournament, updateTournament, deleteTournament } =
    useTournamentMutations();

  const [rowToAction, setRowToAction] = useState<Tournament>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addForm, setAddForm] = useState<object>(DEFAULT_FORM_VALUES);
  const [editForm, setEditForm] = useState<object>();

  const isRuleLocked =
    isEditModalOpen && rowToAction?.status !== TournamentStatus.NOT_STARTED;

  const formatLabels: Record<TournamentFormat, string> = {
    [TournamentFormat.LEAGUE_THEN_ELIMINATION]: t("Point Rounds + Final"),
    [TournamentFormat.ELIMINATION]: t("Elimination"),
    [TournamentFormat.LEAGUE]: t("Point Rounds"),
  };
  const statusLabels: Record<TournamentStatus, string> = {
    [TournamentStatus.NOT_STARTED]: t("Not Started"),
    [TournamentStatus.ONGOING]: t("Ongoing"),
    [TournamentStatus.FINISHED]: t("Finished"),
  };

  const addInputs = useTournamentFormInputs(addForm, false);
  const editInputs = useTournamentFormInputs(
    editForm ?? (rowToAction ? toFormValues(rowToAction) : DEFAULT_FORM_VALUES),
    isRuleLocked
  );

  const copyLink = (slug: string, source: RegistrationSource) => {
    navigator.clipboard
      .writeText(registrationUrl(slug, source))
      .then(() => toast.success(t("Link copied")));
  };

  const columns = [
    { key: t("Tournament Name"), isSortable: true },
    { key: t("Tournament Date"), isSortable: true },
    { key: t("Game"), isSortable: false },
    { key: t("Format"), isSortable: false },
    { key: t("Status"), isSortable: false },
    { key: t("Registration Open"), isSortable: false },
    { key: t("Registration Links"), isSortable: false },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    {
      key: "name",
      node: (row: Tournament) => (
        <button
          className="text-left font-medium hover:text-blue-600 transition-colors"
          onClick={() => onSelectTournament(row)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "date",
      node: (row: Tournament) => format(new Date(row.date), "dd/MM/yyyy"),
    },
    {
      key: "game",
      node: (row: Tournament) =>
        games?.find((game) => game._id === row.game)?.name ?? "-",
    },
    {
      key: "format",
      node: (row: Tournament) => formatLabels[row.format],
    },
    {
      key: "status",
      node: (row: Tournament) => statusLabels[row.status],
    },
    {
      key: "isRegistrationOpen",
      node: (row: Tournament) => (
        <SwitchButton
          checked={row.isRegistrationOpen}
          onChange={() =>
            updateTournament({
              id: row._id,
              updates: { isRegistrationOpen: !row.isRegistrationOpen },
            })
          }
        />
      ),
    },
    {
      key: "slug",
      node: (row: Tournament) => (
        <div className="flex items-center gap-3 text-sm">
          <button
            title={t("Copy QR Link")}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
            onClick={() => copyLink(row.slug, RegistrationSource.QR)}
          >
            <MdContentCopy /> QR
          </button>
          <button
            title={t("Copy Social Media Link")}
            className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
            onClick={() => copyLink(row.slug, RegistrationSource.SOCIAL)}
          >
            <MdContentCopy /> {t("Social Media")}
          </button>
          <button
            title={t("Print QR Code")}
            className="text-gray-500 hover:text-gray-800 text-lg"
            onClick={() =>
              printQrCode({
                url: registrationUrl(row.slug, RegistrationSource.QR),
                eventName: row.name,
              })
            }
          >
            <MdPrint />
          </button>
        </div>
      ),
    },
  ];

  const addButton = {
    name: t("New Tournament"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => {
          setIsAddModalOpen(false);
          setAddForm(DEFAULT_FORM_VALUES);
        }}
        setForm={setAddForm}
        inputs={addInputs}
        formKeys={TOURNAMENT_FORM_KEYS}
        submitItem={(item: Tournament | UpdatePayload<Tournament>) =>
          createTournament(toPayload(item) as Partial<Tournament>)
        }
        constantValues={DEFAULT_FORM_VALUES}
        topClassName="flex flex-col gap-2"
        generalClassName="overflow-scroll min-w-[90%] min-h-[95%]"
        nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };

  const handleUpdate = (item: Tournament | UpdatePayload<Tournament>) => {
    const { id, updates } = item as UpdatePayload<Tournament>;
    const payload = toPayload(updates, null);
    if (isRuleLocked) RULE_KEYS.forEach((key) => delete payload[key]);
    updateTournament({ id, updates: payload as Partial<Tournament> });
  };

  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          close={() => setIsDeleteDialogOpen(false)}
          confirm={() => {
            deleteTournament(rowToAction._id);
            setIsDeleteDialogOpen(false);
          }}
          title={t("Delete Tournament")}
          text={`"${rowToAction.name}" ${t("GeneralDeleteMessage")}`}
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
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => {
            setIsEditModalOpen(false);
            setEditForm(undefined);
          }}
          setForm={setEditForm}
          inputs={editInputs}
          formKeys={TOURNAMENT_FORM_KEYS}
          submitItem={handleUpdate}
          isEditMode={true}
          itemToEdit={{
            id: rowToAction._id,
            updates: toFormValues(rowToAction) as unknown as Tournament,
          }}
          topClassName="flex flex-col gap-2"
          generalClassName="overflow-scroll min-w-[90%] min-h-[95%]"
          nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];

  return (
    <GenericTable
      rowKeys={rowKeys}
      actions={actions}
      columns={columns}
      isActionsActive={true}
      rows={tournaments.filter(Boolean)}
      title={t("Tournaments")}
      addButton={addButton}
    />
  );
};

export default TournamentTable;
