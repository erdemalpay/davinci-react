import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { MdOpenInNew, MdPrint } from "react-icons/md";
import { printQrCode } from "../../utils/printQrCode";
import { toast } from "react-toastify";
import { EventStatus, SurveyEvent } from "../../types/event-survey";
import { EventSurveyPaths, updateEventStatus, useEventMutations, useGetEvents } from "../../utils/api/event-survey";
import { UpdatePayload } from "../../utils/api";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";


interface Props {
  onSelectEvent: (event: SurveyEvent) => void;
}

const EventTable = ({ onSelectEvent }: Props) => {
  const { t } = useTranslation();
  const events = useGetEvents();
  const { createEvent, updateEvent, deleteEvent } = useEventMutations();
  const queryClient = useQueryClient();

  const [rowToAction, setRowToAction] = useState<SurveyEvent>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleStatusToggle = async (row: SurveyEvent) => {
    const next =
      row.status === EventStatus.PUBLISHED
        ? EventStatus.DRAFT
        : EventStatus.PUBLISHED;
    try {
      await updateEventStatus(row._id, next);
      await queryClient.invalidateQueries({
        queryKey: [EventSurveyPaths.events],
      });
      toast.success(
        next === EventStatus.PUBLISHED ? t("Form Published") : t("Moved to Draft")
      );
    } catch {
      toast.error("Durum güncellenemedi");
    }
  };


  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      label: t("Event Name"),
      placeholder: "ATO Kitap Fuarı 2026",
      required: true,
    },
    {
      type: InputTypes.TEXT,
      formKey: "rewardLabel",
      label: t("Reward"),
      placeholder: "Ücretsiz Filtre Kahve",
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "startAt",
      label: t("Event Start Date"),
      placeholder: t("Start"),
      required: false,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "endAt",
      label: t("Event End Date"),
      placeholder: t("End"),
      required: false,
      isDatePicker: true,
    },
    {
      type: InputTypes.TEXT,
      formKey: "location",
      label: t("Venue"),
      placeholder: "ATO Congresium",
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "stand",
      label: t("Stand No"),
      placeholder: "Stand 42",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "codeValidityDays",
      label: t("Code Validity Days"),
      placeholder: "7",
      required: true,
    },
  ];

  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "rewardLabel", type: FormKeyTypeEnum.STRING },
    { key: "startAt", type: FormKeyTypeEnum.DATE },
    { key: "endAt", type: FormKeyTypeEnum.DATE },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "stand", type: FormKeyTypeEnum.STRING },
    { key: "codeValidityDays", type: FormKeyTypeEnum.NUMBER },
  ];

  const columns = [
    { key: t("Event Name"), isSortable: true },
    { key: t("Published"), isSortable: false },
    { key: t("Reward"), isSortable: false },
    { key: t("Validity"), isSortable: false },
    { key: t("Start"), isSortable: true },
    { key: t("End"), isSortable: true },
    { key: t("QR Link"), isSortable: false },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
    {
      key: "name",
      node: (row: SurveyEvent) => (
        <button
          className="text-left font-medium hover:text-blue-600 transition-colors"
          onClick={() => onSelectEvent(row)}
        >
          {row.name}
        </button>
      ),
    },
    {
      key: "status",
      node: (row: SurveyEvent) => (
        <div className="flex flex-col items-start gap-1">
          <SwitchButton
            checked={row.status === EventStatus.PUBLISHED}
            onChange={() => handleStatusToggle(row)}
          />
          {row.status === EventStatus.ARCHIVED && (
            <span className="text-xs text-gray-400">Arşivlendi</span>
          )}
        </div>
      ),
    },
    { key: "rewardLabel" },
    {
      key: "codeValidityDays",
      node: (row: SurveyEvent) => <span>{row.codeValidityDays} gün</span>,
    },
    {
      key: "startAt",
      node: (row: SurveyEvent) =>
        row.startAt ? format(new Date(row.startAt), "dd/MM/yyyy") : "-",
    },
    {
      key: "endAt",
      node: (row: SurveyEvent) =>
        row.endAt ? format(new Date(row.endAt), "dd/MM/yyyy") : "-",
    },
    {
      key: "slug",
      node: (row: SurveyEvent) => {
        const url = `${window.location.origin}/campaign/${row.slug}`;
        return (
          <div className="flex items-center gap-2">
            <button
              title={t("Preview Form")}
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700 text-sm"
              onClick={() => window.open(url, "_blank")}
            >
              <MdOpenInNew className="text-lg" />
            </button>
            <button
              title={t("Print QR Code")}
              className="flex items-center gap-1 text-gray-500 hover:text-gray-800 text-sm"
              onClick={() =>
                printQrCode({
                  url,
                  eventName: row.name,
                })
              }
            >
              <MdPrint className="text-lg" />
            </button>
            <span className="text-xs text-gray-400 max-w-[100px] truncate hidden sm:inline">
              /campaign/{row.slug}
            </span>
          </div>
        );
      },
    },
  ];

  const addButton = {
    name: t("New Event"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={(item: SurveyEvent | UpdatePayload<SurveyEvent>) => createEvent(item as Partial<SurveyEvent>)}
        constantValues={{ codeValidityDays: 7 }}
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
            deleteEvent(rowToAction._id);
            setIsDeleteDialogOpen(false);
            toast.success("Etkinlik silindi");
          }}
          title={t("Delete Event")}
          text={`"${rowToAction.name}" etkinliğini silmek istediğinize emin misiniz?`}
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
        submitItem={(item: SurveyEvent | UpdatePayload<SurveyEvent>) => updateEvent(item as UpdatePayload<SurveyEvent>)}
        isEditMode={true}
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
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
      rows={(events as SurveyEvent[]).filter(Boolean)}
      title={t("Events")}
      addButton={addButton}
    />
  );
};

export default EventTable;
