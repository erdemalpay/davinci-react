import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
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
import { useGetAllUserRoles, useGetUsersMinimal } from "../../utils/api/user";
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
  const users = useGetUsersMinimal();
  const personalOrderDatas = useGetPersonalOrderDatas();
  const personalCollectionDatas = useGetPersonalCollectionDatas();
  const tableCreateDatas = useGetPersonalTableCreateData();
  const gameplayDatas = useGetPersonalGameplayCreateData();
  const gameplayMentoredDatas = useGetPersonalGameplayMentoredData();
  const roles = useGetAllUserRoles();
  const discounts = useGetOrderDiscounts();
  const queryClient = useQueryClient();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();

  const {
    filterPanelFormElements,
    setFilterPanelFormElements,
    initialFilterPanelFormElements,
    showOrderDataFilters,
    setShowOrderDataFilters,
  } = useOrderContext();

  const personalOrderDatasPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ORDERDATAS_PERSONALORDERDATAS,
      disabledConditions
    );
  }, [disabledConditions]);

  if (!gameplayDatas || !users || !tableCreateDatas || !personalOrderDatas) {
    return <Loading />;
  }

  const allRows = useMemo(() => {
    return personalOrderDatas.map((personalOrderData) => {
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
  }, [
    personalOrderDatas,
    tableCreateDatas,
    gameplayDatas,
    personalCollectionDatas,
    gameplayMentoredDatas,
    users,
  ]);

  const rows = useMemo(() => {
    return allRows?.filter((row) => {
      return (
        filterPanelFormElements?.role?.length === 0 ||
        filterPanelFormElements?.role?.includes(row?.userInfo?.role?._id)
      );
    });
  }, [allRows, filterPanelFormElements]);

  const columns = useMemo(
    () => [
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
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
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
    ],
    []
  );

  const filterPanelInputs = useMemo(
    () => [
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
    ],
    [roles, discounts, t, filterPanelFormElements, setFilterPanelFormElements]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showOrderDataFilters,
      inputs: filterPanelInputs,
      formElements: filterPanelFormElements,
      setFormElements: setFilterPanelFormElements,
      closeFilters: () => setShowOrderDataFilters(false),
      additionalFilterCleanFunction: () => {
        setFilterPanelFormElements(initialFilterPanelFormElements);
      },
    }),
    [
      showOrderDataFilters,
      filterPanelInputs,
      filterPanelFormElements,
      setFilterPanelFormElements,
      setShowOrderDataFilters,
      initialFilterPanelFormElements,
    ]
  );

  const filters = useMemo(
    () => [
      {
        isUpperSide: false,
        node: (
          <ButtonFilter
            buttonName={t("Refresh Data")}
            onclick={() => {
              queryClient.invalidateQueries([`${Paths.Order}/query`]);
              queryClient.invalidateQueries([
                `${Paths.Order}/collection/query`,
              ]);
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
    ],
    [
      t,
      queryClient,
      personalOrderDatasPageDisabledCondition,
      user,
      showOrderDataFilters,
      setShowOrderDataFilters,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto mb-auto ">
        <GenericTable
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
