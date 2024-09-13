import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { stockHistoryStatuses } from "../../types";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import { useGetAccountFixtureStockHistorys } from "../../utils/api/account/fixtureStockHistory";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { StockLocationInput } from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};

const FixtureStockHistory = () => {
  const { t } = useTranslation();
  const stockHistories = useGetAccountFixtureStockHistorys();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetAccountStockLocations();
  const fixtures = useGetAccountFixtures();
  const { fixtureId } = useParams();
  const users = useGetUsers();
  const currentFixture = fixtures?.find((fixture) => fixture._id === fixtureId);
  if (!currentFixture) return <></>;
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      location: "",
      status: "",
      before: "",
      after: "",
    });

  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const allRows = stockHistories
    .filter((item) => item.fixture === currentFixture._id)
    .map((stockHistory) => {
      if (!stockHistory?.createdAt) {
        return null;
      }
      const date = new Date(stockHistory.createdAt);
      return {
        ...stockHistory,
        fxtr: getItem(stockHistory?.fixture, fixtures)?.name,
        lctn: getItem(stockHistory?.location, locations)?.name,
        usr: getItem(stockHistory?.user, users)?.name,
        date: format(stockHistory?.createdAt, "yyyy-MM-dd"),
        formattedDate: formatAsLocalDate(
          format(stockHistory?.createdAt, "yyyy-MM-dd")
        ),
        hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
      };
    })
    .filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
  const filterPanelInputs = [
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "status",
      label: t("Status"),
      options: stockHistoryStatuses.map((item) => {
        return {
          value: item.value,
          label: t(item.label),
        };
      }),
      placeholder: t("Status"),
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
  ];
  const columns = [
    { key: t("Date"), isSortable: true },
    { key: t("Hour"), isSortable: true },
    { key: t("User"), isSortable: true },
    { key: t("Fixture"), isSortable: true },
    { key: t("Location"), isSortable: true },
    { key: t("Old Quantity"), isSortable: true },
    { key: t("Changed"), isSortable: true },
    { key: t("Status"), isSortable: true },
  ];
  const rowKeys = [
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
      key: "fxtr",
      className: "min-w-32 pr-1",
    },
    {
      key: "lctn",
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
      key: "status",
      className: "min-w-32 pr-1",
      node: (row: any) => {
        const status = stockHistoryStatuses.find(
          (item) => item.value === row.status
        );
        if (!status) return null;
        return (
          <div
            className={`w-fit rounded-md text-sm  px-2 py-1 font-semibold  ${status?.backgroundColor} text-white`}
          >
            {t(status?.label)}
          </div>
        );
      },
    },
  ];
  useEffect(() => {
    const filteredRows = allRows.filter((stockHistory) => {
      if (!stockHistory?.createdAt) {
        return false;
      }
      return (
        (filterPanelFormElements.before === "" ||
          stockHistory.createdAt <= filterPanelFormElements.before) &&
        (filterPanelFormElements.after === "" ||
          stockHistory.createdAt >= filterPanelFormElements.after) &&
        passesFilter(filterPanelFormElements.location, stockHistory.location) &&
        passesFilter(filterPanelFormElements.status, stockHistory.status)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [
    stockHistories,
    filterPanelFormElements,
    currentFixture,
    users,
    locations,
    fixtures,
  ]);

  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filterPanel={filterPanel}
          filters={filters}
          title={t("Fixture Stock History")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default FixtureStockHistory;
