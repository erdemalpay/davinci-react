import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { MdContentCopy, MdPrint } from "react-icons/md";
import { toast } from "react-toastify";
import { useDataContext } from "../../context/Data.context";
import {
  PairingMode,
  RegistrationSource,
  Tournament,
  TournamentFormat,
  TournamentStatus,
} from "../../types/tournament";
import { UpdatePayload } from "../../utils/api";
import { useGetStoreLocations } from "../../utils/api/location";
import {
  useGetTournaments,
  useTournamentMutations,
} from "../../utils/api/tournament";
import { printQrCode } from "../../utils/printQrCode";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

// Turnuva başladıktan sonra backend bu alanların değişmesine izin vermez
const RULE_KEYS = [
  "format",
  "pairingMode",
  "tableSize",
  "minTableSize",
  "leagueRounds",
  "placementPoints",
  "byePoints",
  "advanceCount",
  "advancePerTable",
];

const registrationUrl = (slug: string, source: RegistrationSource) =>
  `${window.location.origin}/tournament/${slug}?source=${source}`;

// Formdaki boş alanları ayıklar (düzenlemede null gönderilir ki alan temizlensin)
// ve "4,2,1,0" olarak girilen puanları diziye çevirir.
const toPayload = (
  item: object,
  emptyValue?: null
): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};
  Object.entries(item).forEach(([key, value]) => {
    const isEmpty = value === "" || value === null || value === undefined;
    if (!isEmpty) payload[key] = value;
    else if (emptyValue === null) payload[key] = null;
  });
  payload.placementPoints = String(payload.placementPoints ?? "")
    .split(",")
    .map((p) => Number(p.trim()))
    .filter((p) => !Number.isNaN(p));
  return payload;
};

interface Props {
  onSelectTournament: (tournament: Tournament) => void;
}

const TournamentTable = ({ onSelectTournament }: Props) => {
  const { t } = useTranslation();
  const tournaments = useGetTournaments();
  const { games } = useDataContext();
  const locations = useGetStoreLocations();
  const { createTournament, updateTournament, deleteTournament } =
    useTournamentMutations();

  const [rowToAction, setRowToAction] = useState<Tournament>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const isRuleLocked =
    isEditModalOpen && rowToAction?.status !== TournamentStatus.NOT_STARTED;

  const formatLabels: Record<TournamentFormat, string> = {
    [TournamentFormat.LEAGUE_THEN_ELIMINATION]: t("League + Elimination"),
    [TournamentFormat.ELIMINATION]: t("Direct Elimination"),
  };
  const pairingLabels: Record<PairingMode, string> = {
    [PairingMode.SWISS]: t("Swiss"),
    [PairingMode.RANDOM]: t("Random"),
  };
  const statusLabels: Record<TournamentStatus, string> = {
    [TournamentStatus.NOT_STARTED]: t("Not Started"),
    [TournamentStatus.ONGOING]: t("Ongoing"),
    [TournamentStatus.FINISHED]: t("Finished"),
  };

  const ruleInput = <T extends object>(input: T) => ({
    ...input,
    isDisabled: isRuleLocked,
  });

  const inputs = [
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
    ruleInput({
      type: InputTypes.SELECT,
      formKey: "format",
      label: t("Format"),
      options: Object.entries(formatLabels).map(([value, label]) => ({
        value,
        label,
      })),
      placeholder: t("Format"),
      required: true,
      helperText: t("TournamentFormatHelp"),
    }),
    ruleInput({
      type: InputTypes.SELECT,
      formKey: "pairingMode",
      label: t("Pairing"),
      options: Object.entries(pairingLabels).map(([value, label]) => ({
        value,
        label,
      })),
      placeholder: t("Pairing"),
      required: true,
      helperText: t("PairingModeHelp"),
    }),
    ruleInput({
      type: InputTypes.NUMBER,
      formKey: "tableSize",
      label: t("Players Per Table"),
      placeholder: "4",
      required: true,
      helperText: t("TableSizeHelp"),
    }),
    ruleInput({
      type: InputTypes.NUMBER,
      formKey: "minTableSize",
      label: t("Minimum Table Size"),
      placeholder: "3",
      required: true,
      helperText: t("MinTableSizeHelp"),
    }),
    ruleInput({
      type: InputTypes.NUMBER,
      formKey: "leagueRounds",
      label: t("League Rounds"),
      placeholder: "3",
      required: true,
      helperText: t("LeagueRoundsHelp"),
    }),
    ruleInput({
      type: InputTypes.TEXT,
      formKey: "placementPoints",
      label: t("Placement Points"),
      placeholder: "4,2,1,0",
      required: true,
      helperText: t("PlacementPointsHelp"),
    }),
    ruleInput({
      type: InputTypes.NUMBER,
      formKey: "byePoints",
      label: t("Bye Points"),
      placeholder: "4",
      required: true,
      helperText: t("ByePointsHelp"),
    }),
    ruleInput({
      type: InputTypes.NUMBER,
      formKey: "advanceCount",
      label: t("Players Advancing To Elimination"),
      placeholder: "4",
      required: true,
      helperText: t("AdvanceCountHelp"),
    }),
    ruleInput({
      type: InputTypes.NUMBER,
      formKey: "advancePerTable",
      label: t("Players Advancing Per Table"),
      placeholder: "2",
      required: true,
      helperText: t("AdvancePerTableHelp"),
    }),
  ];

  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "game", type: FormKeyTypeEnum.NUMBER },
    { key: "location", type: FormKeyTypeEnum.NUMBER },
    { key: "date", type: FormKeyTypeEnum.DATE },
    { key: "registrationDeadline", type: FormKeyTypeEnum.DATE },
    { key: "format", type: FormKeyTypeEnum.STRING },
    { key: "pairingMode", type: FormKeyTypeEnum.STRING },
    { key: "tableSize", type: FormKeyTypeEnum.NUMBER },
    { key: "minTableSize", type: FormKeyTypeEnum.NUMBER },
    { key: "leagueRounds", type: FormKeyTypeEnum.NUMBER },
    { key: "placementPoints", type: FormKeyTypeEnum.STRING },
    { key: "byePoints", type: FormKeyTypeEnum.NUMBER },
    { key: "advanceCount", type: FormKeyTypeEnum.NUMBER },
    { key: "advancePerTable", type: FormKeyTypeEnum.NUMBER },
  ];

  const copyLink = (slug: string, source: RegistrationSource) => {
    navigator.clipboard
      .writeText(registrationUrl(slug, source))
      .then(() => toast.success(t("Link copied")));
  };

  const columns = [
    { key: t("Tournament Name"), isSortable: true },
    { key: t("Tournament Date"), isSortable: true },
    { key: t("Game"), isSortable: false },
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
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={(item: Tournament | UpdatePayload<Tournament>) =>
          createTournament(toPayload(item) as Partial<Tournament>)
        }
        constantValues={{
          format: TournamentFormat.LEAGUE_THEN_ELIMINATION,
          pairingMode: PairingMode.SWISS,
          tableSize: 4,
          minTableSize: 3,
          leagueRounds: 3,
          placementPoints: "4,2,1,0",
          byePoints: 4,
          advanceCount: 4,
          advancePerTable: 2,
        }}
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
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={handleUpdate}
          isEditMode={true}
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              ...rowToAction,
              placementPoints: rowToAction.placementPoints.join(","),
            } as unknown as Tournament,
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
