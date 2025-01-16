import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAllLocations } from "../../utils/api/location";
import GenericTable from "../panelComponents/Tables/GenericTable";

interface Quantities {
  [key: string]: number;
}
const BaseQuantityByLocation = () => {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const locations = useGetAllLocations();
  const [tableKey, setTableKey] = useState(0);
  const allRows = products.map((product) => {
    const quantitiesObject = product.baseQuantities?.reduce<Quantities>(
      (acc, baseQuantity) => {
        acc[`location_${baseQuantity.location}`] = baseQuantity.quantity;
        return acc;
      },
      {}
    );
    return {
      ...product,
      ...quantitiesObject,
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true, correspondingKey: "name" },
  ];
  const rowKeys = [{ key: "name" }];
  locations.forEach((location) => {
    columns.push({
      key: location.name,
      isSortable: true,
      correspondingKey: `location_${location._id}`,
    });
    rowKeys.push({
      key: `location_${location._id}`,
    });
  });

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [products]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Base Quantity By Location")}
          //   addButton={addButton}
          //   filterPanel={filterPanel}
          //   filters={filters}
          //   actions={actions}
          isActionsActive={false}
          //   isExcel={user && [RoleEnum.MANAGER].includes(user?.role?._id)}
          //   excelFileName={t("GamesByLocation.xlsx")}
        />
      </div>
    </>
  );
};

export default BaseQuantityByLocation;
