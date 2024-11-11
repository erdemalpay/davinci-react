import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import { commonDateOptions, DateRangeKey, Order } from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import { useGetPersonalGameplayCreateData } from "../../utils/api/gameplay";
import { useGetPersonalOrderDatas } from "../../utils/api/order/order";
import { useGetPersonalTableCreateData } from "../../utils/api/table";
import { useGetUsers } from "../../utils/api/user";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

interface PersonalOrderData {
  user: string;
  createdByCount: number;
  createdByTableCount: number;
  preparedByCount: number;
  preparedByTableCount: number;
  cancelledByCount: number;
  cancelledByTableCount: number;
  deliveredByCount: number;
  deliveredByTableCount: number;
  createdByTables: Set<number>;
  preparedByTables: Set<number>;
  cancelledByTables: Set<number>;
  deliveredByTables: Set<number>;
  tableCount: number;
  gameplayCount: number;
}
interface RoleDetail {
  key: keyof Order;
  countProp: keyof PersonalOrderDataCounts;
  tableProp: keyof PersonalOrderDataTables;
  tableCountProp: keyof PersonalOrderDataCounts;
}

type PersonalOrderDataCounts = Pick<
  PersonalOrderData,
  | "createdByCount"
  | "preparedByCount"
  | "cancelledByCount"
  | "deliveredByCount"
  | "createdByTableCount"
  | "preparedByTableCount"
  | "cancelledByTableCount"
  | "deliveredByTableCount"
>;
type PersonalOrderDataTables = Pick<
  PersonalOrderData,
  | "createdByTables"
  | "preparedByTables"
  | "cancelledByTables"
  | "deliveredByTables"
>;

const PersonalOrderDatas = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const personalOrderDatas = useGetPersonalOrderDatas();
  const tableCreateDatas = useGetPersonalTableCreateData();
  const gameplayDatas = useGetPersonalGameplayCreateData();
  const queryClient = useQueryClient();
  const [tableKey, setTableKey] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const { filterPanelFormElements, setFilterPanelFormElements } =
    useOrderContext();
  if (!gameplayDatas || !users || !tableCreateDatas || !personalOrderDatas) {
    return null;
  }

  const allRows = personalOrderDatas.map((personalOrderData) => {
    const foundTableData = tableCreateDatas.find(
      (tableData) => tableData.createdBy === personalOrderData.user
    );
    const foundGameplayData = gameplayDatas.find(
      (gameplayData) => gameplayData.mentor === personalOrderData.user
    );
    console.log(foundGameplayData);
    console.log(personalOrderData.user);
    return {
      ...personalOrderData,
      tableCount: foundTableData?.tableCount || 0,
      gameplayCount: foundGameplayData?.gameplayCount || 0,
    };
  });

  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("User"), isSortable: true },
    { key: t("Created By Count"), isSortable: true },
    { key: t("Table Count"), isSortable: true },
    { key: t("Prepared By Count"), isSortable: true },
    { key: t("Table Count"), isSortable: true },
    { key: t("Delivered By Count"), isSortable: true },
    { key: t("Table Count"), isSortable: true },
    { key: t("Cancelled By Count"), isSortable: true },
    { key: t("Table Count"), isSortable: true },
    { key: t("Created Table Count"), isSortable: true },
    { key: t("Created Gameplay Count"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "user",
      node: (row: PersonalOrderData) => {
        const user = users.find((user) => user._id === row.user);
        return user?.name;
      },
    },
    { key: "createdByCount" },
    { key: "createdByTableCount" },
    { key: "preparedByCount" },
    { key: "preparedByTableCount" },
    { key: "deliveredByCount" },
    { key: "deliveredByTableCount" },
    { key: "cancelledByCount" },
    { key: "cancelledByTableCount" },
    { key: "tableCount" },
    { key: "gameplayCount" },
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
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      isUpperSide: false,
      node: (
        <ButtonFilter
          buttonName={t("Refresh Data")}
          onclick={() => {
            queryClient.invalidateQueries([`${Paths.Order}/query`]);
            queryClient.invalidateQueries([`${Paths.Order}/collection/query`]);
          }}
        />
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  useEffect(() => {
    console.log(gameplayDatas);
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    users,
    filterPanelFormElements,
    personalOrderDatas,
    tableCreateDatas,
    gameplayDatas,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
          key={tableKey}
          title={t("Personal Order Datas")}
          columns={columns}
          rowKeys={rowKeys}
          rows={rows}
          isActionsActive={false}
          filterPanel={filterPanel}
          filters={filters}
        />
      </div>
    </>
  );
};

export default PersonalOrderDatas;
