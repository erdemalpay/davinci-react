import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { pointHistoryStatuses } from "../../types";
import { useGetPointHistories } from "../../utils/api/pointHistory";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const UserPointHistory = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const {
    filterUserPointHistoryPanelFormElements,
    setFilterUserPointHistoryPanelFormElements,
    showUserPointHistoryFilters,
    setShowUserPointHistoryFilters,
  } = useFilterContext();

  // Always add current user to filters
  const userPointHistoryFilters = useMemo(() => {
    return {
      ...filterUserPointHistoryPanelFormElements,
      pointUser: user?._id,
    };
  }, [filterUserPointHistoryPanelFormElements, user?._id]);

  const pointHistoriesPayload = useGetPointHistories(
    currentPage,
    rowsPerPage,
    userPointHistoryFilters
  );
  const users = useGetUsers();

  const pad = useMemo(() => (num: number) => num < 10 ? `0${num}` : num, []);

  const rows = useMemo(() => {
    return pointHistoriesPayload?.data
      ?.map((pointHistory) => {
        if (!pointHistory?.createdAt) {
          return null;
        }
        const date = new Date(pointHistory.createdAt);
        return {
          ...pointHistory,
          usr: getItem(pointHistory?.pointUser, users)?.name,
          createdByUser: getItem(pointHistory?.createdBy, users)?.name,
          oldAmount:
            (pointHistory?.currentAmount ?? 0) - (pointHistory?.change ?? 0),
          date: format(pointHistory?.createdAt, "yyyy-MM-dd"),
          formattedDate: formatAsLocalDate(
            format(pointHistory?.createdAt, "yyyy-MM-dd")
          ),
          hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
        };
      })
      .filter((item) => item !== null);
  }, [pointHistoriesPayload, users, pad]);

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "status",
        label: t("Status"),
        options: pointHistoryStatuses?.map((item) => {
          return {
            value: item.value,
            label: t(item.label),
          };
        }),
        placeholder: t("Status"),
        isMultiple: true,
        required: true,
      },
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
    ],
    [t]
  );

  const columns = useMemo(
    () => [
      {
        key: t("Date"),
        isSortable: false,
        correspondingKey: "createdAt",
      },
      { key: t("Hour"), isSortable: false },
      {
        key: t("Created By"),
        isSortable: false,
        correspondingKey: "createdBy",
      },
      { key: t("Order ID"), isSortable: false },
      { key: t("Table ID"), isSortable: false },
      { key: t("Old Amount"), isSortable: false },
      { key: t("Change"), isSortable: false },
      { key: t("Current Amount"), isSortable: false },
      {
        key: t("Status"),
        isSortable: false,
        correspondingKey: "status",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "date",
        className: "min-w-32 pr-1",
        node: (row: any) => {
          return <p>{row.formattedDate}</p>;
        },
      },
      {
        key: "hour",
        className: "min-w-32 pr-1",
      },
      {
        key: "createdByUser",
        className: "min-w-32 pr-1",
      },
      {
        key: "orderId",
        className: "min-w-32 pr-1",
      },
      {
        key: "tableId",
        className: "min-w-32 pr-1",
      },
      {
        key: "oldAmount",
        className: "min-w-32 pr-1",
      },
      {
        key: "change",
        className: "min-w-32 pr-1",
      },
      {
        key: "currentAmount",
        className: "min-w-32 pr-1",
      },
      {
        key: "status",
        className: "min-w-32 pr-1",
        node: (row: any) => {
          const status = pointHistoryStatuses.find(
            (item) => item.value === row.status
          );
          if (!status) return null;
          return (
            <div
              className={`w-fit rounded-md text-sm px-2 py-1 font-semibold ${status?.backgroundColor} text-white`}
            >
              {t(status?.label)}
            </div>
          );
        },
      },
    ],
    [t]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showUserPointHistoryFilters}
            onChange={() => {
              setShowUserPointHistoryFilters(!showUserPointHistoryFilters);
            }}
          />
        ),
      },
    ],
    [t, showUserPointHistoryFilters, setShowUserPointHistoryFilters]
  );

  const pagination = useMemo(() => {
    return pointHistoriesPayload
      ? {
          totalPages: pointHistoriesPayload.totalPages,
          totalRows: pointHistoriesPayload.totalNumber,
        }
      : null;
  }, [pointHistoriesPayload]);

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showUserPointHistoryFilters,
      inputs: filterPanelInputs,
      formElements: filterUserPointHistoryPanelFormElements,
      setFormElements: setFilterUserPointHistoryPanelFormElements,
      closeFilters: () => setShowUserPointHistoryFilters(false),
    }),
    [
      showUserPointHistoryFilters,
      filterPanelInputs,
      filterUserPointHistoryPanelFormElements,
      setFilterUserPointHistoryPanelFormElements,
      setShowUserPointHistoryFilters,
    ]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterUserPointHistoryPanelFormElements,
      setFilterPanelFormElements: setFilterUserPointHistoryPanelFormElements,
    }),
    [
      filterUserPointHistoryPanelFormElements,
      setFilterUserPointHistoryPanelFormElements,
    ]
  );

  useMemo(() => {
    setCurrentPage(1);
  }, [filterUserPointHistoryPanelFormElements, setCurrentPage]);

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        columns={columns}
        rows={rows ?? []}
        filterPanel={filterPanel}
        filters={filters}
        isSearch={false}
        title={t("My Point History")}
        isActionsActive={false}
        outsideSortProps={outsideSort}
        {...(pagination && { pagination })}
      />
    </div>
  );
};

export default UserPointHistory;
