import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import { useUserContext } from "../../context/User.context";
import {
  FormElementsState,
  RoleEnum,
  StockHistoryStatusEnum,
  stockHistoryStatuses,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  StockHistoryPayload,
  useGetAccountProductStockHistorys,
} from "../../utils/api/account/productStockHistory";
import { useConsumptStockMutation } from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  ProductInput,
  QuantityInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const EnterConsumption = () => {
  const { t } = useTranslation();
  const { mutate: consumptStock } = useConsumptStockMutation();
  const { selectedLocationId } = useLocationContext();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      expenseType: "",
      location: selectedLocationId,
      status: StockHistoryStatusEnum.CONSUMPTION,
      before: "",
      after: "",
      sort: "",
      asc: 1,
      vendor: "",
      brand: "",
    });
  const stockHistoriesPayload = useGetAccountProductStockHistorys(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  stockHistoriesPayload as StockHistoryPayload;
  const [tableKey, setTableKey] = useState(0);
  const products = useGetAccountProducts();
  const { user } = useUserContext();
  const users = useGetUsers();
  const expenseTypes = useGetAccountExpenseTypes();
  const locations = useGetStockLocations();
  const [showFilters, setShowFilters] = useState(false);
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const allRows = stockHistoriesPayload?.data?.map((stockHistory) => {
    if (!stockHistory?.createdAt) {
      return null;
    }
    const date = new Date(stockHistory.createdAt);
    return {
      ...stockHistory,
      prdct: getItem(stockHistory.product, products)?.name,
      lctn: getItem(stockHistory?.location, locations)?.name,
      usr: getItem(stockHistory?.user, users)?.name,
      newQuantity:
        (stockHistory?.currentAmount ?? 0) + (stockHistory?.change ?? 0),
      date: format(stockHistory?.createdAt, "yyyy-MM-dd"),
      formattedDate: formatAsLocalDate(
        format(stockHistory?.createdAt, "yyyy-MM-dd")
      ),
      hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
  });
  const [rows, setRows] = useState(allRows);
  const isDisabledCondition = !(
    user &&
    [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.CATERINGMANAGER].includes(
      user.role._id
    )
  );
  const consumptInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name,
        };
      }),
      placeholder: t("Product"),
      required: true,
    },
    QuantityInput({ required: true }),
    StockLocationInput({ locations: locations }),
  ];
  const consumptFormKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: t("Expense Type"),
      options: expenseTypes?.map((expenseType) => {
        return {
          value: expenseType?._id,
          label: expenseType?.name,
        };
      }),
      placeholder: t("Expense Type"),
      required: true,
    },
    ProductInput({
      products: products,
      required: true,
      isMultiple: true,
    }),
    VendorInput({ vendors: vendors }),
    BrandInput({ brands: brands }),
    StockLocationInput({ locations: locations }),
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
    {
      key: t("Date"),
      isSortable: false,
      correspondingKey: "createdAt",
    },
    { key: t("Hour"), isSortable: false },
    {
      key: t("User"),
      isSortable: false,
      correspondingKey: "user",
    },
    {
      key: t("Product"),
      isSortable: false,
      correspondingKey: "product",
    },
    {
      key: t("Location"),
      isSortable: false,
      correspondingKey: "location",
    },
    ...(!isDisabledCondition
      ? [{ key: t("Old Quantity"), isSortable: false }]
      : []),
    { key: t("Changed"), isSortable: false },
    ...(!isDisabledCondition
      ? [{ key: t("New Quantity"), isSortable: false }]
      : []),
    {
      key: t("Status"),
      isSortable: false,
      correspondingKey: "status",
    },
  ];
  const addButton = {
    name: t("Add Consumption"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={consumptInputs}
        formKeys={consumptFormKeys}
        constantValues={{ location: selectedLocationId }}
        submitItem={consumptStock as any}
        topClassName="flex flex-col gap-2 "
        buttonName={t("Submit")}
        generalClassName="overflow-visible"
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
  };
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
      key: "prdct",
      className: "min-w-32 pr-1",
    },
    {
      key: "lctn",
      className: "min-w-32 pr-1",
    },
    ...(!isDisabledCondition
      ? [
          {
            key: "currentAmount",
            className: "min-w-32 pr-1",
          },
        ]
      : []),
    {
      key: "change",
      className: "min-w-32 pr-1",
    },
    ...(!isDisabledCondition
      ? [
          {
            key: "newQuantity",
            className: "min-w-32 pr-1",
          },
        ]
      : []),
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
  const filters = [
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const pagination = stockHistoriesPayload
    ? {
        totalPages: stockHistoriesPayload.totalPages,
        totalRows: stockHistoriesPayload.totalNumber,
      }
    : null;
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  const outsideSort = {
    filterPanelFormElements: filterPanelFormElements,
    setFilterPanelFormElements: setFilterPanelFormElements,
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [filterPanelFormElements]);

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    stockHistoriesPayload,
    users,
    products,
    locations,
    expenseTypes,
    vendors,
    brands,
    user,
  ]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          outsideSortProps={outsideSort}
          rows={rows ?? []}
          filterPanel={filterPanel}
          filters={filters}
          isSearch={false}
          addButton={addButton}
          title={t("Consumption History")}
          isActionsActive={false}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default EnterConsumption;
