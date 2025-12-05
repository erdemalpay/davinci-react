import { format } from "date-fns";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useFilterContext } from "../context/Filter.context";
import { useGeneralContext } from "../context/General.context";
import { pointHistoryStatuses } from "../types";
import { useGetPointHistories } from "../utils/api/pointHistory";
import { useGetUsersMinimal } from "../utils/api/user";
import { formatAsLocalDate } from "../utils/format";
import { getItem } from "../utils/getItem";

const PointHistory = () => {
  const { t } = useTranslation();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const {
    filterPointHistoryPanelFormElements,
    setFilterPointHistoryPanelFormElements,
    showPointHistoryFilters,
    setShowPointHistoryFilters,
  } = useFilterContext();
  const pointHistoriesPayload = useGetPointHistories(
    currentPage,
    rowsPerPage,
    filterPointHistoryPanelFormElements
  );
  const users = useGetUsersMinimal(); 

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
          newAmount:
            (pointHistory?.currentAmount ?? 0) + (pointHistory?.change ?? 0),
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
        formKey: "pointUser",
        label: t("Point User"),
        options: users.map((user) => {
          return {
            value: user._id,
            label: user.name,
          };
        }),
        placeholder: t("Point User"),
        required: true,
      },
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
    [users, t]
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
        key: t("Point User"),
        isSortable: false,
        correspondingKey: "pointUser",
      },
      {
        key: t("Created By"),
        isSortable: false,
        correspondingKey: "createdBy",
      },
      { key: t("Order ID"), isSortable: false },
      { key: t("Table ID"), isSortable: false },
      { key: t("Current Amount"), isSortable: false },
      { key: t("Change"), isSortable: false },
      { key: t("New Amount"), isSortable: false },
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
        key: "usr",
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
        key: "currentAmount",
        className: "min-w-32 pr-1",
      },
      {
        key: "change",
        className: "min-w-32 pr-1",
      },
      {
        key: "newAmount",
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
            checked={showPointHistoryFilters}
            onChange={() => {
              setShowPointHistoryFilters(!showPointHistoryFilters);
            }}
          />
        ),
      },
    ],
    [t, showPointHistoryFilters, setShowPointHistoryFilters]
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
      isFilterPanelActive: showPointHistoryFilters,
      inputs: filterPanelInputs,
      formElements: filterPointHistoryPanelFormElements,
      setFormElements: setFilterPointHistoryPanelFormElements,
      closeFilters: () => setShowPointHistoryFilters(false),
    }),
    [
      showPointHistoryFilters,
      filterPanelInputs,
      filterPointHistoryPanelFormElements,
      setFilterPointHistoryPanelFormElements,
      setShowPointHistoryFilters,
    ]
  );

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterPointHistoryPanelFormElements,
      setFilterPanelFormElements: setFilterPointHistoryPanelFormElements,
    };
  }, [t, filterPointHistoryPanelFormElements, setFilterPointHistoryPanelFormElements]);

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterPointHistoryPanelFormElements,
      setFilterPanelFormElements: setFilterPointHistoryPanelFormElements,
    }),
    [
      filterPointHistoryPanelFormElements,
      setFilterPointHistoryPanelFormElements,
    ]
  );

  useMemo(() => {
    setCurrentPage(1);
  }, [filterPointHistoryPanelFormElements, setCurrentPage]);

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows ?? []}
          filterPanel={filterPanel}
          filters={filters}
          outsideSearchProps={outsideSearchProps}
          isSearch={false}
          title={t("Point History")}
          isActionsActive={false}
          outsideSortProps={outsideSort}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default PointHistory;
