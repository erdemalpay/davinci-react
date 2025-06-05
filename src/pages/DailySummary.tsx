import { isToday } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import SummaryCard from "../components/common/SummaryCard";
import { Header } from "../components/header/Header";
import SelectInput from "../components/panelComponents/FormElements/SelectInput";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { InputTypes } from "../components/panelComponents/shared/types";
import { ActiveVisitList } from "../components/tables/ActiveVisitList";
import { PreviousVisitList } from "../components/tables/PreviousVisitList";
import { useFilterContext } from "../context/Filter.context";
import { OptionType } from "../types";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { useGetDailySummary } from "../utils/api/order/order";
import { useGetUsers } from "../utils/api/user";
import { useGetGivenDateLocationVisits } from "../utils/api/visit";
import { getItem } from "../utils/getItem";

const DailySummary = () => {
  const { t } = useTranslation();
  const {
    filterDailySummaryPanelFormElements,
    setFilterDailySummaryPanelFormElements,
  } = useFilterContext();
  const visits = useGetGivenDateLocationVisits(
    filterDailySummaryPanelFormElements.date,
    filterDailySummaryPanelFormElements.location
  );
  const locations = useGetStoreLocations();
  const items = useGetMenuItems();
  const users = useGetUsers();
  const [componentKey, setComponentKey] = useState(0);
  const summary = useGetDailySummary(
    filterDailySummaryPanelFormElements.date,
    filterDailySummaryPanelFormElements.location
  );
  const allRows = [
    {
      header: t("Top Order Creators"),
      rows:
        summary?.topOrderCreators.map((creator) => {
          return {
            title: creator.userName,
            value: creator.orderCount,
          };
        }) ?? [],
    },
    {
      header: t("Top Order Deliverers"),
      rows:
        summary?.topOrderDeliverers.map((deliverer) => {
          return {
            title: deliverer.userName,
            value: deliverer.orderCount,
          };
        }) ?? [],
    },
    {
      header: t("Top Collection Creators"),
      rows:
        summary?.topCollectionCreators.map((creator) => {
          return {
            title: creator.userName,
            value: creator.collectionCount,
          };
        }) ?? [],
    },
    {
      header: t("Average Preparation Time"),
      rows:
        [{ value: summary?.orderPreparationStats?.average?.formatted }] ?? [],
      valueClassName: "mx-auto text-2xl font-medium",
    },
    {
      header: t("Longest Order Preparation Times"),
      rows:
        summary?.orderPreparationStats?.topOrders?.map((o) => {
          return {
            title: getItem(o?.order?.item, items)?.name,
            value:
              `${t("Table")}:` +
              o?.order?.orderTable?.name +
              "-" +
              o?.formatted,
          };
        }) ?? [],
    },
    {
      header: t("Average Button Call Time"),
      rows: [{ value: summary?.buttonCallStats?.averageDuration }],
      valueClassName: "mx-auto text-2xl font-medium",
    },
    {
      header: t("Longest Button Call Times"),
      rows:
        summary?.buttonCallStats?.longestCalls?.map((o) => {
          return {
            title: `${t("Table")}:` + o.tableName,
            value: o.duration,
          };
        }) ?? [],
    },
    {
      header: t("Top 3 Mentors"),
      rows:
        summary?.gameplayStats?.topMentors?.map((o) => {
          return {
            title: getItem(o?.mentoredBy, users)?.name,
            value: o.gameplayCount,
          };
        }) ?? [],
    },
    {
      header: t("Top Complex Games"),
      rows:
        summary?.gameplayStats?.topComplexGames?.map((o) => {
          return {
            title: o.name,
            value: o?.mentors
              ?.map((mentor) => {
                return getItem(mentor, users)?.name;
              })
              ?.join(","),
          };
        }) ?? [],
    },
  ];
  const [rows, setRows] = useState(allRows);
  const filterInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: locations.map((input) => {
        return {
          value: input._id,
          label: input.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },
    {
      type: InputTypes.DATE,
      formKey: "date",
      label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const handleChange = (key: string) => (value: string) => {
    setFilterDailySummaryPanelFormElements((prev: any) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleChangeForSelect =
    (key: string) =>
    (
      selectedValue: SingleValue<OptionType> | MultiValue<OptionType>,
      actionMeta: ActionMeta<OptionType>
    ) => {
      if (
        actionMeta.action === "select-option" ||
        actionMeta.action === "remove-value" ||
        actionMeta.action === "clear"
      ) {
        if (selectedValue) {
          setFilterDailySummaryPanelFormElements((prev: any) => ({
            ...prev,
            [key]: (selectedValue as OptionType)?.value,
          }));
        } else {
          setFilterDailySummaryPanelFormElements((prev: any) => ({
            ...prev,
            [key]: "",
          }));
        }
      }
    };
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
    setRows(allRows);
  }, [locations, items, users, summary, visits]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div key={componentKey} className="w-full px-4 flex flex-col gap-4 my-10">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* who is/was at the cafe */}
          {filterDailySummaryPanelFormElements.date &&
          isToday(filterDailySummaryPanelFormElements.date) ? (
            <ActiveVisitList
              suggestions={users}
              name="employees"
              label={t("Who's at cafe?")}
              visits={visits}
            />
          ) : (
            <PreviousVisitList visits={visits} isLabel={false} />
          )}
          {/* filter */}
          <div className="w-full sm:w-1/2 grid grid-cols-1 sm:flex sm:flex-row gap-4 sm:ml-auto   ">
            {filterInputs.map((input: any) => {
              if (input.type === InputTypes.DATE) {
                return (
                  <div key={input.formKey} className="sm:mt-2 w-full">
                    <TextInput
                      key={input.formKey}
                      type={input.type}
                      value={
                        filterDailySummaryPanelFormElements[input.formKey] ?? ""
                      }
                      label={input.label ?? ""}
                      isDatePickerLabel={false}
                      placeholder={input.placeholder ?? ""}
                      onChange={handleChange(input.formKey)}
                      isDatePicker={input?.isDatePicker ?? false}
                    />
                  </div>
                );
              } else if (input.type === InputTypes.SELECT) {
                const selectedValue = input.options?.find(
                  (option: any) =>
                    option.value ===
                    filterDailySummaryPanelFormElements[input.formKey]
                );
                return (
                  <div key={input.formKey} className="w-full ">
                    <SelectInput
                      key={input.formKey}
                      value={selectedValue}
                      options={input.options ?? []}
                      placeholder={input.placeholder ?? ""}
                      onChange={handleChangeForSelect(input.formKey)}
                    />
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>

        {/* summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-center">
          {rows &&
            rows.map((row, index) => {
              return (
                <SummaryCard
                  key={index}
                  header={row.header}
                  rows={row?.rows as any}
                  valueClassName={row?.valueClassName}
                />
              );
            })}
        </div>
      </div>
    </>
  );
};

export default DailySummary;
