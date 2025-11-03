import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountStocks } from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetAllLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { InputTypes } from "../panelComponents/shared/types";

const VendorOrder = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const vendors = useGetAccountVendors();
  const products = useGetAccountProducts();
  const stocks = useGetAccountStocks();
  const locations = useGetAllLocations();
  const disabledConditions = useGetDisabledConditions();
  const { showStockFilters, setShowStockFilters } = useGeneralContext();
  const {
    vendorOrderFilterPanelFormElements,
    setVendorOrderFilterPanelFormElements,
  } = useOrderContext();

  const vendorOrderPageDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.STOCK_VENDORORDER, disabledConditions);
  }, [disabledConditions]);

  const rows = useMemo(() => {
    return products
      ?.filter(
        (product) =>
          vendorOrderFilterPanelFormElements?.vendor !== "" &&
          product?.vendor?.includes(vendorOrderFilterPanelFormElements?.vendor)
      )
      ?.map((product) => {
        const productMinBaseQuantitiesTotal =
          product?.baseQuantities?.reduce((acc, baseQuantity) => {
            if (
              !vendorOrderFilterPanelFormElements?.location?.includes(
                baseQuantity.location
              )
            ) {
              return acc;
            }
            return acc + Number(baseQuantity?.minQuantity);
          }, 0) ?? 0;
        const productMaxBaseQuantitiesTotal =
          product?.baseQuantities?.reduce((acc, baseQuantity) => {
            if (
              !vendorOrderFilterPanelFormElements?.location?.includes(
                baseQuantity.location
              )
            ) {
              return acc;
            }
            return acc + Number(baseQuantity?.maxQuantity);
          }, 0) ?? 0;

        let productStocksTotal = stocks
          ?.filter((stock) => stock.product === product._id)
          ?.reduce((acc, stock) => {
            if (
              !vendorOrderFilterPanelFormElements?.location?.includes(
                stock.location
              )
            ) {
              return acc;
            }
            return acc + Number(stock.quantity);
          }, 0);
        if (productStocksTotal < 0) {
          productStocksTotal = 0;
        }
        let requiredQuantity = 0;
        if (
          productMinBaseQuantitiesTotal === 0 &&
          productMaxBaseQuantitiesTotal === 0
        ) {
          requiredQuantity = 0;
        } else if (
          productStocksTotal >= productMinBaseQuantitiesTotal &&
          productStocksTotal <= productMaxBaseQuantitiesTotal
        ) {
          requiredQuantity = 0;
        } else if (productStocksTotal < productMinBaseQuantitiesTotal) {
          requiredQuantity = productMinBaseQuantitiesTotal - productStocksTotal;
        }
        return {
          ...product,
          stockQuantity: Number(productStocksTotal),
          minBaseQuantity: Number(productMinBaseQuantitiesTotal),
          maxBaseQuantity: Number(productMaxBaseQuantitiesTotal),
          requiredQuantity,
        };
      })
      ?.filter((row) => row.requiredQuantity > 0);
  }, [products, stocks, vendorOrderFilterPanelFormElements]);

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        placeholder: t("Vendor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        isMultiple: true,
        required: true,
      },
    ],
    [vendors, locations, t]
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true, correspondingKey: "name" },
      {
        key: t("Stock Quantity"),
        isSortable: true,
        correspondingKey: "stockQuantity",
      },
      {
        key: t("Minimum Base Quantity"),
        isSortable: true,
        correspondingKey: "minBaseQuantity",
      },
      {
        key: t("Maximum Base Quantity"),
        isSortable: true,
        correspondingKey: "maxBaseQuantity",
      },
      {
        key: t("Required Quantity"),
        isSortable: true,
        correspondingKey: "requiredQuantity",
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      { key: "stockQuantity" },
      { key: "minBaseQuantity" },
      { key: "maxBaseQuantity" },
      { key: "requiredQuantity" },
    ],
    []
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showStockFilters}
            onChange={() => {
              setShowStockFilters(!showStockFilters);
            }}
          />
        ),
      },
    ],
    [t, showStockFilters, setShowStockFilters]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showStockFilters,
      inputs: filterPanelInputs,
      formElements: vendorOrderFilterPanelFormElements,
      setFormElements: setVendorOrderFilterPanelFormElements,
      closeFilters: () => setShowStockFilters(false),
    }),
    [
      showStockFilters,
      filterPanelInputs,
      vendorOrderFilterPanelFormElements,
      setVendorOrderFilterPanelFormElements,
      setShowStockFilters,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Vendor Order")}
          filters={filters}
          isActionsActive={false}
          isExcel={
            user &&
            !vendorOrderPageDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          isToolTipEnabled={false}
          filterPanel={filterPanel}
          excelFileName={"VendorOrder.xlsx"}
        />
      </div>
    </>
  );
};

export default VendorOrder;
