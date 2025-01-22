import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaGamepad } from "react-icons/fa";
import { FaMoneyBill1Wave } from "react-icons/fa6";
import { GiStorkDelivery } from "react-icons/gi";
import { MdOutlineFastfood } from "react-icons/md";
import { useOrderContext } from "../../context/Order.context";
import { commonDateOptions, DateRangeKey } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetGames } from "../../utils/api/game";
import { useGetPersonalGameplayCreateData } from "../../utils/api/gameplay";
import { useGetPersonalOrderDatas } from "../../utils/api/order/order";
import { useGetPersonalCollectionDatas } from "../../utils/api/order/orderCollection";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import InfoCard from "../common/InfoCard";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  userId: string;
};

const GameMasterSummary = ({ userId }: Props) => {
  const { t } = useTranslation();
  const personalOrderDatas = useGetPersonalOrderDatas();
  const personalCollectionDatas = useGetPersonalCollectionDatas();
  //   const tableCreateDatas = useGetPersonalTableCreateData();
  const gameplayDatas = useGetPersonalGameplayCreateData();
  const users = useGetUsers();
  const [showFilters, setShowFilters] = useState(false);
  const games = useGetGames();
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
  } = useOrderContext();
  const [tableKey, setTableKey] = useState(0);
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
    // const foundTableData = tableCreateDatas?.find(
    //   (tableData) => tableData.createdBy === userId
    // );
    return {
      createdByCount: foundPersonalOrderDatas?.createdByCount || 0,
      deliveredByCount: foundPersonalOrderDatas?.deliveredByCount || 0,
      gameplayCount: foundGameplayData?.gameplayCount || 0,
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
      icon: <FaGamepad />,
      title: t("Created Gameplay Count"),
      value: allUserInfos().gameplayCount.toString(),
      color: "orange",
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
    // tableCreateDatas,
    gameplayDatas,
    games,
    users,
  ]);
  return (
    <div key={tableKey} className="w-full  h-fit flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 ">
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
  );
};

export default GameMasterSummary;
