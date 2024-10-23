import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { Header } from "../components/header/Header";
import SummaryCard from "../components/orders/ordersSummary/SummaryCard";
import SelectInput from "../components/panelComponents/FormElements/SelectInput";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useOrderContext } from "../context/Order.context";
import { TURKISHLIRA } from "../types";
import { useGetLocations } from "../utils/api/location";
import { useGetSummaryCollectionTotal } from "../utils/api/order/orderCollection";
import { formatAsLocalDate } from "../utils/format";

type OptionType = { value: number; label: string };

const OrdersSummary = () => {
  const { t } = useTranslation();
  const [componentKey, setComponentKey] = useState(0);
  const locations = useGetLocations();
  const { filterSummaryFormElements, setFilterSummaryFormElements } =
    useOrderContext();
  const totalIncome = useGetSummaryCollectionTotal();
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
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "before",
      label: t("End Date"),
      placeholder: t("End Date"),
      required: true,
      isDatePicker: true,
    },
  ];

  const handleChange = (key: string) => (value: string) => {
    setFilterSummaryFormElements((prev: any) => ({ ...prev, [key]: value }));
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
          setFilterSummaryFormElements((prev: any) => ({
            ...prev,
            [key]: (selectedValue as OptionType)?.value,
          }));
        } else {
          setFilterSummaryFormElements((prev: any) => ({
            ...prev,
            [key]: "",
          }));
        }
      }
    };
  function getDateRange() {
    const afterDate = formatAsLocalDate(filterSummaryFormElements?.after);
    const beforeDate = filterSummaryFormElements?.before
      ? formatAsLocalDate(filterSummaryFormElements?.before)
      : null;
    const currentDate = format(new Date(), "dd/MM/yyyy");

    return beforeDate
      ? `${afterDate} - ${beforeDate}`
      : `${afterDate} - ${currentDate}`;
  }

  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [totalIncome, filterSummaryFormElements, locations]);
  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-full px-4 flex flex-col gap-4 my-10">
        {/* filter */}
        <div className="w-full sm:w-1/2 grid grid-cols-1 sm:flex sm:flex-row gap-4 sm:ml-auto   ">
          {filterInputs.map((input: any) => {
            if (input.type === InputTypes.DATE) {
              return (
                <div className="sm:mt-2 w-full">
                  <TextInput
                    key={input.formKey}
                    type={input.type}
                    value={filterSummaryFormElements[input.formKey] ?? ""}
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
                  option.value === filterSummaryFormElements[input.formKey]
              );
              return (
                <div className="w-full ">
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

        {/* summary cards*/}
        <div
          key={componentKey}
          className="w-full  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 "
        >
          <SummaryCard
            header={t("Total Income")}
            firstSubHeader={getDateRange()}
            firstSubHeaderValue={
              totalIncome
                ? totalIncome.toLocaleString("tr-TR") + " " + TURKISHLIRA
                : "0 " + TURKISHLIRA
            }
            sideColor={"#1D4ED8"}
          />
        </div>
      </div>
    </>
  );
};

export default OrdersSummary;
