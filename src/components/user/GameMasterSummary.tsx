import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaGamepad } from "react-icons/fa";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import { GiMasterOfArms, GiStorkDelivery } from "react-icons/gi";
import { LuTimerOff } from "react-icons/lu";
import { MdOutlineFastfood, MdOutlineTimelapse, MdTimer } from "react-icons/md";
import { PiPersonArmsSpreadFill } from "react-icons/pi";
import { SiPointy } from "react-icons/si";
import { useOrderContext } from "../../context/Order.context";
import {
  DateRangeKey,
  LocationShiftType,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetGames } from "../../utils/api/game";
import {
  useGetPersonalGameplayCreateData,
  useGetPersonalGameplayMentoredData,
} from "../../utils/api/gameplay";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetPersonalOrderDatas } from "../../utils/api/order/order";
import { useGetPersonalCollectionDatas } from "../../utils/api/order/orderCollection";
import { useGetUserShifts } from "../../utils/api/shift";
import { useGetUsers } from "../../utils/api/user";
import { useGetFilteredVisits } from "../../utils/api/visit";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import InfoCard from "../common/InfoCard";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
type Props = {
  userId: string;
};

const GameMasterSummary = ({ userId }: Props) => {
  const { t } = useTranslation();
  const personalOrderDatas = useGetPersonalOrderDatas();
  const personalCollectionDatas = useGetPersonalCollectionDatas();
  const gameplayDatas = useGetPersonalGameplayCreateData();
  const gameplayMentoredDatas = useGetPersonalGameplayMentoredData();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const users = useGetUsers();
  const games = useGetGames();
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useOrderContext();
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
    const foundGameplayData = gameplayDatas?.find(
      (gameplayData) => gameplayData.createdBy === userId
    );
    const foundPersonalCollectionData = personalCollectionDatas?.find(
      (data) => data.createdBy === userId
    );
    const foundGameplayMentoredData = gameplayMentoredDatas.find(
      (gameplayData) => gameplayData.mentoredBy === userId
    );
    const userLearnedGamesTotalPoints =
      getItem(userId, users)?.userGames?.reduce((acc, item) => {
        const foundGame = games?.find((game) => game._id === item.game);

        if (!foundGame?.narrationDurationPoint) return acc;

        const beforeFilter =
          !filterPanelFormElements.before ||
          item?.learnDate <= filterPanelFormElements.before;
        const afterFilter =
          !filterPanelFormElements.after ||
          item?.learnDate >= filterPanelFormElements.after;

        if (beforeFilter && afterFilter) {
          return acc + foundGame.narrationDurationPoint;
        }

        return acc;
      }, 0) || 0;
    return {
      createdByCount: foundPersonalOrderDatas?.createdByCount || 0,
      deliveredByCount: foundPersonalOrderDatas?.deliveredByCount || 0,
      gameplayCount: foundGameplayData?.gameplayCount || 0,
      collectionCount: foundPersonalCollectionData?.totalCollections || 0,
      mentoredGameplayCount: foundGameplayMentoredData?.gameplayCount || 0,
      mentoredGamesTotalPoints:
        foundGameplayMentoredData?.totalNarrationDurationPoint || 0,
      userLearnedGamesTotalPoints,
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
      icon: <FaGamepad />,
      title: t("Created Gameplay Count"),
      value: allUserInfos().gameplayCount,
      isAverage: true,
      averageValue:
        unknownAttendance === 0 && attendancePoint > 0
          ? (allUserInfos().gameplayCount / attendancePoint)
              .toFixed(2)
              .replace(/\.?0+$/, "")
          : "",
      color: "orange",
    },
    {
      icon: <PiPersonArmsSpreadFill />,
      title: t("Mentored Gameplay Count"),
      value: allUserInfos().mentoredGameplayCount,
      isAverage: true,
      averageValue:
        unknownAttendance === 0 && attendancePoint > 0
          ? (allUserInfos().mentoredGameplayCount / attendancePoint)
              .toFixed(2)
              .replace(/\.?0+$/, "")
          : "",
      color: "purple",
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
    {
      icon: <SiPointy />,
      title: t("Learned Games Total Points"),
      value: allUserInfos().userLearnedGamesTotalPoints,
      isAverage: true,
      averageValue:
        unknownAttendance === 0 && fullTimeAttendance > 0
          ? (allUserInfos().userLearnedGamesTotalPoints / fullTimeAttendance)
              .toFixed(2)
              .replace(/\.?0+$/, "")
          : "",
      color: "pink",
    },
    {
      icon: <GiMasterOfArms />,
      title: t("Mentored Games Total Points"),
      value: allUserInfos().mentoredGamesTotalPoints,
      isAverage: true,
      averageValue:
        unknownAttendance === 0 && attendancePoint > 0
          ? (allUserInfos().mentoredGamesTotalPoints / attendancePoint)
              .toFixed(2)
              .replace(/\.?0+$/, "")
          : "",
      color: "brown",
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
  const allRows = () => {
    const foundUser = users?.find((user) => user._id === userId);
    if (!foundUser || !foundUser.userGames) {
      return [];
    }
    return foundUser.userGames.map((item) => {
      const foundGame = games?.find((game) => game._id === item.game);
      return {
        game: foundGame?.name,
        gameId: foundGame?._id,
        userName: foundUser.name,
        userId: foundUser._id,
        learnDate: item.learnDate,
      };
    });
  };
  const [rows, setRows] = useState(allRows());
  const columns = [
    { key: t("Game"), isSortable: true },
    { key: t("Learn Date"), isSortable: true },
  ];
  const rowKeys = [
    { key: "game" },
    {
      key: "learnDate",
      className: `min-w-32   `,
      node: (row: any) => {
        return <p>{formatAsLocalDate(row.learnDate)}</p>;
      },
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
    isFilterPanelCoverTable: true,
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    const filteredRows = allRows()?.filter((row) => {
      if (!row?.learnDate) {
        return false;
      }
      return (
        (filterPanelFormElements.before === "" ||
          row.learnDate <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          row.learnDate >= filterPanelFormElements.after)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    personalOrderDatas,
    personalCollectionDatas,
    gameplayMentoredDatas,
    gameplayDatas,
    games,
    users,
    shifts,
    visits,
    locations,
  ]);
  return (
    <div
      key={tableKey}
      className="w-full grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      <div className="border p-2 rounded-lg border-gray-200 bg-white col-span-1">
        <GenericTable
          key={tableKey}
          columns={columns}
          filterPanel={filterPanel}
          filters={filters}
          rows={rows}
          rowKeys={rowKeys}
          title={t("Learned Games")}
          isActionsActive={false}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 col-span-2 h-fit">
        {userInfoCards.map((card, index) => (
          <InfoCard
            key={index}
            icon={card.icon}
            title={card.title}
            value={card.value}
            color={card.color}
            isAverage={card?.isAverage ?? false}
            averageValue={card?.averageValue ?? ""}
          />
        ))}
      </div>
    </div>
  );
};
export default GameMasterSummary;
