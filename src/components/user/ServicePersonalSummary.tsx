import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import { GiStorkDelivery } from "react-icons/gi";
import { LuTimerOff } from "react-icons/lu";
import { MdOutlineFastfood, MdOutlineTimelapse, MdTimer } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { useFilterContext } from "../../context/Filter.context";
import { useOrderContext } from "../../context/Order.context";
import {
  DateRangeKey,
  LocationShiftType,
  VisitPageTabEnum,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetPersonalOrderDatas } from "../../utils/api/order/order";
import { useGetPersonalCollectionDatas } from "../../utils/api/order/orderCollection";
import { useGetUserShifts } from "../../utils/api/shift";
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
  const navigate = useNavigate();
  const personalCollectionDatas = useGetPersonalCollectionDatas();
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
  const [tableKey, setTableKey] = useState(0);
  let fullTimeAttendance = 0;
  let partTimeAttendance = 0;
  let unknownAttendance = 0;
  visits?.forEach((visit) => {
    const foundShift = shifts
      ?.find(
        (shift) =>
          shift.day === visit.date &&
          shift.location === visit.location &&
          shift.shifts?.some((s) => s.user?.includes(userId))
      )
      ?.shifts?.find((shift) => shift.user?.includes(userId));
    if (foundShift) {
      const foundLocation = locations?.find(
        (location) => location._id === visit.location
      );
      if (foundLocation) {
        const foundShiftType = foundLocation.shifts?.find(
          (shift) => shift.shift === foundShift.shift && shift.isActive
        )?.type;
        if (foundShiftType === LocationShiftType.FULLTIME) {
          fullTimeAttendance++;
        } else if (foundShiftType === LocationShiftType.PARTTIME) {
          partTimeAttendance++;
        } else {
          unknownAttendance++;
        }
      }
    } else {
      unknownAttendance++;
    }
  });
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
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [personalOrderDatas, personalCollectionDatas, shifts, visits, locations]);
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
          <InfoCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
};

export default ServicePersonalSummary;
