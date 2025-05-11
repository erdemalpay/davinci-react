import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import { GiStorkDelivery } from "react-icons/gi";
import { MdOutlineFastfood } from "react-icons/md";
import { useFilterContext } from "../../context/Filter.context";
import { useOrderContext } from "../../context/Order.context";
import { DateRangeKey, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetPersonalOrderDatas } from "../../utils/api/order/order";
import { useGetPersonalCollectionDatas } from "../../utils/api/order/orderCollection";
import { useGetShifts } from "../../utils/api/shift";
import { useGetFilteredVisits } from "../../utils/api/visit";
import InfoCard from "../common/InfoCard";
import FilterPanel from "../panelComponents/Tables/FilterPanel";
import { InputTypes } from "../panelComponents/shared/types";

type Props = {
  userId: string;
};

const ServicePersonalSummary = ({ userId }: Props) => {
  const { t } = useTranslation();
  const personalOrderDatas = useGetPersonalOrderDatas();
  const personalCollectionDatas = useGetPersonalCollectionDatas();
  const { showPersonalSummaryFilters, setShowPersonalSummaryFilters } =
    useFilterContext();
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useOrderContext();
  const shifts = useGetShifts(
    filterPanelFormElements.after,
    filterPanelFormElements.before
  );
  const visits = useGetFilteredVisits(
    filterPanelFormElements.after,
    filterPanelFormElements.before,
    userId
  );
  const [tableKey, setTableKey] = useState(0);
  const allUserInfos = () => {
    const foundPersonalOrderDatas = personalOrderDatas?.find(
      (item) => item.user === userId
    );
    const foundPersonalCollectionData = personalCollectionDatas?.find(
      (data) => data.createdBy === userId
    );
    return {
      createdByCount: foundPersonalOrderDatas?.createdByCount || 0,
      deliveredByCount: foundPersonalOrderDatas?.deliveredByCount || 0,
      collectionCount: foundPersonalCollectionData?.totalCollections || 0,
    };
  };
  const userInfoCards = [
    {
      icon: <MdOutlineFastfood />,
      title: t("Order Created Count"),
      value: allUserInfos().createdByCount.toString(),
      color: "blue",
    },
    {
      icon: <GiStorkDelivery />,
      title: t("Order Delivered Count"),
      value: allUserInfos().deliveredByCount.toString(),
      color: "green",
    },
    {
      icon: <FaMoneyBill1Wave />,
      title: t("Collection Count"),
      value: allUserInfos().collectionCount.toString(),
      color: "red",
    },
  ];
  const filterPanelInputs = [
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
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [personalOrderDatas, personalCollectionDatas, shifts, visits]);
  const filterPanel = {
    isFilterPanelActive: showPersonalSummaryFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    isCloseButtonActive: false,
    closeFilters: () => setShowPersonalSummaryFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
  };
  return (
    <div key={tableKey} className="w-full  flex flex-row gap-6">
      <FilterPanel {...filterPanel} />
      <div className=" grid grid-cols-1 md:grid-cols-3 gap-4 h-32 ">
        {userInfoCards.map((card, index) => (
          <InfoCard
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            color={card.color}
          />
        ))}
      </div>
    </div>
  );
};

export default ServicePersonalSummary;
