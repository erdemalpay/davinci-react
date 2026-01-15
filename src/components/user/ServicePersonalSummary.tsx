import React from "react";
import { useTranslation } from "react-i18next";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import { GiStorkDelivery } from "react-icons/gi";
import { LuTimerOff } from "react-icons/lu";
import { MdOutlineFastfood, MdOutlineTimelapse, MdTimer } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useFilterContext } from "../../context/Filter.context";
import { useOrderContext } from "../../context/Order.context";
import { DateRangeKey, VisitPageTabEnum, commonDateOptions } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetPersonalOrderDatas } from "../../utils/api/order/order";
import { useGetPersonalCollectionDatas } from "../../utils/api/order/orderCollection";
import { useGetUserShifts } from "../../utils/api/shift";
import { useGetFilteredVisits } from "../../utils/api/visit";
import InfoCard from "../common/InfoCard";
import FilterPanel from "../panelComponents/Tables/FilterPanel";
import { InputTypes } from "../panelComponents/shared/types";
import AttendanceCalendar from "./AttendanceCalendar";

type Props = {
  userId: string;
};

const ServicePersonalSummary = ({ userId }: Props) => {
  const { t } = useTranslation();
  const personalOrderDatas = useGetPersonalOrderDatas();
  const navigate = useNavigate();
  const personalCollectionDatas = useGetPersonalCollectionDatas();
  const [fullTimeAttendance, setFullTimeAttendance] = React.useState(0);
  const [partTimeAttendance, setPartTimeAttendance] = React.useState(0);
  const [unknownAttendance, setUnknownAttendance] = React.useState(0);
  const { showPersonalSummaryFilters, setShowPersonalSummaryFilters } =
    useFilterContext();
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useOrderContext();
  const {
    setFilterVisitScheduleOverviewPanelFormElements,
    setShowVisitScheduleOverviewFilters,
    setVisitsActiveTab,
  } = useFilterContext();
  const shifts = useGetUserShifts(
    filterPanelFormElements.after,
    filterPanelFormElements.before
  );
  const visits = useGetFilteredVisits(
    filterPanelFormElements.after,
    filterPanelFormElements.before,
    userId
  );
  const locations = useGetStoreLocations();

  const attendancePoint = fullTimeAttendance + partTimeAttendance * 0.5;

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
      icon: <MdTimer />,
      title: t("Days of Full-time Attendance"),
      value: fullTimeAttendance,
      color: "green",
    },
    {
      icon: <MdOutlineTimelapse />,
      title: t("Days of Part-time Attendance"),
      value: partTimeAttendance,
      color: "purple",
    },
    {
      icon: <LuTimerOff />,
      title: t("Unknown Attendance"),
      value: unknownAttendance,
      color: "red",
      ...(Number(unknownAttendance) > 0 && {
        onClick: () => {
          setFilterVisitScheduleOverviewPanelFormElements({
            date: "",
            after: filterPanelFormElements.after,
            before: filterPanelFormElements.before,
            user: userId,
            location: "",
          });
          setShowVisitScheduleOverviewFilters(true);
          setVisitsActiveTab(VisitPageTabEnum.VISITSCHEDULEOVERVIEW);
          navigate(`/visits`);
        },
      }),
    },
    {
      icon: <MdOutlineFastfood />,
      title: t("Order Created Count"),
      value: allUserInfos().createdByCount,
      isAverage: true,
      averageValue:
        unknownAttendance === 0 && attendancePoint > 0
          ? (allUserInfos().createdByCount / attendancePoint)
              .toFixed(2)
              .replace(/\.?0+$/, "")
          : "",
      color: "blue",
    },
    {
      icon: <GiStorkDelivery />,
      title: t("Order Delivered Count"),
      value: allUserInfos().deliveredByCount,
      isAverage: true,
      averageValue:
        unknownAttendance === 0 && attendancePoint > 0
          ? (allUserInfos().deliveredByCount / attendancePoint)
              .toFixed(2)
              .replace(/\.?0+$/, "")
          : "",
      color: "green",
    },
    {
      icon: <FaMoneyBill1Wave />,
      title: t("Collection Count"),
      value: allUserInfos().collectionCount,
      isAverage: true,
      averageValue:
        unknownAttendance === 0 && attendancePoint > 0
          ? (allUserInfos().collectionCount / attendancePoint)
              .toFixed(2)
              .replace(/\.?0+$/, "")
          : "",
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
    <div className="w-full flex flex-col gap-6">
      <AttendanceCalendar
        visits={visits || []}
        shifts={shifts || []}
        locations={locations || []}
        userId={userId}
        onAttendanceChange={({
          fullTimeAttendance: ft,
          partTimeAttendance: pt,
          unknownAttendance: ua,
        }) => {
          setFullTimeAttendance(ft);
          setPartTimeAttendance(pt);
          setUnknownAttendance(ua);
        }}
      />
      <div className="w-full flex flex-row gap-6">
        <FilterPanel {...filterPanel} />
        <div className=" grid grid-cols-1 md:grid-cols-3 gap-4 h-32 ">
          {userInfoCards.map((card, index) => (
            <InfoCard key={index} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ServicePersonalSummary;
