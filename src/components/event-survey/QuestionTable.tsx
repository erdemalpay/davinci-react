import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { QuestionType, SurveyEvent, SurveyQuestion } from "../../types/event-survey";
import { useGetQuestions, useQuestionMutations } from "../../utils/api/event-survey";
import { UpdatePayload } from "../../utils/api";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const toOptionsArray = (options: string[] | string | undefined): string[] => {
  if (!options) return [];
  if (Array.isArray(options)) return options;
  return String(options).split("\n").map((s) => s.trim()).filter(Boolean);
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: "Tek Seçim",
  [QuestionType.MULTI_CHOICE]: "Çok Seçim",
  [QuestionType.TEXT]: "Metin",
  [QuestionType.CONSENT]: "Onay",
};

const QUESTION_TYPE_OPTIONS = Object.entries(QUESTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label })
);

interface Props {
  event: SurveyEvent;
}

const QuestionTable = ({ event }: Props) => {
  const { t } = useTranslation();
  const questions = useGetQuestions(event._id);
  const { createQuestion, updateQuestion, deleteQuestion } =
    useQuestionMutations(event._id);

  const [rowToAction, setRowToAction] = useState<SurveyQuestion>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [addFormType, setAddFormType] = useState<string>("");
  const [editFormType, setEditFormType] = useState<string>("");

  const buildInputs = (selectedType: string) => {
    const showOptions = selectedType !== QuestionType.CONSENT && selectedType !== QuestionType.TEXT;
    return [
      {
        type: InputTypes.TEXT,
        formKey: "label",
        label: t("Question Text"),
        placeholder: "Davinci Board Game Cafe'yi biliyor musunuz?",
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "type",
        label: t("Question Type"),
        options: QUESTION_TYPE_OPTIONS,
        placeholder: "Soru Tipi",
        required: true,
      },
      ...(showOptions
        ? [
            {
              type: InputTypes.TEXTAREA,
              formKey: "options",
              label: t("Options Per Line"),
              placeholder: "Evet\nHayır\nBilmiyorum",
              required: false,
            },
          ]
        : []),
      {
        type: InputTypes.CHECKBOX,
        formKey: "required",
        label: t("Required"),
        required: false,
        isTopFlexRow: true,
      },
    ];
  };

  const formKeys = [
    { key: "label", type: FormKeyTypeEnum.STRING },
    { key: "type", type: FormKeyTypeEnum.STRING },
    { key: "options", type: FormKeyTypeEnum.STRING },
    { key: "order", type: FormKeyTypeEnum.NUMBER },
    { key: "required", type: FormKeyTypeEnum.BOOLEAN },
  ];

  const columns = [
    { key: "Sıra", isSortable: true },
    { key: "Soru", isSortable: false },
    { key: "Tip", isSortable: false },
    { key: "Seçenekler", isSortable: false },
    { key: "Zorunlu", isSortable: false },
    { key: "İşlem", isSortable: false },
  ];

  const rowKeys = [
    { key: "order" },
    { key: "label" },
    {
      key: "type",
      node: (row: SurveyQuestion) => (
        <span className="text-sm">{QUESTION_TYPE_LABELS[row.type]}</span>
      ),
    },
    {
      key: "options",
      node: (row: SurveyQuestion) => (
        <span className="text-sm text-gray-500">
          {toOptionsArray(row.options).join(", ") || "-"}
        </span>
      ),
    },
    {
      key: "required",
      node: (row: SurveyQuestion) =>
        row.required ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-gray-400 text-2xl" />
        ),
    },
  ];

  const addButton = {
    name: "Soru Ekle",
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => {
          setIsAddModalOpen(false);
          setAddFormType("");
        }}
        header={`"${event.name}" — Yeni Soru`}
        inputs={buildInputs(addFormType)}
        formKeys={formKeys}
        setForm={(item: Partial<SurveyQuestion>) => setAddFormType(item.type ?? "")}
        upperMessage={[
          t("Question Form Info"),
          t("Question Type Single"),
          t("Question Type Multi"),
          t("Question Type Text"),
          t("Question Type Consent"),
          t("Question Options Info"),
        ]}
        upperMessageColumns={2}
        submitItem={(item: SurveyQuestion | UpdatePayload<SurveyQuestion>) => {
          const raw = item as Partial<SurveyQuestion>;
          const options = raw.options
            ? String(raw.options)
                .split("\n")
                .map((s: string) => s.trim())
                .filter(Boolean)
            : [];
          createQuestion({ ...raw, options } as Partial<SurveyQuestion>);
        }}
        constantValues={{ order: (questions?.length ?? 0) + 1, required: false }}
        topClassName="flex flex-col gap-2"
        generalClassName="overflow-scroll min-w-[90%] min-h-[95%]"
        nonImageInputsClassName="grid grid-cols-1 gap-4"
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
      name: "Sil",
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          close={() => setIsDeleteDialogOpen(false)}
          confirm={() => {
            deleteQuestion(rowToAction._id);
            setIsDeleteDialogOpen(false);
            toast.success("Soru silindi");
          }}
          title="Soruyu Sil"
          text={`"${rowToAction.label}" sorusunu silmek istediğinize emin misiniz?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isDeleteDialogOpen,
      setIsModal: setIsDeleteDialogOpen,
      isPath: false,
    },
    {
      name: "Düzenle",
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => {
            setIsEditModalOpen(false);
            setEditFormType("");
          }}
          header={`"${event.name}" — Soruyu Düzenle`}
          inputs={buildInputs(editFormType || rowToAction.type)}
          formKeys={formKeys}
          setForm={(item: Partial<SurveyQuestion>) => setEditFormType(item.type ?? "")}
          upperMessage={[
            t("Question Form Info"),
            t("Question Type Single"),
            t("Question Type Multi"),
            t("Question Type Text"),
            t("Question Type Consent"),
            t("Question Options Info"),
          ]}
          upperMessageColumns={2}
          submitItem={(item: SurveyQuestion | UpdatePayload<SurveyQuestion>) => {
            const payload = item as UpdatePayload<SurveyQuestion>;
            const rawOptions = payload.updates?.options;
            const options = rawOptions
              ? String(rawOptions)
                  .split("\n")
                  .map((s: string) => s.trim())
                  .filter(Boolean)
              : [];
            updateQuestion({ ...payload, updates: { ...payload.updates, options } } as UpdatePayload<SurveyQuestion>);
          }}
          isEditMode={true}
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              ...rowToAction,
              options: (toOptionsArray(rowToAction.options).join("\n")) as unknown as string[],
            },
          }}
          topClassName="flex flex-col gap-2"
          generalClassName="overflow-scroll min-w-[90%] min-h-[95%]"
          nonImageInputsClassName="grid grid-cols-1 gap-4"
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-700 font-medium">
          {event.name} — Soru Yönetimi
        </p>
        <p className="text-xs text-blue-500 mt-0.5">
          Ödül: {event.rewardLabel} · {event.codeValidityDays} gün geçerli
        </p>
      </div>
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        isActionsActive={true}
        rows={(questions as SurveyQuestion[]).filter(Boolean)}
        title="Sorular"
        addButton={addButton}
      />
    </div>
  );
};

export default QuestionTable;
