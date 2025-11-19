import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { HiOutlineTrash } from "react-icons/hi2";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  MenuItem,
  OrderStatus,
  StockHistoryStatusEnum,
  TURKISHLIRA,
  stockHistoryStatuses,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  StockHistoryPayload,
  useAccountProductStockHistoryMutations,
  useGetAccountProductStockHistorys,
} from "../../utils/api/account/productStockHistory";
import { useGetAccountStocks } from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useOrderMutations } from "../../utils/api/order/order";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetUser, useGetUsers } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const LossProduct = () => {
  const { t } = useTranslation();
  const [rowToAction, setRowToAction] = useState<any>({});
  const initialOrderForm = {
    item: 0,
    quantity: 0,
    note: "",
    category: "",
    discount: undefined,
    discountNote: "",
    isOnlinePrice: false,
    stockLocation: "",
  };
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState(initialOrderForm);
  const { createOrder } = useOrderMutations();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const { updateAccountProductStockHistory } =
    useAccountProductStockHistoryMutations();
  const [isLossProductModalOpen, setIsLossProductModalOpen] = useState(false);
  const {
    filterLossProductPanelFormElements,
    setFilterLossProductPanelFormElements,
    showLossProductFilters,
    setShowLossProductFilters,
  } = useFilterContext();
  const user = useGetUser();
  const { user: userContext } = useUserContext();
  const stockHistoriesPayload = useGetAccountProductStockHistorys(
    currentPage,
    rowsPerPage,
    filterLossProductPanelFormElements
  );
  const stocks = useGetAccountStocks();
  const categories = useGetCategories();
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  stockHistoriesPayload as StockHistoryPayload;
  const products = useGetAccountProducts();
  const users = useGetUsers();
  const expenseTypes = useGetAccountExpenseTypes();
  const locations = useGetStockLocations();
  const items = useGetMenuItems();
  const disabledConditions = useGetDisabledConditions();

  const lossProductPageDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.STOCK_LOSSPRODUCT, disabledConditions);
  }, [disabledConditions]);

  const isShowPricesDisabled = useMemo(() => {
    return lossProductPageDisabledCondition?.actions?.some(
      (ac) =>
        ac.action === ActionEnum.SHOWPRICES &&
        userContext?.role?._id &&
        !ac?.permissionsRoles?.includes(userContext?.role?._id)
    );
  }, [lossProductPageDisabledCondition, userContext]);

  const pad = useMemo(() => (num: number) => num < 10 ? `0${num}` : num, []);

  const rows = useMemo(() => {
    return stockHistoriesPayload?.data
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
  }, [stockHistoriesPayload, products, locations, users, pad]);

  const menuItemStockQuantity = useMemo(() => {
    return (item: MenuItem, location: number) => {
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
  }, [stocks]);

  const menuItemOptions = useMemo(() => {
    if (!items) {
      return [];
    }

    return items
      .filter((menuItem) => {
        if (orderForm.category && menuItem.category !== Number(orderForm.category)) {
          return false;
        }
        return true;
      })
      .map((menuItem) => {
        return {
          value: menuItem?._id,
          label: menuItem?.name + " (" + menuItem.price + TURKISHLIRA + ")",
        };
      });
  }, [items, orderForm.category]);

  const orderInputs = useMemo(
    () => [
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
              input.name +
              (menuItem ? ` (${t("Stock")}: ${stockQuantity})` : ""),
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
    ],
    [
      t,
      categories,
      menuItemOptions,
      locations,
      items,
      orderForm.item,
      menuItemStockQuantity,
    ]
  );
  const orderFormKeys = useMemo(
    () => [
      { key: "category", type: FormKeyTypeEnum.STRING },
      { key: "item", type: FormKeyTypeEnum.STRING },
      { key: "quantity", type: FormKeyTypeEnum.NUMBER },
      { key: "stockLocation", type: FormKeyTypeEnum.NUMBER },
      { key: "note", type: FormKeyTypeEnum.STRING },
    ],
    []
  );
  const filterPanelInputs = useMemo(
    () => [
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
        isMultiple: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => {
          return {
            value: vendor._id,
            label: vendor.name,
          };
        }),
        placeholder: t("Vendor"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "brand",
        label: t("Brand"),
        options: brands.map((brand) => ({
          value: brand._id,
          label: brand.name,
        })),
        placeholder: t("Brand"),
        required: false,
      },
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
    [expenseTypes, products, vendors, brands, locations, t]
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
      ...(!isShowPricesDisabled
        ? [{ key: t("Old Quantity"), isSortable: false }]
        : []),
      { key: t("Changed"), isSortable: false },
      ...(!isShowPricesDisabled
        ? [{ key: t("New Quantity"), isSortable: false }]
        : []),
      {
        key: t("Status"),
        isSortable: false,
        correspondingKey: "status",
      },
      {
        key: t("Actions"),
        isSortable: false,
      },
    ],
    [t, isShowPricesDisabled]
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
        key: "prdct",
        className: "min-w-32 pr-1",
      },
      {
        key: "lctn",
        className: "min-w-32 pr-1",
      },
      ...(!isShowPricesDisabled
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
      ...(!isShowPricesDisabled
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
    ],
    [isShowPricesDisabled, t]
  );
  const addButton = useMemo(
    () => ({
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
                location: Number(orderForm?.stockLocation),
                unitPrice: selectedMenuItem.price,
                paidQuantity: 0,
                status: OrderStatus.WASTED,
                kitchen: selectedMenuItemCategory?.kitchen,
                stockLocation:  Number(orderForm?.stockLocation),
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
      isDisabled: lossProductPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          userContext?.role?._id &&
          !ac?.permissionsRoles?.includes(userContext?.role?._id)
      ),
    }),
    [
      t,
      isLossProductModalOpen,
      orderInputs,
      orderFormKeys,
      createOrder,
      orderForm,
      items,
      categories,
      user,
      lossProductPageDisabledCondition,
      userContext,
    ]
  );
  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showLossProductFilters}
            onChange={() => {
              setShowLossProductFilters(!showLossProductFilters);
            }}
          />
        ),
      },
    ],
    [t, showLossProductFilters, setShowLossProductFilters]
  );
  const pagination = useMemo(() => {
    return stockHistoriesPayload
      ? {
          totalPages: stockHistoriesPayload.totalPages,
          totalRows: stockHistoriesPayload.totalNumber,
        }
      : null;
  }, [stockHistoriesPayload]);
  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showLossProductFilters,
      inputs: filterPanelInputs,
      formElements: filterLossProductPanelFormElements,
      setFormElements: setFilterLossProductPanelFormElements,
      closeFilters: () => setShowLossProductFilters(false),
    }),
    [
      showLossProductFilters,
      filterPanelInputs,
      filterLossProductPanelFormElements,
      setFilterLossProductPanelFormElements,
      setShowLossProductFilters,
    ]
  );
  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterLossProductPanelFormElements,
      setFilterPanelFormElements: setFilterLossProductPanelFormElements,
    }),
    [filterLossProductPanelFormElements, setFilterLossProductPanelFormElements]
  );
  const actions = useMemo(
    () => [
      {
        name: t("Cancel"),
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        className: "text-red-500 cursor-pointer text-2xl  ",
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isCancelOrderModalOpen}
            close={() => setIsCancelOrderModalOpen(false)}
            confirm={() => {
              updateAccountProductStockHistory({
                id: rowToAction._id,
                updates: {
                  status:
                    rowToAction.status === StockHistoryStatusEnum.LOSSPRODUCT
                      ? StockHistoryStatusEnum.LOSSPRODUCTCANCEL
                      : StockHistoryStatusEnum.LOSSPRODUCT,
                },
              });
              setIsCancelOrderModalOpen(false);
            }}
            title={t("Cancel Loss Product")}
            text={`${t("Loss Product")} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        isModal: true,
        isModalOpen: isCancelOrderModalOpen,
        setIsModal: setIsCancelOrderModalOpen,
        isDisabled: lossProductPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            userContext?.role?._id &&
            !ac?.permissionsRoles?.includes(userContext?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCancelOrderModalOpen,
      updateAccountProductStockHistory,
      lossProductPageDisabledCondition,
      userContext,
    ]
  );

  // Effect to reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterLossProductPanelFormElements, setCurrentPage]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          outsideSortProps={outsideSort}
          rows={rows ?? []}
          filterPanel={filterPanel}
          filters={filters}
          isSearch={false}
          addButton={addButton}
          title={t("Loss Product")}
          actions={actions}
          isActionsActive={true}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};
export default LossProduct;