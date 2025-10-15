import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useFilterContext } from "../context/Filter.context";
import { DateRangeKey, commonDateOptions } from "../types";
import { dateRanges } from "../utils/api/dateRanges";
import { useGetQueryFeedbacks } from "../utils/api/feedback";
import { useGetStoreLocations } from "../utils/api/location";
import { getItem } from "../utils/getItem";
import { LocationInput } from "../utils/panelInputs";

const Feedback = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetStoreLocations();
  const {
    initialFilterFeedbackPanelFormElements,
    filterFeedbackPanelFormElements,
    setFilterFeedbackPanelFormElements,
    showFeedbackFilters,
    setShowFeedbackFilters,
  } = useFilterContext();
  const feedbacks = useGetQueryFeedbacks(filterFeedbackPanelFormElements);
  const allRows = feedbacks?.map((feedback) => {
    const foundLocation = getItem(feedback.location, locations);
    return {
      ...feedback,
      formattedDate: format(new Date(feedback.createdAt), "dd/MM/yyyy"),
      locationName: foundLocation ? foundLocation.name : "",
    };
  });
  const [rows, setRows] = useState(allRows ?? []);
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Table"), isSortable: true },
    { key: t("Feedback"), isSortable: true },
    { key: t("Star Rating"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "date",
      className: "min-w-32 pr-2",
      node: (row: any) => {
        return row.formattedDate;
      },
    },
    { key: "locationName" },
    { key: "tableName" },
    { key: "comment" },
    { key: "starRating" },
  ];
  const filterPanelInputs = [
    LocationInput({ locations: locations, required: true }),
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
          setFilterFeedbackPanelFormElements({
            ...filterFeedbackPanelFormElements,
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
  ];
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showFeedbackFilters}
          onChange={() => {
            setShowFeedbackFilters(!showFeedbackFilters);
          }}
        />
      ),
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFeedbackFilters,
    inputs: filterPanelInputs,
    formElements: filterFeedbackPanelFormElements,
    setFormElements: setFilterFeedbackPanelFormElements,
    closeFilters: () => setShowFeedbackFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterFeedbackPanelFormElements(
        initialFilterFeedbackPanelFormElements
      );
    },
  };

  useEffect(() => {
    setRows(allRows ?? []);
    setTableKey((prevKey) => prevKey + 1);
  }, [feedbacks, locations]);

  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rows={rows}
          rowKeys={rowKeys}
          // actions={actions}
          isActionsActive={false}
          columns={columns}
          filters={filters}
          title={t("Feedbacks")}
          filterPanel={filterPanel}
          isToolTipEnabled={false}
        />
      </div>
    </>
  );
};

export default Feedback;
