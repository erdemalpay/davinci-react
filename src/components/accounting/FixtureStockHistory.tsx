import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  AccountFixture,
  AccountStockLocation,
  stockHistoryStatuses,
} from "../../types";
import { useGetAccountFixtures } from "../../utils/api/account/fixture";
import { useGetAccountFixtureStockHistorys } from "../../utils/api/account/fixtureStockHistory";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { FixtureInput, StockLocationInput } from "../../utils/panelInputs";
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
  const fixtures = useGetAccountFixtures();
  const locations = useGetAccountStockLocations();
  const [showFilters, setShowFilters] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      fixture: "",
      location: "",
      status: "",
      before: "",
      after: "",
    });
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const [rows, setRows] = useState(() => {
    return stockHistories.map((stockHistory) => {
      const date = new Date(stockHistory.createdAt);
      return {
        ...stockHistory,
        fxtr: stockHistory.fixture?.name,
        lctn: stockHistory?.location?.name,
        usr: stockHistory?.user?.name,
        date: `${pad(date.getDate())}-${pad(
          date.getMonth() + 1
        )}-${date.getFullYear()}`,
        hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
      };
    });
  });
  const filterPanelInputs = [
    FixtureInput({ fixtures: fixtures, required: true }),
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
            className={`w-fit rounded-md text-sm ml-2 px-2 py-1 font-semibold  ${status?.backgroundColor} text-white`}
          >
            {t(status?.label)}
          </div>
        );
      },
    },
  ];
  useEffect(() => {
    setRows(
      stockHistories
        .filter((stockHistory) => {
          return (
            (filterPanelFormElements.before === "" ||
              stockHistory.createdAt <= filterPanelFormElements.before) &&
            (filterPanelFormElements.after === "" ||
              stockHistory.createdAt >= filterPanelFormElements.after) &&
            passesFilter(
              filterPanelFormElements.fixture,
              (stockHistory.fixture as AccountFixture)?._id
            ) &&
            passesFilter(
              filterPanelFormElements.location,
              (stockHistory.location as AccountStockLocation)?._id
            ) &&
            passesFilter(filterPanelFormElements.status, stockHistory.status)
          );
        })
        .map((stockHistory) => {
          const date = new Date(stockHistory.createdAt);
          return {
            ...stockHistory,
            fxtr: stockHistory.fixture?.name,
            lctn: stockHistory?.location?.name,
            usr: stockHistory?.user?.name,
            date: `${pad(date.getDate())}-${pad(
              date.getMonth() + 1
            )}-${date.getFullYear()}`,
            hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
          };
        })
    );
    setTableKey((prev) => prev + 1);
  }, [stockHistories, filterPanelFormElements]);

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
        />
      </div>
    </>
  );
};

export default FixtureStockHistory;
