import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
  Order,
  User,
  commonDateOptions,
} from "../../types";
import { dateRanges } from "../../utils/api/dateRanges";
import { Paths } from "../../utils/api/factory";
import {
  useGetPersonalGameplayCreateData,
  useGetPersonalGameplayMentoredData,
} from "../../utils/api/gameplay";
import { useGetPersonalOrderDatas } from "../../utils/api/order/order";
import { useGetPersonalCollectionDatas } from "../../utils/api/order/orderCollection";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetPersonalTableCreateData } from "../../utils/api/table";
import { useGetAllUserRoles, useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import Loading from "../common/Loading";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

interface PersonalOrderData {
  user: string;
  userInfo: User;
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
  const personalCollectionDatas = useGetPersonalCollectionDatas();
  const tableCreateDatas = useGetPersonalTableCreateData();
  const gameplayDatas = useGetPersonalGameplayCreateData();
  const gameplayMentoredDatas = useGetPersonalGameplayMentoredData();
  const [tableKey, setTableKey] = useState(0);
  const roles = useGetAllUserRoles();
  const discounts = useGetOrderDiscounts();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const personalOrderDatasPageDisabledCondition = getItem(
    DisabledConditionEnum.ORDERDATAS_PERSONALORDERDATAS,
    disabledConditions
  );
  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();
  if (!gameplayDatas || !users || !tableCreateDatas || !personalOrderDatas) {
    return <Loading />;
  }
  const allRows = personalOrderDatas.map((personalOrderData) => {
    const foundTableData = tableCreateDatas.find(
      (tableData) => tableData.createdBy === personalOrderData.user
    );
    const foundGameplayData = gameplayDatas.find(
      (gameplayData) => gameplayData.createdBy === personalOrderData.user
    );
    const foundPersonalCollectionData = personalCollectionDatas.find(
      (data) => data.createdBy === personalOrderData.user
    );
    const foundGameplayMentoredData = gameplayMentoredDatas.find(
      (gameplayData) => gameplayData.mentoredBy === personalOrderData.user
    );
    return {
      ...personalOrderData,
      userInfo: getItem(personalOrderData.user, users),
      tableCount: foundTableData?.tableCount || 0,
      gameplayCount: foundGameplayData?.gameplayCount || 0,
      collectionCount: foundPersonalCollectionData?.totalCollections,
      mentoredGameplayCount: foundGameplayMentoredData?.gameplayCount || 0,
      mentoredGamesTotalPoints:
        foundGameplayMentoredData?.totalNarrationDurationPoint || 0,
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
    { key: t("Collection Count"), isSortable: true },
    { key: t("Created Gameplay Count"), isSortable: true },
    { key: t("Mentored Gameplay Count"), isSortable: true },
    { key: t("Mentored Games Total Points"), isSortable: true },
  ];
  const rowKeys = [
    {
      key: "user",
      node: (row: PersonalOrderData) => {
        return row?.userInfo?.name;
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
    { key: "collectionCount" },
    { key: "gameplayCount" },
    { key: "mentoredGameplayCount" },
    { key: "mentoredGamesTotalPoints" },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "role",
      label: t("Role"),
      options: roles.map((role) => {
        return {
          value: role._id,
          label: role.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Role"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "eliminatedDiscounts",
      label: t("Eliminated Discounts"),
      options: discounts?.map((discount) => {
        return {
          value: discount._id,
          label: discount.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Eliminated Discounts"),
      required: true,
    },
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
    isFilterPanelActive: showOrderDataFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowOrderDataFilters(false),
    additionalFilterCleanFunction: () => {
      setFilterPanelFormElements(initialFilterPanelFormElements);
    },
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
      isDisabled: personalOrderDatasPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.REFRESH &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showOrderDataFilters}
          onChange={() => {
            setShowOrderDataFilters(!showOrderDataFilters);
          }}
        />
      ),
    },
  ];
  useEffect(() => {
    const filteredRows = allRows?.filter((row) => {
      return (
        filterPanelFormElements?.role?.length === 0 ||
        filterPanelFormElements?.role?.includes(row?.userInfo?.role?._id)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    users,
    personalOrderDatas,
    personalCollectionDatas,
    tableCreateDatas,
    gameplayDatas,
    gameplayMentoredDatas,
    roles,
    filterPanelFormElements,
    discounts,
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
