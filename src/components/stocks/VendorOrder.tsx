import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountStocks } from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetAllLocations } from "../../utils/api/location";
import { LocationInput, VendorInput } from "../../utils/panelInputs";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";

const VendorOrder = () => {
  const { t } = useTranslation();
  const vendors = useGetAccountVendors();
  const products = useGetAccountProducts();
  const stocks = useGetAccountStocks();
  const locations = useGetAllLocations();
  const { showStockFilters, setShowStockFilters } = useGeneralContext();
  const [tableKey, setTableKey] = useState(0);
  const {
    vendorOrderFilterPanelFormElements,
    setVendorOrderFilterPanelFormElements,
  } = useOrderContext();
  const allRows = products
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
  const [rows, setRows] = useState(allRows);
  const filterPanelInputs = [
    VendorInput({ vendors: vendors }),
    LocationInput({ locations: locations, isMultiple: true }),
  ];
  const columns = [
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
  ];
  const rowKeys = [
    { key: "name" },
    { key: "stockQuantity" },
    { key: "minBaseQuantity" },
    { key: "maxBaseQuantity" },
    { key: "requiredQuantity" },
  ];
  const filters = [
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
  ];
  const filterPanel = {
    isFilterPanelActive: showStockFilters,
    inputs: filterPanelInputs,
    formElements: vendorOrderFilterPanelFormElements,
    setFormElements: setVendorOrderFilterPanelFormElements,
    closeFilters: () => setShowStockFilters(false),
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    vendors,
    products,
    stocks,
    locations,
    vendorOrderFilterPanelFormElements,
  ]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Vendor Order")}
          filters={filters}
          isActionsActive={false}
          isExcel={true}
          isToolTipEnabled={false}
          filterPanel={filterPanel}
          excelFileName={"VendorOrder.xlsx"}
        />
      </div>
    </>
  );
};

export default VendorOrder;
