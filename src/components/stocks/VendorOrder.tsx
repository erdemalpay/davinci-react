import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGeneralContext } from "../../context/General.context";
import { useOrderContext } from "../../context/Order.context";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountStocks } from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetAllLocations } from "../../utils/api/location";
import { LocationInput, VendorInput } from "../../utils/panelInputs";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericTable from "../panelComponents/Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};
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
      const productBaseQuantitiesTotal =
        product?.baseQuantities?.reduce((acc, baseQuantity) => {
          if (
            !vendorOrderFilterPanelFormElements?.location?.includes(
              baseQuantity.location
            )
          ) {
            return acc;
          }
          return acc + baseQuantity.quantity;
        }, 0) ?? 0;

      const productStocksTotal = stocks
        ?.filter((stock) => stock.product === product._id)
        ?.reduce((acc, stock) => {
          if (
            !vendorOrderFilterPanelFormElements?.location?.includes(
              stock.location
            )
          ) {
            return acc;
          }
          return acc + stock.quantity;
        }, 0);

      const requiredQuantity =
        productBaseQuantitiesTotal -
        (productStocksTotal > 0 ? productStocksTotal : 0);

      return {
        ...product,
        stockQuantity: productStocksTotal > 0 ? productStocksTotal : 0,
        baseQuantity: productBaseQuantitiesTotal,
        requiredQuantity: requiredQuantity,
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
      key: t("Base Quantity"),
      isSortable: true,
      correspondingKey: "baseQuantity",
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
    { key: "baseQuantity" },
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
          filterPanel={filterPanel}
          excelFileName={"VendorOrder.xlsx"}
        />
      </div>
    </>
  );
};

export default VendorOrder;
