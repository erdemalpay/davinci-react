import { format, startOfYear } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import {
  DateRangeKey,
  FormElementsState,
  commonDateOptions,
} from "../../types";
import { useGetBreaks } from "../../utils/api/break";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetUsersMinimal } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const AllBreaks = () => {
  const { t } = useTranslation();
  const users = useGetUsersMinimal();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const initialFilterPanelFormElements = {
    before: "",
    after: format(startOfYear(new Date()), "yyyy-MM-dd"),
    user: "",
    location: "",
    sort: "",
    asc: 1,
    search: "",
  };
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>(initialFilterPanelFormElements);
  const breakData = useGetBreaks(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const [showFilters, setShowFilters] = useState(false);
  const locations = useGetAllLocations();

  const rows = useMemo(() => {
    return (
      breakData?.map((breakRecord) => {
        return {
          ...breakRecord,
          userDisplayName: getItem(breakRecord?.user, users)?.name ?? "",
          locationDisplayName:
            getItem(breakRecord?.location, locations)?.name ?? "",
          formattedDate: format(new Date(breakRecord.date), "dd-MM-yyyy"),
          duration:
            breakRecord.finishHour && breakRecord.startHour
              ? `${breakRecord.startHour} - ${breakRecord.finishHour}`
              : t("Active"),
          status: breakRecord.finishHour ? t("Completed") : t("Active"),
        };
      }) ?? []
    );
  }, [breakData, users, locations, t]);

  const columns = useMemo(
    () => [
      { key: t("User"), isSortable: true, correspondingKey: "user" },
      { key: t("Location"), isSortable: true, correspondingKey: "location" },
      { key: t("Date"), isSortable: true, correspondingKey: "date" },
      { key: t("Start Time"), isSortable: true, correspondingKey: "startHour" },
      { key: t("End Time"), isSortable: true, correspondingKey: "finishHour" },
      { key: t("Duration"), isSortable: false },
      { key: t("Status"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "userDisplayName" },
      { key: "locationDisplayName" },
      { key: "formattedDate" },
      { key: "startHour" },
      {
        key: "finishHour",
        node: (row: any) => row.finishHour || t("Active"),
      },
      { key: "duration" },
      {
        key: "status",
        node: (row: any) => (
          <span
            className={`px-2 py-1 rounded text-sm ${
              row.finishHour
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {row.status}
          </span>
        ),
      },
    ],
    [t]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "user",
        label: t("User"),
        options: users?.map((user) => ({
          value: user._id,
          label: user.name,
        })),
        placeholder: t("User"),
        isMultiple: false,
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
        isMultiple: false,
        required: false,
      },
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
            setFilterPanelFormElements({
              ...filterPanelFormElements,
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
    ],
    [t, users, locations, filterPanelFormElements, setFilterPanelFormElements]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
      closeFilters: () => {
        setShowFilters(false);
      },
    }),
    [
      showFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      initialFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
      },
    ],
    [t, showFilters]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPanelFormElements,
      setFilterPanelFormElements: setFilterPanelFormElements,
    }),
    [filterPanelFormElements]
  );

  useMemo(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements, setCurrentPage]);

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements,
      setFilterPanelFormElements,
    };
  }, [t, filterPanelFormElements, setFilterPanelFormElements]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          filterPanel={filterPanel}
          title={t("All Breaks")}
          isActionsActive={false}
          isSearch={false}
          outsideSortProps={outsideSort}
          outsideSearchProps={outsideSearchProps}
        />
      </div>
    </>
  );
};

export default AllBreaks;
