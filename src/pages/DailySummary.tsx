import { useTranslation } from "react-i18next";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { Header } from "../components/header/Header";
import SelectInput from "../components/panelComponents/FormElements/SelectInput";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useFilterContext } from "../context/Filter.context";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetDailySummary } from "../utils/api/order/order";

type OptionType = { value: number; label: string };

const DailySummary = () => {
  const { t } = useTranslation();
  const {
    filterDailySummaryPanelFormElements,
    setFilterDailySummaryPanelFormElements,
  } = useFilterContext();
  const locations = useGetStoreLocations();
  const summaries = useGetDailySummary(
    filterDailySummaryPanelFormElements.date,
    filterDailySummaryPanelFormElements.location
  );
  const filterInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: [
        {
          value: "",
          label: t("All Locations"),
        },
        ...locations.map((input) => {
          return {
            value: input._id,
            label: input.name,
          };
        }),
      ],
      placeholder: t("Location"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const handleChange = (key: string) => (value: string) => {
    setFilterDailySummaryPanelFormElements((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleChangeForSelect =
    (key: string) =>
    (
      selectedValue: SingleValue<OptionType> | MultiValue<OptionType>,
      actionMeta: ActionMeta<OptionType>
    ) => {
      if (
        actionMeta.action === "select-option" ||
        actionMeta.action === "remove-value" ||
        actionMeta.action === "clear"
      ) {
        if (selectedValue) {
          setFilterDailySummaryPanelFormElements((prev: any) => ({
            ...prev,
            [key]: (selectedValue as OptionType)?.value,
          }));
        } else {
          setFilterDailySummaryPanelFormElements((prev: any) => ({
            ...prev,
            [key]: "",
          }));
        }
      }
    };
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-full px-4 flex flex-col gap-4 my-10">
        {/* filter */}
        <div className="w-full sm:w-1/2 grid grid-cols-1 sm:flex sm:flex-row gap-4 sm:ml-auto   ">
          {filterInputs.map((input: any) => {
            if (input.type === InputTypes.DATE) {
              return (
                <div key={input.formKey} className="sm:mt-2 w-full">
                  <TextInput
                    key={input.formKey}
                    type={input.type}
                    value={
                      filterDailySummaryPanelFormElements[input.formKey] ?? ""
                    }
                    label={input.label ?? ""}
                    isDatePickerLabel={false}
                    placeholder={input.placeholder ?? ""}
                    onChange={handleChange(input.formKey)}
                    isDatePicker={input?.isDatePicker ?? false}
                  />
                </div>
              );
            } else if (input.type === InputTypes.SELECT) {
              const selectedValue = input.options?.find(
                (option: any) =>
                  option.value ===
                  filterDailySummaryPanelFormElements[input.formKey]
              );
              return (
                <div key={input.formKey} className="w-full ">
                  <SelectInput
                    key={input.formKey}
                    value={selectedValue}
                    options={input.options ?? []}
                    placeholder={input.placeholder ?? ""}
                    onChange={handleChangeForSelect(input.formKey)}
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
      </div>
    </>
  );
};

export default DailySummary;
