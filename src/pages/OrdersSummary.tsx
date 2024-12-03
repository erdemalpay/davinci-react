import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActionMeta, MultiValue, SingleValue } from "react-select";
import { Header } from "../components/header/Header";
import SummaryCard from "../components/orders/ordersSummary/SummaryCard";
import CategorySummaryChart from "../components/orderSummary/CategorySummaryChart";
import SelectInput from "../components/panelComponents/FormElements/SelectInput";
import TextInput from "../components/panelComponents/FormElements/TextInput";
import { InputTypes } from "../components/panelComponents/shared/types";
import { useOrderContext } from "../context/Order.context";
import { MenuCategory, TURKISHLIRA, UpperCategory } from "../types";
import { useGetSummaryStockTotal } from "../utils/api/account/stock";
import { useGetLocations } from "../utils/api/location";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetUpperCategories } from "../utils/api/menu/upperCategory";
import { useGetSummaryCollectionTotal } from "../utils/api/order/orderCollection";
import { formatAsLocalDate } from "../utils/format";
import { formatPrice } from "../utils/formatPrice";
type OptionType = { value: number; label: string };
const OrdersSummary = () => {
  const { t } = useTranslation();
  const [componentKey, setComponentKey] = useState(0);
  const locations = useGetLocations();
  const stockData = useGetSummaryStockTotal();
  const categories = useGetCategories();
  const upperCategories = useGetUpperCategories();
  if (!categories || !upperCategories) return <></>;
  const [selectedCategory, setSelectedCategory] =
    useState<MenuCategory | null>();
  const [selectedUpperCategory, setSelectedUpperCategory] =
    useState<UpperCategory | null>(upperCategories[0]);
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
  useEffect(() => {
    setComponentKey((prev) => prev + 1);
  }, [
    totalIncome,
    filterSummaryFormElements,
    locations,
    stockData,
    categories,
    upperCategories,
  ]);
  useEffect(() => {
    setSelectedUpperCategory(upperCategories[0]);
  }, [upperCategories]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-full px-4 flex flex-col gap-4 my-10">
        {/* filter */}
        <div className="w-full sm:w-1/2 grid grid-cols-1 sm:flex sm:flex-row gap-4 sm:ml-auto   ">
          {filterInputs.map((input: any) => {
            if (input.type === InputTypes.DATE) {
              return (
                <div className="sm:mt-2 w-full">
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
                  option.value === filterSummaryFormElements[input.formKey]
              );
              return (
                <div className="w-full ">
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
        <div key={componentKey} className="flex flex-col gap-4">
          {/* summary cards*/}
          <div className="w-full  grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 ">
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
                formatPrice(stockData?.afterTotalValue ?? 0) + " " + TURKISHLIRA
              }
              secondSubHeader={formatAsLocalDate(
                filterSummaryFormElements?.before
              )}
              secondSubHeaderValue={
                formatPrice(stockData?.beforeTotalValue ?? 0) +
                " " +
                TURKISHLIRA
              }
              difference={formatPrice(
                (stockData?.beforeTotalValue ?? 0) -
                  (stockData?.afterTotalValue ?? 0)
              )}
              sideColor={"#d8521d"}
            />
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
                  />
                </div>
              </div>

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
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default OrdersSummary;
