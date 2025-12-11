import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { Header } from "../components/header/Header";
import CategorySummaryChart from "../components/orderSummary/CategorySummaryChart";
import CategorySummaryCompareChart from "../components/orderSummary/CategorySummaryCompareChart";
import SummaryCard from "../components/orders/ordersSummary/SummaryCard";
import SelectInput from "../components/panelComponents/FormElements/SelectInput";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useOrderContext } from "../context/Order.context";
import {
  commonDateOptions,
  DateRangeKey,
  MenuCategory,
  OptionType,
  TURKISHLIRA,
  UpperCategory,
} from "../types";
import { useGetSummaryStockTotal } from "../utils/api/account/stock";
import { dateRanges } from "../utils/api/dateRanges";
import { useGetStoreLocations } from "../utils/api/location";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetUpperCategories } from "../utils/api/menu/upperCategory";
import {
  useGetSummaryCollectionTotal,
  useGetSummaryDiscountTotal,
} from "../utils/api/order/orderCollection";
import { formatAsLocalDate } from "../utils/format";

const OrdersSummary = () => {
  const { t } = useTranslation();
  const [componentKey, setComponentKey] = useState(0);
  const locations = useGetStoreLocations();
  const stockData = useGetSummaryStockTotal();
  const discountData = useGetSummaryDiscountTotal();
  const categories = useGetCategories();
  const upperCategories = useGetUpperCategories();
  if (!categories || !upperCategories) return <></>;
  const [selectedCategory, setSelectedCategory] =
    useState<MenuCategory | null>();
  const [selectedUpperCategory, setSelectedUpperCategory] =
    useState<UpperCategory | null>(upperCategories[0]);
  const [selectedDateRange, setSelectedDateRange] =
    useState<DateRangeKey>("thisMonth");
  const [useCompareChart, setUseCompareChart] = useState(true);
  const categoryOptions = categories?.map((category) => {
    return {
      value: String(category._id),
      label: category.name,
    };
  });
  const upperCategoryOptions = upperCategories?.map((upperCategory) => {
    return {
      value: String(upperCategory._id),
      label: upperCategory.name,
    };
  });
  const { filterSummaryFormElements, setFilterSummaryFormElements } =
    useOrderContext();
  const totalIncome = useGetSummaryCollectionTotal();

  // İlk yüklemede varsayılan tarih aralığını ayarla
  useEffect(() => {
    if (!filterSummaryFormElements.after && !filterSummaryFormElements.before) {
      const dateRange = dateRanges[selectedDateRange]();
      setFilterSummaryFormElements((prev: any) => ({
        ...prev,
        after: dateRange.after,
        before: dateRange.before,
      }));
    }
  }, []);

  const filterInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: [
        {
          value: "",
          label: t("All Locations"),
        },
        ...locations.map((input) => {
          return {
            value: input._id,
            label: input.name,
          };
        }),
      ],
      placeholder: t("Location"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "dateRange",
      label: t("Date Range"),
      options: commonDateOptions.map((option) => ({
        value: option.value,
        label: t(option.label),
      })),
      placeholder: t("Select Date Range"),
      required: true,
      additionalOnChange: ({ value }: { value: string }) => {
        setSelectedDateRange(value as DateRangeKey);
        if (value === "customDate") {
          // Özel tarih seçildiğinde manuel tarih seçicileri göster
        } else {
          const dateRange = dateRanges[value as DateRangeKey]();
          setFilterSummaryFormElements((prev: any) => ({
            ...prev,
            after: dateRange.after,
            before: dateRange.before,
          }));
        }
      },
    },
    ...(selectedDateRange === "customDate"
      ? [
          {
            type: InputTypes.DATE,
            formKey: "after",
            label: t("Start Date"),
            placeholder: t("Start Date"),
            required: true,
            isDatePicker: true,
            isOnClearActive: false,
          },
          {
            type: InputTypes.DATE,
            formKey: "before",
            label: t("End Date"),
            placeholder: t("End Date"),
            required: true,
            isDatePicker: true,
            isOnClearActive: false,
          },
        ]
      : []),
  ];
  const handleChange = (key: string) => (value: string) => {
    setFilterSummaryFormElements((prev: any) => ({ ...prev, [key]: value }));
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
          setFilterSummaryFormElements((prev: any) => ({
            ...prev,
            [key]: (selectedValue as OptionType)?.value,
          }));
        } else {
          setFilterSummaryFormElements((prev: any) => ({
            ...prev,
            [key]: "",
          }));
        }
      }
    };
  function getDateRange() {
    const afterDate = formatAsLocalDate(filterSummaryFormElements?.after);
    const beforeDate = filterSummaryFormElements?.before
      ? formatAsLocalDate(filterSummaryFormElements?.before)
      : null;
    const currentDate = format(new Date(), "dd/MM/yyyy");

    return beforeDate
      ? `${afterDate} - ${beforeDate}`
      : `${afterDate} - ${currentDate}`;
  }
  // componentKey useEffect kaldırıldı - sonsuz döngüye sebep oluyordu
  useEffect(() => {
    if (!selectedCategory && upperCategories && upperCategories.length > 0) {
      setSelectedUpperCategory(upperCategories[0]);
    }
  }, [upperCategories, selectedCategory]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-full px-4 flex flex-col gap-4 my-10">
        {/* filter */}
        <div className="w-full sm:w-1/2 grid grid-cols-1 sm:flex sm:flex-row gap-4 sm:ml-auto   ">
          {filterInputs.map((input: any) => {
            if (input.type === InputTypes.DATE) {
              return (
                <div key={input.formKey} className="sm:mt-2 w-full">
                  <TextInput
                    key={input.formKey}
                    type={input.type}
                    value={filterSummaryFormElements[input.formKey] ?? ""}
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
                  (input.formKey === "dateRange"
                    ? selectedDateRange
                    : filterSummaryFormElements[input.formKey])
              );
              return (
                <div key={input.formKey} className="w-full ">
                  <SelectInput
                    key={input.formKey}
                    value={selectedValue}
                    options={input.options ?? []}
                    placeholder={input.placeholder ?? ""}
                    onChange={
                      input.additionalOnChange
                        ? (selectedOption) => {
                            if (selectedOption) {
                              input.additionalOnChange?.({
                                value: (selectedOption as OptionType).value,
                                label: (selectedOption as OptionType).label,
                              });
                            }
                          }
                        : handleChangeForSelect(input.formKey)
                    }
                  />
                </div>
              );
            }
            return null;
          })}
        </div>
        <div key={componentKey} className="flex flex-col gap-4">
          {/* summary cards - Ortalanmış ve responsive */}
          <div className="w-full flex justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-6xl w-full">
              <SummaryCard
                header={t("Total Income")}
                firstSubHeader={getDateRange()}
                firstSubHeaderValue={
                  totalIncome
                    ? totalIncome.toLocaleString("tr-TR") + " " + TURKISHLIRA
                    : "0 " + TURKISHLIRA
                }
                sideColor={"#1D4ED8"}
              />
              <SummaryCard
                header={t("Total Stock Value")}
                firstSubHeader={formatAsLocalDate(
                  filterSummaryFormElements?.after
                )}
                firstSubHeaderValue={
                  stockData?.afterTotalValue
                    ? stockData.afterTotalValue.toLocaleString("tr-TR") +
                      " " +
                      TURKISHLIRA
                    : "0 " + TURKISHLIRA
                }
                secondSubHeader={formatAsLocalDate(
                  filterSummaryFormElements?.before
                )}
                secondSubHeaderValue={
                  stockData?.beforeTotalValue
                    ? stockData.beforeTotalValue.toLocaleString("tr-TR") +
                      " " +
                      TURKISHLIRA
                    : "0 " + TURKISHLIRA
                }
                difference={
                  (stockData?.beforeTotalValue ?? 0) -
                  (stockData?.afterTotalValue ?? 0)
                    ? (
                        (stockData?.beforeTotalValue ?? 0) -
                        (stockData?.afterTotalValue ?? 0)
                      ).toLocaleString("tr-TR")
                    : "0"
                }
                sideColor={"#d8521d"}
              />
              <SummaryCard
                header={t("Total Discounts")}
                firstSubHeader={getDateRange()}
                firstSubHeaderValue={
                  discountData?.totalDiscounts
                    ? discountData.totalDiscounts.toLocaleString("tr-TR") +
                      " " +
                      TURKISHLIRA
                    : "0 " + TURKISHLIRA
                }
                sideColor={"#10B981"}
              />
            </div>
          </div>
          {/* category summary chart */}
          <div className="w-full">
            <div className="w-full flex flex-col gap-4">
              {/* selections */}
              <div className="flex flex-col sm:flex-row gap-2 ">
                {/* upper category  selection*/}
                <div className="sm:w-1/4 px-4 ">
                  <SelectInput
                    label={t("Upper Category")}
                    options={upperCategoryOptions}
                    isMultiple={false}
                    value={
                      selectedUpperCategory
                        ? {
                            value: String(selectedUpperCategory._id),
                            label: selectedUpperCategory.name,
                          }
                        : null
                    }
                    isOnClearActive={false}
                    onChange={(selectedOption) => {
                      if (categories) {
                        setSelectedUpperCategory(
                          upperCategories?.find(
                            (category) =>
                              category._id ===
                              Number((selectedOption as OptionType)?.value)
                          ) ?? upperCategories[0]
                        );
                      }
                      setSelectedCategory(null);
                    }}
                    placeholder={t("Select a upper category")}
                    isAutoFill={false}
                  />
                </div>
                {/* category selection */}
                <div className="sm:w-1/4 px-4">
                  <SelectInput
                    label={t("Category")}
                    options={categoryOptions}
                    isMultiple={false}
                    value={
                      selectedCategory
                        ? {
                            value: String(selectedCategory._id),
                            label: selectedCategory.name,
                          }
                        : null
                    }
                    isOnClearActive={false}
                    onChange={(selectedOption) => {
                      if (categories) {
                        setSelectedCategory(
                          categories?.find(
                            (category) =>
                              category._id ===
                              Number((selectedOption as OptionType)?.value)
                          ) ?? categories[0]
                        );
                        setSelectedUpperCategory(null);
                      }
                    }}
                    placeholder={t("Select a category")}
                    isAutoFill={false}
                  />
                </div>
              </div>

              {useCompareChart &&
                filterSummaryFormElements.after &&
                filterSummaryFormElements.before && (
                  <>
                    {selectedCategory && (
                      <CategorySummaryCompareChart
                        location={
                          filterSummaryFormElements.location
                            ? Number(filterSummaryFormElements.location)
                            : 0
                        }
                        category={selectedCategory}
                        primaryAfter={filterSummaryFormElements.after}
                        primaryBefore={filterSummaryFormElements.before}
                      />
                    )}
                    {selectedUpperCategory && (
                      <CategorySummaryCompareChart
                        location={
                          filterSummaryFormElements.location
                            ? Number(filterSummaryFormElements.location)
                            : 0
                        }
                        upperCategory={selectedUpperCategory}
                        primaryAfter={filterSummaryFormElements.after}
                        primaryBefore={filterSummaryFormElements.before}
                      />
                    )}
                  </>
                )}
              {!useCompareChart && (
                <>
                  {selectedCategory && (
                    <CategorySummaryChart
                      location={filterSummaryFormElements.location}
                      category={selectedCategory}
                    />
                  )}
                  {selectedUpperCategory && (
                    <CategorySummaryChart
                      location={filterSummaryFormElements.location}
                      upperCategory={selectedUpperCategory}
                    />
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersSummary;
