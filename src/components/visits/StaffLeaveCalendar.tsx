import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Tooltip } from "@material-tailwind/react";
import { enUS, tr } from "date-fns/locale";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { MdOutlineStickyNote2 } from "react-icons/md";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  FormElementsState,
  StaffLeave,
  StaffLeaveNote,
  StaffLeaveType,
} from "../../types";
import { UpdatePayload } from "../../utils/api";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import {
  useGetStaffLeaves,
  useGetStaffLeaveTypes,
  useStaffLeaveMutations,
} from "../../utils/api/staffLeave";
import { useGetUsersMinimal } from "../../utils/api/user";
import { convertDateFormat } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import { MonthlyBody, MonthlyDay } from "../calendar/MonthlyBody";
import { MonthlyCalendar, MonthlyNav } from "../calendar/MonthlyCalendar";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { GenericButton } from "../common/GenericButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import SwitchButton from "../panelComponents/common/SwitchButton";
import FilterPanel from "../panelComponents/Tables/FilterPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

// Kaydın aralığındaki her gün için bir event.
type StaffLeaveCalendarEvent = StaffLeave & { date: string };

const DEFAULT_FALLBACK_COLOR = "#6B7280";

// Kaydın kapsadığı günler, "yyyy-MM-dd" olarak.
const getStaffLeaveDays = (staffLeave: StaffLeave) =>
  eachDayOfInterval({
    start: parseISO(staffLeave.startDate),
    end: parseISO(staffLeave.endDate),
  }).map((day) => format(day, "yyyy-MM-dd"));

export default function StaffLeaveCalendar() {
  const { t, i18n } = useTranslation();
  const calendarLocale = i18n.language?.startsWith("tr") ? tr : enUS;
  const { user } = useUserContext();
  const [currentMonth, setCurrentMonth] = useState<Date>(
    startOfMonth(new Date())
  );
  const users = useGetUsersMinimal();
  const staffLeaveTypes = useGetStaffLeaveTypes();
  const activeStaffLeaveTypes = staffLeaveTypes.filter((type) => type.active);
  const disabledConditions = useGetDisabledConditions();
  const disabledCondition = useMemo(
    () =>
      getItem(
        DisabledConditionEnum.VISITS_STAFFLEAVECALENDAR,
        disabledConditions
      ),
    [disabledConditions]
  );
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({ user: "", type: "" });
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeEntry, setActiveEntry] = useState<{
    id: number;
    date: string;
  } | null>(null);
  const [noteForm, setNoteForm] = useState<FormElementsState>({ text: "" });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  // Notlar kaydın notes dizisinde tutulur; düzenlenen not index ile seçilir.
  const [editingNoteIndex, setEditingNoteIndex] = useState<number | null>(null);
  const [isNoteDeleteDialogOpen, setIsNoteDeleteDialogOpen] = useState(false);
  const [editNoteForm, setEditNoteForm] = useState<FormElementsState>({});

  // include the leading/trailing days of the adjacent months that show up
  // as shaded overflow cells on the calendar grid (week starts on Monday)
  const after = format(
    startOfWeek(currentMonth, { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const before = format(
    endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 }),
    "yyyy-MM-dd"
  );
  const staffLeaves = useGetStaffLeaves(after, before);
  const { createStaffLeave, updateStaffLeave, deleteStaffLeave } =
    useStaffLeaveMutations(after, before);

  const events: StaffLeaveCalendarEvent[] = useMemo(
    () =>
      staffLeaves
        .filter(
          (staffLeave) =>
            (!filterPanelFormElements.type ||
              staffLeave.type === Number(filterPanelFormElements.type)) &&
            (!filterPanelFormElements.user ||
              staffLeave.user === filterPanelFormElements.user)
        )
        .flatMap((staffLeave) =>
          getStaffLeaveDays(staffLeave).map((date) => ({ ...staffLeave, date }))
        ),
    [staffLeaves, filterPanelFormElements.user, filterPanelFormElements.type]
  );

  const activeStaffLeave = activeEntry
    ? getItem(activeEntry.id, staffLeaves)
    : undefined;
  const activeUserName = activeStaffLeave
    ? getItem(activeStaffLeave.user, users)?.name ?? ""
    : "";
  const activeStaffLeaveTitle = activeStaffLeave
    ? `${activeUserName} - ${
        getItem(activeStaffLeave.type, staffLeaveTypes)?.name ?? ""
      }`
    : "";
  const editingNote =
    editingNoteIndex === null
      ? undefined
      : activeStaffLeave?.notes?.[editingNoteIndex];
  // "Tüm günlere ekle" ile yazılan kopyalar: aynı kişi, aynı metin (notun kendisi dahil).
  const editingNoteCopyIndexes = editingNote
    ? (activeStaffLeave?.notes ?? []).flatMap((note, index) =>
        note.createdBy === editingNote.createdBy &&
        note.text === editingNote.text
          ? [index]
          : []
      )
    : [];
  const getEditingNoteIndexes = (isForAllDays: unknown) =>
    isForAllDays ? editingNoteCopyIndexes : [editingNoteIndex];

  // Not ekleme, düzenleme ve silme kaydın notes dizisini değiştirir.
  const updateNotes = (
    staffLeave: StaffLeave,
    notes: StaffLeaveNote[],
    message: string
  ) =>
    updateStaffLeave(
      { id: staffLeave._id, updates: { notes } },
      { onSuccess: () => toast.success(message) }
    );

  // Tarih aralığı not penceresinde, notlarla birlikte hali takvim tooltip'inde gösterilir.
  const getDateRangeLine = (staffLeave: StaffLeave) =>
    `${convertDateFormat(staffLeave.startDate)} / ${convertDateFormat(
      staffLeave.endDate
    )}`;
  const getNoteLine = (note: StaffLeaveNote) =>
    `${getItem(note.createdBy, users)?.name ?? ""}: ${note.text}`;
  const getDetailLines = (staffLeave: StaffLeave, date: string) => [
    getDateRangeLine(staffLeave),
    ...(staffLeave.notes ?? [])
      .filter((note) => note.date === date)
      .map(getNoteLine),
  ];

  const userInput = {
    type: InputTypes.SELECT,
    formKey: "user",
    label: t("User"),
    options: users.map((u) => ({ value: u._id, label: u.name })),
    placeholder: t("User"),
  };
  const typeInput = {
    type: InputTypes.SELECT,
    formKey: "type",
    label: t("Staff Leave Type"),
    placeholder: t("Staff Leave Type"),
  };
  const toTypeOptions = (types: StaffLeaveType[]) =>
    types.map((type) => ({ value: type._id, label: type.name }));
  // Pasif türün eski kayıtları takvimde durduğu için filtrede tüm türler var.
  const filterPanelInputs = [
    { ...userInput, required: false },
    { ...typeInput, options: toTypeOptions(staffLeaveTypes), required: false },
  ];

  const addInputs = [
    { ...userInput, required: true },
    {
      ...typeInput,
      options: toTypeOptions(activeStaffLeaveTypes),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "startDate",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "endDate",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const addFormKeys = [
    { key: "user", type: FormKeyTypeEnum.STRING },
    { key: "type", type: FormKeyTypeEnum.NUMBER },
    { key: "startDate", type: FormKeyTypeEnum.DATE },
    { key: "endDate", type: FormKeyTypeEnum.DATE },
  ];

  const noteTextInput = {
    type: InputTypes.TEXTAREA,
    formKey: "text",
    label: t("Note"),
    placeholder: t("Note"),
    required: true,
  };
  const noteTextFormKey = { key: "text", type: FormKeyTypeEnum.STRING };
  const noteInputs = [
    noteTextInput,
    // Tek günlük kayıtta sorulacak bir şey yok.
    ...(activeStaffLeave &&
    activeStaffLeave.startDate !== activeStaffLeave.endDate
      ? [
          {
            type: InputTypes.CHECKBOX,
            formKey: "isForAllDays",
            label: t("Add to all days in the range"),
            placeholder: t("Add to all days in the range"),
            required: false,
            isTopFlexRow: true,
          },
        ]
      : []),
  ];
  const noteFormKeys = [
    noteTextFormKey,
    { key: "isForAllDays", type: FormKeyTypeEnum.BOOLEAN },
  ];
  const applyToAllDaysLabel = t(
    "Apply to all days with this note ({{count}})",
    { count: editingNoteCopyIndexes.length }
  );
  const editNoteInputs = [
    noteTextInput,
    // Not aralıktaki başka günlerde de varsa eklemedeki gibi sorulur.
    ...(editingNoteCopyIndexes.length > 1
      ? [
          {
            type: InputTypes.CHECKBOX,
            formKey: "isForAllDays",
            label: applyToAllDaysLabel,
            placeholder: applyToAllDaysLabel,
            required: false,
            isTopFlexRow: true,
          },
        ]
      : []),
  ];
  // Not penceresinde o günün notları; herkes sadece kendi notunu düzenler.
  const dayNotes = (activeStaffLeave?.notes ?? []).flatMap((note, index) =>
    note.date === activeEntry?.date ? [{ note, index }] : []
  );
  const dayNotesPanel = dayNotes.length > 0 && (
    <div className="flex flex-col gap-1 px-4 py-6 text-sm">
      {dayNotes.map(({ note, index }) => (
        <div
          key={index}
          className="flex items-center justify-between gap-2 rounded-lg bg-gray-100 px-2 py-1"
        >
          <p className="break-words">{getNoteLine(note)}</p>
          {note.createdBy === user?._id &&
            !isActionDisabled(disabledCondition, ActionEnum.UPDATE, user) && (
              <ButtonTooltip content={t("Edit")}>
                <FiEdit
                  className="w-5 h-5 flex-shrink-0 text-blue-500 hover:text-blue-800 cursor-pointer"
                  onClick={() => setEditingNoteIndex(index)}
                />
              </ButtonTooltip>
            )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="__className_a182b8 w-[95%] mx-auto">
      <div className="my-4 flex justify-between gap-4 flex-wrap">
        <GenericButton
          onClick={() => setIsAddModalOpen(true)}
          disabled={isActionDisabled(disabledCondition, ActionEnum.ADD, user)}
        >
          {t("Add Staff Leave")}
        </GenericButton>
        <div className="flex items-center gap-2">
          <span className="text-sm">{t("Show Filters")}</span>
          <SwitchButton
            checked={showFilters}
            onChange={() => setShowFilters(!showFilters)}
          />
        </div>
      </div>
      <div className={showFilters ? "flex flex-row gap-2" : ""}>
        {showFilters && (
          <FilterPanel
            isFilterPanelActive={showFilters}
            inputs={filterPanelInputs}
            formElements={filterPanelFormElements}
            setFormElements={setFilterPanelFormElements}
            closeFilters={() => setShowFilters(false)}
            additionalFilterCleanFunction={() =>
              setFilterPanelFormElements({ user: "", type: "" })
            }
          />
        )}
        <div className="flex-1">
          <MonthlyCalendar
            currentMonth={currentMonth}
            onCurrentMonthChange={(date) => setCurrentMonth(date)}
            locale={calendarLocale}
          >
            <MonthlyNav />
            <MonthlyBody<StaffLeaveCalendarEvent>
              events={events}
              showOverflowDays
            >
              <MonthlyDay<StaffLeaveCalendarEvent>
                renderDay={(dayStaffLeaves) =>
                  dayStaffLeaves.map((staffLeave) => {
                    const staffLeaveType = getItem(
                      staffLeave.type,
                      staffLeaveTypes
                    );
                    const hasNote = staffLeave.notes?.some(
                      (note) => note.date === staffLeave.date
                    );
                    return (
                      <li key={staffLeave._id} className="py-1">
                        <Tooltip
                          content={[
                            staffLeaveType?.name ?? "",
                            ...getDetailLines(staffLeave, staffLeave.date),
                          ].map((line, index) => (
                            <div key={index}>{line}</div>
                          ))}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setActiveEntry({
                                id: staffLeave._id,
                                date: staffLeave.date,
                              })
                            }
                            className="w-full flex items-center justify-between gap-1 px-2 py-[1.4px] rounded-lg text-sm font-medium text-white text-left"
                            style={{
                              backgroundColor:
                                staffLeaveType?.backgroundColor ??
                                DEFAULT_FALLBACK_COLOR,
                            }}
                          >
                            <span className="truncate">
                              {getItem(staffLeave.user, users)?.name}
                            </span>
                            {hasNote && (
                              <MdOutlineStickyNote2 className="flex-shrink-0 rounded-sm bg-white text-red-600" />
                            )}
                          </button>
                        </Tooltip>
                      </li>
                    );
                  })
                }
              />
            </MonthlyBody>
          </MonthlyCalendar>
        </div>
      </div>
      {isAddModalOpen && (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={addInputs}
          formKeys={addFormKeys}
          submitItem={(item) =>
            createStaffLeave(item as Partial<StaffLeave>, {
              onSuccess: () => toast.success(t("Staff leave added")),
            })
          }
          topClassName="flex flex-col gap-2 "
        />
      )}
      {activeEntry && activeStaffLeave && editingNoteIndex === null && (
        <GenericAddEditPanel
          isOpen={!!activeEntry}
          close={() => setActiveEntry(null)}
          header={activeStaffLeaveTitle}
          upperMessage={[getDateRangeLine(activeStaffLeave)]}
          anotherPanel={dayNotesPanel || undefined}
          anotherPanelTopClassName={
            dayNotesPanel
              ? "flex flex-col sm:grid grid-cols-1 md:grid-cols-2 w-full sm:w-11/12 md:w-3/4 lg:w-2/3"
              : undefined
          }
          inputs={noteInputs}
          formKeys={noteFormKeys}
          setForm={setNoteForm}
          submitItem={(item) =>
            updateStaffLeave(item as UpdatePayload<StaffLeave>)
          }
          submitFunction={() => {
            if (!user) return;
            updateNotes(
              activeStaffLeave,
              [
                ...(activeStaffLeave.notes ?? []),
                ...(noteForm.isForAllDays
                  ? getStaffLeaveDays(activeStaffLeave)
                  : [activeEntry.date]
                ).map((date) => ({
                  date,
                  text: noteForm.text,
                  createdBy: user._id,
                })),
              ],
              t("Note added")
            );
          }}
          buttonName={t("Add Note")}
          isSubmitButtonActive={
            !isActionDisabled(disabledCondition, ActionEnum.UPDATE, user)
          }
          additionalButtons={
            isActionDisabled(disabledCondition, ActionEnum.DELETE, user)
              ? []
              : [
                  {
                    label: "Delete",
                    onClick: () => setIsDeleteDialogOpen(true),
                  },
                ]
          }
          topClassName="flex flex-col gap-2 "
        />
      )}
      {activeStaffLeave && (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          close={() => setIsDeleteDialogOpen(false)}
          confirm={() => {
            deleteStaffLeave(activeStaffLeave._id, {
              onSuccess: () => toast.success(t("Staff leave deleted")),
            });
            setIsDeleteDialogOpen(false);
            setActiveEntry(null);
          }}
          title={t("Delete Staff Leave")}
          text={`${activeUserName} ${t("GeneralDeleteMessage")}`}
        />
      )}
      {activeStaffLeave && editingNoteIndex !== null && editingNote && (
        <GenericAddEditPanel
          isOpen
          close={() => setEditingNoteIndex(null)}
          header={activeStaffLeaveTitle}
          inputs={editNoteInputs}
          formKeys={noteFormKeys}
          setForm={setEditNoteForm}
          submitItem={(item) => {
            const { updates } = item as UpdatePayload<FormElementsState>;
            const indexes = getEditingNoteIndexes(updates.isForAllDays);
            updateNotes(
              activeStaffLeave,
              (activeStaffLeave.notes ?? []).map((note, index) =>
                indexes.includes(index)
                  ? { ...note, text: updates.text ?? note.text }
                  : note
              ),
              t("Note updated")
            );
            // Kaydedince not penceresine dönmeden ikisi de kapanır.
            setActiveEntry(null);
          }}
          isEditMode={true}
          itemToEdit={{
            id: editingNoteIndex,
            updates: { text: editingNote.text, isForAllDays: false },
          }}
          additionalButtons={[
            {
              label: "Delete",
              onClick: () => setIsNoteDeleteDialogOpen(true),
            },
          ]}
          topClassName="flex flex-col gap-2 "
        />
      )}
      {activeStaffLeave && editingNote && (
        <ConfirmationDialog
          isOpen={isNoteDeleteDialogOpen}
          close={() => setIsNoteDeleteDialogOpen(false)}
          confirm={() => {
            const indexes = getEditingNoteIndexes(editNoteForm.isForAllDays);
            updateNotes(
              activeStaffLeave,
              (activeStaffLeave.notes ?? []).filter(
                (_, index) => !indexes.includes(index)
              ),
              t("Note deleted")
            );
            setIsNoteDeleteDialogOpen(false);
            setEditingNoteIndex(null);
            setActiveEntry(null);
          }}
          title={t("Delete Note")}
          text={
            editNoteForm.isForAllDays
              ? t("This note will be deleted from {{count}} days.", {
                  count: editingNoteCopyIndexes.length,
                })
              : `${editingNote.text} ${t("GeneralDeleteMessage")}`
          }
        />
      )}
    </div>
  );
}
