import { format } from "date-fns";
import { useMemo } from "react";
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

const Feedback = () => {
  const { t } = useTranslation();
  const locations = useGetStoreLocations();
  const {
    initialFilterFeedbackPanelFormElements,
    filterFeedbackPanelFormElements,
    setFilterFeedbackPanelFormElements,
    showFeedbackFilters,
    setShowFeedbackFilters,
  } = useFilterContext();
  const feedbacks = useGetQueryFeedbacks(filterFeedbackPanelFormElements);

  const rows = useMemo(() => {
    return (
      feedbacks?.map((feedback) => {
        const foundLocation = getItem(feedback.location, locations);
        return {
          ...feedback,
          formattedDate: format(new Date(feedback.createdAt), "dd/MM/yyyy"),
          locationName: foundLocation ? foundLocation.name : "",
        };
      }) ?? []
    );
  }, [feedbacks, locations]);

  const columns = useMemo(
    () => [
      { key: t("Date"), isSortable: true },
      { key: t("Location"), isSortable: true },
      { key: t("Table"), isSortable: true },
      { key: t("Feedback"), isSortable: true },
      { key: t("Star Rating"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
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
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
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
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
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
    ],
    [
      t,
      locations,
      filterFeedbackPanelFormElements,
      setFilterFeedbackPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
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
    ],
    [t, showFeedbackFilters, setShowFeedbackFilters]
  );

  const filterPanel = useMemo(
    () => ({
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
    }),
    [
      showFeedbackFilters,
      filterPanelInputs,
      filterFeedbackPanelFormElements,
      setFilterFeedbackPanelFormElements,
      setShowFeedbackFilters,
      initialFilterFeedbackPanelFormElements,
    ]
  );

  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          rows={rows}
          rowKeys={rowKeys}
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
