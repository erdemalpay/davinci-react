import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import SummaryCard from "../components/orders/ordersSummary/SummaryCard";
import { useOrderContext } from "../context/Order.context";
import { TURKISHLIRA } from "../types";
import { useGetSummaryCollectionTotal } from "../utils/api/order/orderCollection";
import { formatAsLocalDate } from "../utils/format";

const OrdersSummary = () => {
  const { t } = useTranslation();
  const [componentKey, setComponentKey] = useState(0);
  const { filterSummaryFormElements } = useOrderContext();
  const totalIncome = useGetSummaryCollectionTotal();
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [totalIncome, filterSummaryFormElements]);
  return (
    <>
      <Header showLocationSelector={true} />
      <div
        key={componentKey}
        className="w-full my-20 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 px-4"
      >
        <SummaryCard
          header={t("Total Income")}
          firstSubHeader={
            formatAsLocalDate(filterSummaryFormElements?.after) +
            (filterSummaryFormElements?.before &&
              "-" + formatAsLocalDate(filterSummaryFormElements?.before)) +
            (!filterSummaryFormElements?.before &&
              format(new Date(), "yyyy-mm-dd") !==
                filterSummaryFormElements?.after &&
              "-" + format(new Date(), "dd/MM/yyyy"))
          }
          firstSubHeaderValue={
            totalIncome ? totalIncome.toString() + " " + TURKISHLIRA : ""
          }
          sideColor={"#1D4ED8"}
        />
      </div>
    </>
  );
};

export default OrdersSummary;
