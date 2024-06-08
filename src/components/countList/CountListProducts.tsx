import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { AccountCountList } from "../../types";
import {
  useAccountCountListMutations,
  useGetAccountCountLists,
} from "../../utils/api/account/countList";
import { useGetAccountProducts } from "../../utils/api/account/product";
import { useGetAccountStockLocations } from "../../utils/api/account/stockLocation";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { RowKeyType } from "../panelComponents/shared/types";

type Props = {};

const CountListProducts = (props: Props) => {
  const { t } = useTranslation();
  const countLists = useGetAccountCountLists();
  const [tableKey, setTableKey] = useState(0);
  const products = useGetAccountProducts();
  const locations = useGetAccountStockLocations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { updateAccountCountList } = useAccountCountListMutations();
  const allRows = products.map((product) => ({
    product: product._id,
    name: product.name,
  }));
  const [rows, setRows] = useState(allRows);
  function handleCountListUpdate(row: any, countList: AccountCountList) {
    if (countList?.products?.find((item) => item.product === row.product)) {
      const newProducts = countList.products.filter(
        (item) => item.product !== row.product
      );
      updateAccountCountList({
        id: countList._id,
        updates: { products: newProducts },
      });
    } else {
      const newProducts = countList.products || [];
      newProducts.push({
        product: row.product,
        locations: locations.map((location) => location._id),
      });
      updateAccountCountList({
        id: countList._id,
        updates: { products: newProducts },
      });

      toast.success(`${t("Count List updated successfully")}`);
    }
  }

  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<any>[] = [
    {
      key: "name",
    },
  ];

  // Adding location columns and rowkeys
  for (const countList of countLists) {
    columns.push({ key: countList.name, isSortable: true });
    rowKeys.push({
      key: countList._id,
      node: (row: any) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={
              countList?.products?.find((item) => item.product === row.product)
                ? true
                : false
            }
            onChange={() => handleCountListUpdate(row, countList)}
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              countList?.products?.find((item) => item.product === row.product)
                ? "bg-green-500"
                : "bg-red-500"
            }`}
          >
            {countList?.products?.find((item) => item.product === row.product)
              ? t("Yes")
              : t("No")}
          </p>
        ),
    });
  }

  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: false,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [countLists, locations, products]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          filters={filters}
          rows={rows}
          title={t("Count List Products")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default CountListProducts;
