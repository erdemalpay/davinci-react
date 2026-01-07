import {
  addDays,
  format,
  formatDate,
  isToday,
  isValid,
  parse,
  subDays,
} from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
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
  const DATE_FMT = "yyyy-MM-dd";

  const strToDate = (s?: string) => {
    if (!s) return new Date();
    const d = parse(s, DATE_FMT, new Date());
    return isValid(d) ? d : new Date();
  };

  const dateToStr = (d: Date) => formatDate(d, DATE_FMT);

  const metricCards = [
    {
      header: t("Average Preparation Time"),
      rows: [
        {
          value: summary?.orderPreparationStats?.average?.formatted || "-",
        },
      ],
      headerBgColor: "#DBEAFE",
      headerTextColor: "#1E40AF",
      valueColor: "#1E40AF",
      variant: "metric" as const,
    },
    {
      header: t("Average Button Call Time"),
      rows: [
        {
          value: summary?.buttonCallStats?.averageDuration || "-",
        },
      ],
      headerBgColor: "#E9D5FF",
      headerTextColor: "#7C3AED",
      valueColor: "#7C3AED",
      variant: "metric" as const,
    },
  ];

  const rankingCards = [
    {
      header: t("Top Order Creators"),
      rows:
        summary?.topOrderCreators.map((creator) => ({
          title: creator.userName,
          value: creator.orderCount,
          bgColor: getItem(creator.userId, users)?.role?.color,
        })) ?? [],
      headerBgColor: "#D1FAE5",
      headerTextColor: "#065F46",
      variant: "ranking" as const,
      showRankEmojis: true,
    },
    {
      header: t("Top Order Deliverers"),
      rows:
        summary?.topOrderDeliverers.map((deliverer) => ({
          title: deliverer.userName,
          value: deliverer.orderCount,
          bgColor: getItem(deliverer.userId, users)?.role?.color,
        })) ?? [],
      headerBgColor: "#DBEAFE",
      headerTextColor: "#1E40AF",
      variant: "ranking" as const,
      showRankEmojis: true,
    },
    {
      header: t("Top Collection Creators"),
      rows:
        summary?.topCollectionCreators.map((creator) => ({
          title: creator.userName,
          value: creator.collectionCount,
          bgColor: getItem(creator.userId, users)?.role?.color,
        })) ?? [],
      headerBgColor: "#FED7AA",
      headerTextColor: "#9A3412",
      variant: "ranking" as const,
      showRankEmojis: true,
    },
    {
      header: t("Top 3 Mentors"),
      rows:
        summary?.gameplayStats?.topMentors?.map((o) => ({
          title: getItem(o?.mentoredBy, users)?.name || "-",
          value: o.gameplayCount,
          bgColor: getItem(o?.mentoredBy, users)?.role?.color,
        })) ?? [],
      headerBgColor: "#E9D5FF",
      headerTextColor: "#6B21A8",
      variant: "ranking" as const,
      showRankEmojis: true,
    },
  ];

  const detailCards = [
    {
      header: t("Longest Order Preparation Times"),
      rows:
        summary?.orderPreparationStats?.topOrders?.map((o) => ({
          title: getItem(o?.order?.item, items)?.name || "-",
          value: o?.formatted?.replace(/^00:/, "") || "-",
          subtitle:
            `${t("Table")}: ${o?.order?.orderTable?.name}` +
            (o?.order?.deliveredAt
              ? ` • ${format(o?.order?.deliveredAt, "HH:mm")}`
              : ""),
        })) ?? [],
      headerBgColor: "#FEE2E2",
      headerTextColor: "#991B1B",
      valueColor: "#DC2626",
      variant: "detail" as const,
    },
    {
      header: t("Longest Button Call Times"),
      rows:
        summary?.buttonCallStats?.longestCalls?.map((o) => ({
          title: `${t("Table")}: ${o.tableName}`,
          value: o.duration,
          subtitle: o?.finishHour,
        })) ?? [],
      headerBgColor: "#E0E7FF",
      headerTextColor: "#3730A3",
      valueColor: "#4F46E5",
      variant: "detail" as const,
    },
    {
      header: t("Top Complex Games"),
      rows:
        summary?.gameplayStats?.topComplexGames?.map((o) => ({
          title: o.name,
          value:
            o?.mentors
              ?.map((mentor) => getItem(mentor, users)?.name)
              ?.join(", ") || "-",
        })) ?? [],
      headerBgColor: "#FCE7F3",
      headerTextColor: "#831843",
      valueColor: "#1F2937",
      variant: "detail" as const,
    },
  ];
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
      // label: t("Date"),
      placeholder: t("Date"),
      required: true,
      isDatePicker: true,
    },
  ];
  const handleChange = (key: string) => (value: string) => {
    setFilterDailySummaryPanelFormElements(
      (prev: Record<string, string | number>) => ({
        ...prev,
        [key]: value,
      })
    );
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
          setFilterDailySummaryPanelFormElements(
            (prev: Record<string, string | number>) => ({
              ...prev,
              [key]: (selectedValue as OptionType)?.value,
            })
          );
        } else {
          setFilterDailySummaryPanelFormElements(
            (prev: Record<string, string | number>) => ({
              ...prev,
              [key]: "",
            })
          );
        }
      }
    };
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
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
              name="employees"
              label={t("Who's at cafe?")}
              visits={visits}
            />
          ) : (
            <PreviousVisitList visits={visits} isLabel={false} />
          )}
          {/* filter */}
          <div className="w-full sm:w-1/2 grid grid-cols-1 sm:flex sm:flex-row gap-4 sm:ml-auto items-center   ">
            {filterInputs.map((input) => {
              if (input.type === InputTypes.DATE) {
                return (
                  <div
                    key={input.formKey}
                    className="w-full flex items-center gap-2"
                  >
                    {/* left arrow */}
                    <button
                      type="button"
                      className="p-2 rounded bg-gray-100 hover:bg-gray-200 mt-auto min-h-11"
                      onClick={() => {
                        setFilterDailySummaryPanelFormElements(
                          (prev: Record<string, string | number>) => {
                            const cur = prev[input.formKey] as
                              | string
                              | undefined;
                            const next = subDays(strToDate(cur), 1);
                            return {
                              ...prev,
                              [input.formKey]: dateToStr(next),
                            };
                          }
                        );
                      }}
                    >
                      <IoIosArrowBack size={20} />
                    </button>

                    {/* date picker input */}
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

                    {/* right arrow */}
                    <button
                      type="button"
                      className="p-2 rounded bg-gray-100 hover:bg-gray-200 mt-auto min-h-11"
                      onClick={() => {
                        setFilterDailySummaryPanelFormElements(
                          (prev: Record<string, string | number>) => {
                            const cur = prev[input.formKey] as
                              | string
                              | undefined;
                            const next = addDays(strToDate(cur), 1);
                            return {
                              ...prev,
                              [input.formKey]: dateToStr(next),
                            };
                          }
                        );
                      }}
                    >
                      <IoIosArrowForward size={20} />
                    </button>
                  </div>
                );
              } else if (input.type === InputTypes.SELECT) {
                const selectedValue = input.options?.find(
                  (option) =>
                    option.value ===
                    filterDailySummaryPanelFormElements[input.formKey]
                );
                return (
                  <div key={input.formKey} className="w-full ">
                    <SelectInput
                      key={input.formKey}
                      value={selectedValue || null}
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

        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {metricCards.map((card, index) => (
              <SummaryCard key={index} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {rankingCards.map((card, index) => (
              <SummaryCard key={index} {...card} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {detailCards.map((card, index) => (
              <SummaryCard key={index} {...card} />
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default DailySummary;
