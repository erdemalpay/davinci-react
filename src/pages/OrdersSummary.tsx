import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import SummaryCard from "../components/orders/ordersSummary/SummaryCard";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useOrderContext } from "../context/Order.context";
import { TURKISHLIRA } from "../types";
import { useGetSummaryCollectionTotal } from "../utils/api/order/orderCollection";
import { formatAsLocalDate } from "../utils/format";

const OrdersSummary = () => {
  const { t } = useTranslation();
  const [componentKey, setComponentKey] = useState(0);
  const { filterSummaryFormElements, setFilterSummaryFormElements } =
    useOrderContext();
  const totalIncome = useGetSummaryCollectionTotal();
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [totalIncome, filterSummaryFormElements]);

  const handleChange = (key: string) => (value: string) => {
    setFilterSummaryFormElements((prev: any) => ({ ...prev, [key]: value }));
  };
  const filterInputs = [
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
  return (
    <>
      <Header showLocationSelector={true} />
      <div className="w-full px-4 flex flex-col gap-4 my-10">
        {/* filter */}
        <div className="w-full sm:w-1/3 ml-auto grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-2">
          {filterInputs.map((input) => (
            <TextInput
              key={input.formKey}
              type={input.type}
              value={filterSummaryFormElements[input.formKey] ?? ""}
              label={input.label ?? ""}
              isDatePickerLabel={false}
              placeholder={input.placeholder ?? ""}
              onChange={handleChange(input.formKey)}
              isDatePicker={input.isDatePicker ?? false}
            />
          ))}
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
                : ""
            }
            sideColor={"#1D4ED8"}
          />
        </div>
      </div>
    </>
  );
};

export default OrdersSummary;
