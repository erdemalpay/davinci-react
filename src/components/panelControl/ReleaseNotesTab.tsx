import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { MdOutlineNewReleases } from "react-icons/md";
import { useUserContext } from "../../context/User.context";
import { ReleaseNote, ReleaseNoteItem, RoleEnum } from "../../types";
import { UpdatePayload } from "../../utils/api";
import {
  useGetReleaseNotes,
  useReleaseNoteMutations,
} from "../../utils/api/panelControl/releaseNote";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

export type ReleaseNoteFormValues = {
  releaseId: string;
  title: string;
  date: string;
  itemsText: string;
  isPublished: boolean;
};

const ITEMS_SEPARATOR = "\n";
const TITLE_DESC_SEP = " | ";

function parseItemsText(text: string): ReleaseNoteItem[] {
  if (!text || typeof text !== "string") return [];
  return text
    .split(ITEMS_SEPARATOR)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(TITLE_DESC_SEP);
      if (idx === -1) return { title: line, description: "" };
      return {
        title: line.slice(0, idx).trim(),
        description: line.slice(idx + TITLE_DESC_SEP.length).trim(),
      };
    });
}

function serializeItems(items: ReleaseNoteItem[]): string {
  if (!items?.length) return "";
  return items
    .map((i) =>
      i.description ? `${i.title}${TITLE_DESC_SEP}${i.description}` : i.title
    )
    .join(ITEMS_SEPARATOR);
}

const ReleaseNotesTab = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const releaseNotes = useGetReleaseNotes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<ReleaseNote | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { createReleaseNote, updateReleaseNote, deleteReleaseNote } =
    useReleaseNoteMutations();

  const rows = useMemo(() => releaseNotes ?? [], [releaseNotes]);

  const columns = useMemo(
    () => [
      { key: t("ReleaseNotesReleaseId"), isSortable: true },
      { key: t("ReleaseNotesTitle"), isSortable: true },
      { key: t("ReleaseNotesDate"), isSortable: true },
      { key: t("ReleaseNotesPublished"), isSortable: false },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "releaseId" },
      { key: "title" },
      { key: "date" },
      {
        key: "isPublished",
        node: (row: ReleaseNote) =>
          row.isPublished ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              <MdOutlineNewReleases className="h-3.5 w-3.5" />
              {t("ReleaseNotesPublished")}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              {t("ReleaseNotesDraft")}
            </span>
          ),
      },
    ],
    [t]
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "releaseId",
        label: t("ReleaseNotesReleaseId"),
        placeholder: t("ReleaseNotesReleaseIdPlaceholder"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "title",
        label: t("ReleaseNotesTitle"),
        placeholder: t("ReleaseNotesTitlePlaceholder"),
        required: true,
      },
      {
        type: InputTypes.DATE,
        formKey: "date",
        label: t("ReleaseNotesDate"),
        placeholder: t("ReleaseNotesDate"),
        required: true,
        isDatePicker: true,
      },
      {
        type: InputTypes.TEXTAREA,
        formKey: "itemsText",
        label: t("ReleaseNotesItems"),
        placeholder: t("ReleaseNotesItemsPlaceholder"),
        required: false,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "isPublished",
        label: t("ReleaseNotesPublish"),
        required: false,
      },
    ],
    [t]
  );

  const formKeys = useMemo(
    () => [
      { key: "releaseId", type: FormKeyTypeEnum.STRING },
      { key: "title", type: FormKeyTypeEnum.STRING },
      { key: "date", type: FormKeyTypeEnum.DATE },
      { key: "itemsText", type: FormKeyTypeEnum.STRING },
      { key: "isPublished", type: FormKeyTypeEnum.BOOLEAN },
    ],
    []
  );

  const handleCreate = (form: ReleaseNoteFormValues) => {
    const items = parseItemsText(form.itemsText ?? "");
    createReleaseNote({
      releaseId: form.releaseId,
      title: form.title,
      date: form.date,
      items,
      isPublished: form.isPublished,
    });
    setIsAddModalOpen(false);
  };

  const handleUpdate = (payload: UpdatePayload<ReleaseNoteFormValues>) => {
    const { updates } = payload;
    const itemsText = updates.itemsText;
    const items =
      itemsText !== undefined ? parseItemsText(itemsText) : undefined;
    const { itemsText: _t, ...rest } = updates;
    updateReleaseNote({
      id: payload.id,
      updates: { ...rest, ...(items !== undefined && { items }) },
    });
    setIsEditModalOpen(false);
  };

  const addButton = useMemo(
    () => ({
      name: t("ReleaseNotesAdd"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={handleCreate as any}
          topClassName="flex flex-col gap-2"
          constantValues={{
            date: format(new Date(), "yyyy-MM-dd"),
            isPublished: false,
          }}
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [t, isAddModalOpen, inputs, formKeys, user]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isDeleteConfirmOpen}
            close={() => setIsDeleteConfirmOpen(false)}
            confirm={() => {
              if (rowToAction) deleteReleaseNote(rowToAction._id);
              setIsDeleteConfirmOpen(false);
            }}
            title={t("Delete Action")}
            text={`${rowToAction.title} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl",
        isModal: true,
        isModalOpen: isDeleteConfirmOpen,
        setIsModal: setIsDeleteConfirmOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
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
            submitItem={handleUpdate as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2"
            itemToEdit={{
              id: rowToAction._id,
              updates: {
                releaseId: rowToAction.releaseId,
                title: rowToAction.title,
                date: rowToAction.date,
                itemsText: serializeItems(rowToAction.items ?? []),
                isPublished: rowToAction.isPublished,
              } as any,
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      },
      {
        name: t("ReleaseNotesPublish"),
        icon: <MdOutlineNewReleases />,
        className: "text-emerald-600 cursor-pointer text-xl",
        isModal: false,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
        onClick: (row: ReleaseNote) => {
          if (row.isPublished) return;
          updateReleaseNote({ id: row._id, updates: { isPublished: true } });
        },
      },
    ],
    [
      t,
      rowToAction,
      isDeleteConfirmOpen,
      isEditModalOpen,
      inputs,
      formKeys,
      deleteReleaseNote,
      updateReleaseNote,
      user,
    ]
  );

  return (
    <div className="mx-auto w-[95%]">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("ReleaseNotesTitleTab")}
        addButton={addButton}
        isActionsActive={true}
      />
    </div>
  );
};

export default ReleaseNotesTab;
