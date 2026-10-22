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
import { MdOutlineStickyNote2 } from "react-icons/md";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  FormElementsState,
  StaffLeave,
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

  // Hem takvimdeki tooltip'te hem not penceresinde gösterilir.
  const getDetailLines = (staffLeave: StaffLeave, date: string) => [
    `${convertDateFormat(staffLeave.startDate)} / ${convertDateFormat(
      staffLeave.endDate
    )}`,
    ...(staffLeave.notes ?? [])
      .filter((note) => note.date === date)
      .map(
        (note) => `${getItem(note.createdBy, users)?.name ?? ""}: ${note.text}`
      ),
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

  const noteInputs = [
    {
      type: InputTypes.TEXTAREA,
      formKey: "text",
      label: t("Note"),
      placeholder: t("Note"),
      required: true,
    },
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
    { key: "text", type: FormKeyTypeEnum.STRING },
    { key: "isForAllDays", type: FormKeyTypeEnum.BOOLEAN },
  ];

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
      {activeEntry && activeStaffLeave && (
        <GenericAddEditPanel
          isOpen={!!activeEntry}
          close={() => setActiveEntry(null)}
          header={`${activeUserName} - ${
            getItem(activeStaffLeave.type, staffLeaveTypes)?.name ?? ""
          }`}
          upperMessage={getDetailLines(activeStaffLeave, activeEntry.date)}
          inputs={noteInputs}
          formKeys={noteFormKeys}
          setForm={setNoteForm}
          submitItem={(item) =>
            updateStaffLeave(item as UpdatePayload<StaffLeave>)
          }
          submitFunction={() => {
            if (!user) return;
            updateStaffLeave(
              {
                id: activeStaffLeave._id,
                updates: {
                  notes: [
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
                },
              },
              { onSuccess: () => toast.success(t("Note added")) }
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
                    label: t("Delete"),
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
    </div>
  );
}
