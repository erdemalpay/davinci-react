import { format, startOfMonth } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { useFilterContext } from "../../context/Filter.context";
import {
  DateRangeKey,
  LocationShiftType,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useAddShiftMutation, useGetUserShifts } from "../../utils/api/shift";
import { useGetUsers } from "../../utils/api/user";
import { useGetUniqueVisits } from "../../utils/api/visit";
import { getItem } from "../../utils/getItem";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const VisitScheduleOverview = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const locations = useGetStoreLocations();
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
  const [addShiftForm, setAddShiftForm] = useState({
    day: "",
    location: "",
    shift: "",
    shiftEndHour: "",
  });

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
          unknown = 0;
        if (foundShift) {
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
          if (unknown > 0) {
            existing.unknownDates.push({
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
            unknownDates:
              unknown > 0
                ? [
                    {
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
        required: true,
        isReadOnly: true,
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
        required: true,
        isReadOnly: true,
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
        required: false,
      },
    ],
    [t, rowToAction, addShiftForm.day, addShiftForm.location, locations]
  );

  const addShiftFormKeys = useMemo(
    () => [
      { key: "day", type: FormKeyTypeEnum.STRING },
      { key: "location", type: FormKeyTypeEnum.NUMBER },
      { key: "shift", type: FormKeyTypeEnum.NUMBER },
      { key: "startHour", type: FormKeyTypeEnum.STRING },
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
      },
    ],
    [
      t,
      isAddShiftModalOpen,
      addShiftInputs,
      addShiftFormKeys,
      addShift,
      addShiftForm.location,
      addShiftForm.day,
      addShiftForm.shift,
      rowToAction,
      locations,
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
          isExcel={true}
          excelFileName={"VisitSchedule.xlsx"}
          title={t("Visit Schedule Overview")}
        />
      </div>
    </>
  );
};
export default VisitScheduleOverview;
