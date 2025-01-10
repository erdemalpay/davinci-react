import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useLocationContext } from "../../context/Location.context";
import {
  FormElementsState,
  MenuItem,
  OrderStatus,
  RoleEnum,
  StockHistoryStatusEnum,
  stockHistoryStatuses,
  TURKISHLIRA,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  StockHistoryPayload,
  useGetAccountProductStockHistorys,
} from "../../utils/api/account/productStockHistory";
import { useGetAccountStocks } from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useOrderMutations } from "../../utils/api/order/order";
import { useGetUser, useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  ProductInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";
const LossProduct = () => {
  const { t } = useTranslation();
  const { selectedLocationId } = useLocationContext();
  const initialOrderForm = {
    item: 0,
    quantity: 0,
    note: "",
    category: "",
    discount: undefined,
    discountNote: "",
    isOnlinePrice: false,
    stockLocation: selectedLocationId,
  };
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const { createOrder } = useOrderMutations();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [isLossProductModalOpen, setIsLossProductModalOpen] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      product: [],
      expenseType: "",
      location: selectedLocationId,
      status: StockHistoryStatusEnum.LOSSPRODUCT,
      before: "",
      after: "",
      sort: "",
      asc: 1,
      vendor: "",
      brand: "",
    });
  const user = useGetUser();
  const stockHistoriesPayload = useGetAccountProductStockHistorys(
    currentPage,
    rowsPerPage,
    filterPanelFormElements
  );
  const stocks = useGetAccountStocks();
  const categories = useGetCategories();
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  stockHistoriesPayload as StockHistoryPayload;
  const [tableKey, setTableKey] = useState(0);
  const products = useGetAccountProducts();
  const users = useGetUsers();
  const expenseTypes = useGetAccountExpenseTypes();
  const locations = useGetStockLocations();
  const items = useGetMenuItems();
  const [showFilters, setShowFilters] = useState(false);
  const isDisabledCondition = !(
    user &&
    [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER, RoleEnum.CATERINGMANAGER].includes(
      user.role._id
    )
  );
  const pad = (num: number) => (num < 10 ? `0${num}` : num);
  const allRows = stockHistoriesPayload?.data
    ?.map((stockHistory) => {
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
    })
    .filter((item) => item !== null);
  const [rows, setRows] = useState(allRows);
  const menuItemStockQuantity = (item: MenuItem, location: number) => {
    if (item?.matchedProduct) {
      const stock = stocks?.find((stock) => {
        return (
          stock.product === item.matchedProduct && stock.location === location
        );
      });
      return stock?.quantity ?? 0;
    }
    return 0;
  };
  const menuItemOptions = items
    ?.filter((menuItem) => {
      return (
        !orderForm.category || menuItem.category === Number(orderForm.category)
      );
    })
    ?.filter((menuItem) => menuItem?.locations?.includes(selectedLocationId))
    ?.map((menuItem) => {
      return {
        value: menuItem?._id,
        label: menuItem?.name + " (" + menuItem.price + TURKISHLIRA + ")",
      };
    });
  const orderInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "category",
      label: t("Category"),
      options: categories?.map((category) => {
        return {
          value: category._id,
          label: category.name,
        };
      }),
      invalidateKeys: [{ key: "item", defaultValue: 0 }],
      placeholder: t("Category"),
      required: false,
      isDisabled: true, // remove this line and make category selection visible again
    },
    {
      type: InputTypes.SELECT,
      formKey: "item",
      label: t("Product"),
      options: menuItemOptions?.map((option) => {
        return {
          value: option.value,
          label: option.label,
        };
      }),
      invalidateKeys: [
        { key: "discount", defaultValue: undefined },
        { key: "discountNote", defaultValue: "" },
        { key: "isOnlinePrice", defaultValue: false },
      ],
      placeholder: t("Product"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      minNumber: 0,
      required: true,
      isNumberButtonsActive: true,
      isOnClearActive: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "stockLocation",
      label: t("Stock Location"),
      options: locations?.map((input) => {
        const menuItem = items?.find((item) => item._id === orderForm.item);
        const stockQuantity = menuItem
          ? menuItemStockQuantity(menuItem, input._id)
          : null;

        return {
          value: input._id,
          label:
            input.name + (menuItem ? ` (${t("Stock")}: ${stockQuantity})` : ""),
        };
      }),

      placeholder: t("Stock Location"),
      isDisabled: false,
      required: true,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "note",
      label: t("Note"),
      placeholder: t("Note"),
      required: true,
    },
  ];
  const orderFormKeys = [
    { key: "category", type: FormKeyTypeEnum.STRING },
    { key: "item", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "stockLocation", type: FormKeyTypeEnum.NUMBER },
    { key: "note", type: FormKeyTypeEnum.STRING },
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
    name: t("Add Loss Product"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isLossProductModalOpen}
        close={() => setIsLossProductModalOpen(false)}
        inputs={orderInputs}
        formKeys={orderFormKeys}
        submitItem={createOrder as any}
        setForm={setOrderForm}
        isCreateCloseActive={false}
        constantValues={{
          quantity: 1,
          stockLocation: selectedLocationId,
        }}
        cancelButtonLabel="Close"
        submitFunction={() => {
          const selectedMenuItem = getItem(orderForm?.item, items);
          const selectedMenuItemCategory = getItem(
            selectedMenuItem?.category,
            categories
          );
          if (selectedMenuItem && user) {
            createOrder({
              ...orderForm,
              location: selectedLocationId,
              unitPrice: selectedMenuItem.price,
              paidQuantity: 0,
              status: OrderStatus.WASTED,
              kitchen: selectedMenuItemCategory?.kitchen,
              stockLocation: selectedLocationId,
              stockNote: StockHistoryStatusEnum.LOSSPRODUCT,
              tableDate: new Date(),
            });
          }
          setOrderForm(initialOrderForm);
        }}
        generalClassName="  shadow-none mt-[-4rem] md:mt-0"
        topClassName="flex flex-col gap-2   "
      />
    ),
    isModalOpen: isLossProductModalOpen,
    setIsModal: setIsLossProductModalOpen,
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
    categories,
    stocks,
    items,
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
          title={t("Loss Product")}
          isActionsActive={false}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};
export default LossProduct;
