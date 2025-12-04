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
  StockHistoryStatusEnum,
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
import { useConsumptStockMutation } from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetUsersMinimal } from "../../utils/api/user";
import { formatAsLocalDate } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const EnterConsumption = () => {
  const { t } = useTranslation();
  const { mutate: consumptStock } = useConsumptStockMutation();
  const { rowsPerPage, currentPage, setCurrentPage } = useGeneralContext();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCancelOrderModalOpen, setIsCancelOrderModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>({});
  const { updateAccountProductStockHistory } =
    useAccountProductStockHistoryMutations();
  const {
    filterEnterConsumptionPanelFormElements,
    setFilterEnterConsumptionPanelFormElements,
    showEnterConsumptionFilters,
    setShowEnterConsumptionFilters,
  } = useFilterContext();
  const stockHistoriesPayload = useGetAccountProductStockHistorys(
    currentPage,
    rowsPerPage,
    filterEnterConsumptionPanelFormElements
  );
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  stockHistoriesPayload as StockHistoryPayload;
  const products = useGetAccountProducts();
  const { user } = useUserContext();
  const users = useGetUsersMinimal(); 
  const expenseTypes = useGetAccountExpenseTypes();
  const locations = useGetStockLocations();
  const disabledConditions = useGetDisabledConditions();
  const enterConsumptionPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.STOCK_ENTERCONSUMPTION,
      disabledConditions
    );
  }, [disabledConditions]);
  const pad = useMemo(() => (num: number) => num < 10 ? `0${num}` : num, []);

  const rows = useMemo(() => {
    return stockHistoriesPayload?.data?.map((stockHistory) => {
      if (!stockHistory?.createdAt) {
        return null;
      }
      const date = new Date(stockHistory.createdAt);
      const foundProduct = getItem(stockHistory.product, products);
      return {
        ...stockHistory,
        prdct: foundProduct?.name,
        lctn: getItem(stockHistory?.location, locations)?.name,
        usr: getItem(stockHistory?.user, users)?.name,
        newQuantity:
          (stockHistory?.currentAmount ?? 0) + (stockHistory?.change ?? 0),
        date: format(stockHistory?.createdAt, "yyyy-MM-dd"),
        formattedDate: formatAsLocalDate(
          format(stockHistory?.createdAt, "yyyy-MM-dd")
        ),
        hour: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
        productCost: (
          (foundProduct?.unitPrice ?? 0) *
          (stockHistory?.change ?? 0) *
          -1
        )?.toFixed(2),
      };
    });
  }, [stockHistoriesPayload, products, locations, users, pad]);

  const isShowPricesDisabled = useMemo(() => {
    return enterConsumptionPageDisabledCondition?.actions?.some(
      (ac) =>
        ac.action === ActionEnum.SHOWPRICES &&
        user?.role?._id &&
        !ac?.permissionsRoles?.includes(user?.role?._id)
    );
  }, [enterConsumptionPageDisabledCondition, user]);

  const consumptInputs = useMemo(
    () => [
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
      {
        type: InputTypes.NUMBER,
        formKey: "quantity",
        label: t("Quantity"),
        placeholder: t("Quantity"),
        required: true,
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
    ],
    [products, locations, t]
  );

  const consumptFormKeys = useMemo(
    () => [
      { key: "product", type: FormKeyTypeEnum.STRING },
      { key: "quantity", type: FormKeyTypeEnum.NUMBER },
      { key: "location", type: FormKeyTypeEnum.STRING },
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
        ? [
            { key: t("Cost"), isSortable: false },
            { key: t("Old Quantity"), isSortable: false },
          ]
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

  const addButton = useMemo(
    () => ({
      name: t("Add Consumption"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={consumptInputs}
          formKeys={consumptFormKeys}
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
      isDisabled: enterConsumptionPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    }),
    [
      t,
      isAddModalOpen,
      consumptInputs,
      consumptFormKeys,
      consumptStock,
      enterConsumptionPageDisabledCondition,
      user,
    ]
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
              key: "productCost",
              className: "min-w-32 pr-1",
            },
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

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showEnterConsumptionFilters}
            onChange={() => {
              setShowEnterConsumptionFilters(!showEnterConsumptionFilters);
            }}
          />
        ),
      },
    ],
    [t, showEnterConsumptionFilters, setShowEnterConsumptionFilters]
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
      isFilterPanelActive: showEnterConsumptionFilters,
      inputs: filterPanelInputs,
      formElements: filterEnterConsumptionPanelFormElements,
      setFormElements: setFilterEnterConsumptionPanelFormElements,
      closeFilters: () => setShowEnterConsumptionFilters(false),
    }),
    [
      showEnterConsumptionFilters,
      filterPanelInputs,
      filterEnterConsumptionPanelFormElements,
      setFilterEnterConsumptionPanelFormElements,
      setShowEnterConsumptionFilters,
    ]
  );

  const outsideSort = useMemo(
    () => ({
      filterPanelFormElements: filterEnterConsumptionPanelFormElements,
      setFilterPanelFormElements: setFilterEnterConsumptionPanelFormElements,
    }),
    [
      filterEnterConsumptionPanelFormElements,
      setFilterEnterConsumptionPanelFormElements,
    ]
  );

  const outsideSearchProps = useMemo(() => {
    return {
      t,
      filterPanelFormElements: filterEnterConsumptionPanelFormElements,
      setFilterPanelFormElements: setFilterEnterConsumptionPanelFormElements,
    };
  }, [t, filterEnterConsumptionPanelFormElements, setFilterEnterConsumptionPanelFormElements]);

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
                    rowToAction.status === StockHistoryStatusEnum.CONSUMPTION
                      ? StockHistoryStatusEnum.CONSUMPTIONCANCEL
                      : StockHistoryStatusEnum.CONSUMPTION,
                },
              });
              setIsCancelOrderModalOpen(false);
            }}
            title={t("Consumption Cancel")}
            text={`${t("Consumption")} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        isModal: true,
        isModalOpen: isCancelOrderModalOpen,
        setIsModal: setIsCancelOrderModalOpen,
        isDisabled: enterConsumptionPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCancelOrderModalOpen,
      updateAccountProductStockHistory,
      enterConsumptionPageDisabledCondition,
      user,
    ]
  );

  // Effect to reset current page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [filterEnterConsumptionPanelFormElements, setCurrentPage]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          outsideSortProps={outsideSort}
          outsideSearchProps={outsideSearchProps}
          rows={rows ?? []}
          filterPanel={filterPanel}
          filters={filters}
          isSearch={false}
          addButton={addButton}
          title={t("Consumption History")}
          isActionsActive={true}
          actions={actions}
          {...(pagination && { pagination })}
        />
      </div>
    </>
  );
};

export default EnterConsumption;
