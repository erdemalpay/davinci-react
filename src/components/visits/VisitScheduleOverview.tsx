import { format, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { useFilterContext } from "../../context/Filter.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
  LocationShiftType,
  VisitStatus,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useAddShiftMutation, useGetUserShifts } from "../../utils/api/shift";
import { useGetUsersMinimal } from "../../utils/api/user";
import { useGetUniqueVisits, useVisitMutation } from "../../utils/api/visit";
import { getItem } from "../../utils/getItem";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const VisitScheduleOverview = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const users = useGetUsersMinimal();
  const locations = useGetStoreLocations();
  const disabledConditions = useGetDisabledConditions();
  const [rowToAction, setRowToAction] = useState<any>();
  const [isAddShiftModalOpen, setIsAddShiftModalOpen] = useState(false);
  const initialFilterPanelFormElements = {
    date: "",
    after: format(startOfMonth(new Date()), "yyyy-MM-dd"),
    before: "",
    user: "",
    location: "",
  };
  const {
    filterVisitScheduleOverviewPanelFormElements,
    setFilterVisitScheduleOverviewPanelFormElements,
    showVisitScheduleOverviewFilters,
    setShowVisitScheduleOverviewFilters,
  } = useFilterContext();
  const { mutate: addShift } = useAddShiftMutation();
  const shifts = useGetUserShifts(
    filterVisitScheduleOverviewPanelFormElements.after,
    filterVisitScheduleOverviewPanelFormElements.before
  );
  const visits = useGetUniqueVisits(
    filterVisitScheduleOverviewPanelFormElements.after,
    filterVisitScheduleOverviewPanelFormElements.before
  );
  const { updateVisit } = useVisitMutation();
  const [addShiftForm, setAddShiftForm] = useState({
    day: "",
    location: "",
    shift: "",
    shiftEndHour: "",
    isWrongEntry: false,
  });

  const visitScheduleOverviewDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.VISITS_VISITSCHEDULEOVERVIEW,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    const allRows = visits
      ?.filter((visit) => {
        if (filterVisitScheduleOverviewPanelFormElements.user !== "") {
          return (
            visit.user === filterVisitScheduleOverviewPanelFormElements.user
          );
        }
        if (filterVisitScheduleOverviewPanelFormElements.location !== "") {
          return (
            visit.location ===
            filterVisitScheduleOverviewPanelFormElements.location
          );
        }
        return true;
      })
      ?.reduce((acc: any, curr: any) => {
        const foundShift = shifts
          ?.find(
            (s) =>
              s.day === curr.date &&
              s.location === curr.location &&
              s.shifts?.some((x) => x.user?.includes(curr.user))
          )
          ?.shifts?.find((x) => x.user?.includes(curr.user));
        let fullTime = 0,
          partTime = 0,
          unknown = 0,
          wrongEntry = 0;

        if (curr.status === VisitStatus.WRONG_ENTRY) {
          wrongEntry = 1;
        } else if (foundShift) {
          const loc = locations?.find((l) => l._id === curr.location);
          const type = loc?.shifts?.find(
            (s) => s.shift === foundShift.shift && s.isActive
          )?.type;
          if (type === LocationShiftType.FULLTIME) fullTime = 1;
          else if (type === LocationShiftType.PARTTIME) partTime = 1;
          else unknown = 1;
        } else {
          unknown = 1;
        }
        const userName = getItem(curr.user, users)?.name || "Unknown";
        const existing = acc.find((r: any) => r.userName === userName);
        if (existing) {
          existing.fullTime += fullTime;
          existing.partTime += partTime;
          existing.unknown += unknown;
          existing.wrongEntry += wrongEntry;
          if (unknown > 0) {
            existing.unknownDates.push({
              _id: curr._id,
              date: curr.date,
              location: curr.location,
              startHour: curr.startHour,
              endHour: curr.endHour,
            });
          }
        } else {
          acc.push({
            ...curr,
            userName,
            fullTime,
            partTime,
            unknown,
            wrongEntry,
            unknownDates:
              unknown > 0
                ? [
                    {
                      _id: curr._id,
                      date: curr.date,
                      location: curr.location,
                      startHour: curr.startHour,
                      endHour: curr.endHour,
                    },
                  ]
                : [],
          });
        }
        return acc;
      }, []);
    return allRows || [];
  }, [
    visits,
    filterVisitScheduleOverviewPanelFormElements,
    shifts,
    locations,
    users,
  ]);

  const columns = useMemo(
    () => [
      { key: t("User"), isSortable: true, correspondingKey: "userName" },
      { key: "Part Time", isSortable: true, correspondingKey: "partTime" },
      { key: "Full Time", isSortable: true, correspondingKey: "fullTime" },
      {
        key: t("Wrong Entry"),
        isSortable: true,
        correspondingKey: "wrongEntry",
      },
      { key: t("Unknown"), isSortable: true, correspondingKey: "unknown" },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "userName" },
      { key: "partTime" },
      { key: "fullTime" },
      { key: "wrongEntry" },
      { key: "unknown" },
    ],
    []
  );

  const addShiftInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "day",
        label: t("Date"),
        placeholder: t("Date"),
        options: rowToAction?.unknownDates?.map((unknownDatesItem: any) => {
          return {
            value: unknownDatesItem.date,
            label: unknownDatesItem.date,
          };
        }),
        required: true,
      },
      {
        type: InputTypes.CHECKBOX,
        formKey: "isWrongEntry",
        label: t("Wrong Entry"),
        placeholder: t("Wrong Entry"),
        required: false,
        isTopFlexRow: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        placeholder: t("Location"),
        options: locations
          ?.filter?.(
            (location) =>
              location._id ===
              rowToAction?.unknownDates?.find(
                (unknownDatesItem: any) =>
                  unknownDatesItem?.date === addShiftForm.day
              )?.location
          )
          .map((location) => {
            return {
              value: location._id,
              label: location.name,
            };
          }),
        isReadOnly: true,
        required: !addShiftForm.isWrongEntry,
        isDisabled: Boolean(addShiftForm.isWrongEntry),
      },
      {
        type: InputTypes.SELECT,
        formKey: "startHour",
        label: t("Start Hour"),
        placeholder: t("Start Hour"),
        options: [
          {
            value: rowToAction?.unknownDates?.find(
              (unknownDatesItem: any) =>
                unknownDatesItem?.date === addShiftForm.day
            )?.startHour,
            label: rowToAction?.unknownDates?.find(
              (unknownDatesItem: any) =>
                unknownDatesItem?.date === addShiftForm.day
            )?.startHour,
          },
        ],
        required: !addShiftForm.isWrongEntry,
        isReadOnly: true,
        isDisabled: Boolean(addShiftForm.isWrongEntry),
      },
      {
        type: InputTypes.SELECT,
        formKey: "shift",
        label: t("Shift"),
        options: (
          locations?.find(
            (location) => location._id === Number(addShiftForm.location)
          )?.shifts ?? []
        )?.map((shift) => {
          return {
            value: shift.shift,
            label: shift.shift,
          };
        }),
        placeholder: t("Shift"),
        isMultiple: false,
        required: !addShiftForm.isWrongEntry,
        isDisabled: Boolean(addShiftForm.isWrongEntry),
      },
    ],
    [
      t,
      rowToAction,
      addShiftForm.day,
      addShiftForm.location,
      addShiftForm.isWrongEntry,
      locations,
    ]
  );

  const addShiftFormKeys = useMemo(
    () => [
      { key: "day", type: FormKeyTypeEnum.STRING },
      { key: "location", type: FormKeyTypeEnum.NUMBER },
      { key: "shift", type: FormKeyTypeEnum.NUMBER },
      { key: "startHour", type: FormKeyTypeEnum.STRING },
      { key: "isWrongEntry", type: FormKeyTypeEnum.BOOLEAN },
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showVisitScheduleOverviewFilters}
            onChange={() => {
              setShowVisitScheduleOverviewFilters(
                !showVisitScheduleOverviewFilters
              );
            }}
          />
        ),
      },
    ],
    [t, showVisitScheduleOverviewFilters, setShowVisitScheduleOverviewFilters]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => {
          return {
            value: option.value,
            label: t(option.label),
          };
        }),
        placeholder: t("Date"),
        required: true,
        additionalOnChange: ({
          value,
          label,
        }: {
          value: string;
          label: string;
        }) => {
          const dateRange = dateRanges[value as DateRangeKey];
          if (dateRange) {
            setFilterVisitScheduleOverviewPanelFormElements({
              ...filterVisitScheduleOverviewPanelFormElements,
              ...dateRange(),
            });
          }
        },
      },
      {
        type: InputTypes.DATE,
        formKey: "after",
        label: t("Start Date"),
        placeholder: t("Start Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.DATE,
        formKey: "before",
        label: t("End Date"),
        placeholder: t("End Date"),
        required: true,
        isDatePicker: true,
        invalidateKeys: [{ key: "date", defaultValue: "" }],
        isOnClearActive: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "user",
        label: t("User"),
        options: users.map((user) => {
          return {
            value: user._id,
            label: user.name,
          };
        }),
        placeholder: t("User"),
        required: true,
      },
    ],
    [
      t,
      filterVisitScheduleOverviewPanelFormElements,
      setFilterVisitScheduleOverviewPanelFormElements,
      locations,
      users,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Add Shift"),
        icon: <CiCirclePlus />,
        className: "text-2xl mt-1 cursor-pointer",
        isModal: true,
        setRow: setRowToAction,
        modal: (
          <GenericAddEditPanel
            isOpen={isAddShiftModalOpen}
            close={() => setIsAddShiftModalOpen(false)}
            inputs={addShiftInputs}
            formKeys={addShiftFormKeys}
            submitItem={addShift as any}
            isEditMode={false}
            setForm={setAddShiftForm}
            topClassName="flex flex-col gap-2  "
            submitFunction={() => {
              const selectedUnknownDate = rowToAction?.unknownDates?.find(
                (unknownDatesItem: { date?: string; _id?: number | string }) =>
                  unknownDatesItem?.date === addShiftForm.day
              );

              if (addShiftForm.isWrongEntry) {
                if (selectedUnknownDate?._id) {
                  updateVisit({
                    id: selectedUnknownDate._id,
                    updates: { status: VisitStatus.WRONG_ENTRY },
                  });
                }
                setIsAddShiftModalOpen(false);
                return;
              }

              const foundLocation = locations?.find(
                (location) => location._id === Number(addShiftForm.location)
              );
              const foundEndHour = foundLocation?.shifts?.find(
                (shift) => shift.shift === addShiftForm.shift
              )?.shiftEndHour;
              addShift({
                day: addShiftForm.day,
                location: Number(addShiftForm.location),
                shift: addShiftForm.shift,
                userId: rowToAction.user,
                ...(foundEndHour && { shiftEndHour: foundEndHour }),
              });
              setIsAddShiftModalOpen(false);
            }}
          />
        ),
        isModalOpen: isAddShiftModalOpen,
        setIsModal: setIsAddShiftModalOpen,
        isPath: false,
        isDisabled: visitScheduleOverviewDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.ADD &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      isAddShiftModalOpen,
      addShiftInputs,
      addShiftFormKeys,
      addShift,
      updateVisit,
      addShiftForm.location,
      addShiftForm.day,
      addShiftForm.shift,
      addShiftForm.isWrongEntry,
      rowToAction,
      locations,
      visitScheduleOverviewDisabledCondition,
      user,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showVisitScheduleOverviewFilters,
      inputs: filterPanelInputs,
      formElements: filterVisitScheduleOverviewPanelFormElements,
      setFormElements: setFilterVisitScheduleOverviewPanelFormElements,
      closeFilters: () => setShowVisitScheduleOverviewFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterVisitScheduleOverviewPanelFormElements(
          initialFilterPanelFormElements
        );
      },
    }),
    [
      showVisitScheduleOverviewFilters,
      filterPanelInputs,
      filterVisitScheduleOverviewPanelFormElements,
      setFilterVisitScheduleOverviewPanelFormElements,
      setShowVisitScheduleOverviewFilters,
      initialFilterPanelFormElements,
    ]
  );

  return (
    <>
      <div className="w-[95%] my-5 mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          actions={actions}
          isActionsActive={true}
          filterPanel={filterPanel}
          filters={filters}
          isExcel={
            user &&
            !visitScheduleOverviewDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          excelFileName={"VisitSchedule.xlsx"}
          title={t("Visit Schedule Overview")}
        />
      </div>
    </>
  );
};
export default VisitScheduleOverview;
