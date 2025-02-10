import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { ExpirationListType } from "../../types";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useExpirationListMutations,
  useGetExpirationLists,
} from "../../utils/api/expiration/expirationList";
import { useGetStockLocations } from "../../utils/api/location";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { RowKeyType } from "../panelComponents/shared/types";

const ExpirationListProducts = () => {
  const { t } = useTranslation();
  const expirationLists = useGetExpirationLists();
  const [tableKey, setTableKey] = useState(0);
  const products = useGetAccountProducts();
  const locations = useGetStockLocations();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { updateExpirationList } = useExpirationListMutations();
  const allRows = products.map((product) => ({
    product: product._id,
    name: product.name,
  }));

  const [rows, setRows] = useState(allRows);
  function handleExpirationListUpdate(
    row: any,
    expirationList: ExpirationListType
  ) {
    if (
      expirationList?.products?.find((item) => item.product === row.product)
    ) {
      const newProducts = expirationList.products.filter(
        (item) => item.product !== row.product
      );
      updateExpirationList({
        id: expirationList._id,
        updates: { products: newProducts },
      });
    } else {
      const newProducts = expirationList.products || [];
      newProducts.push({
        product: row.product,
        locations: locations.map((location) => location._id),
      });
      updateExpirationList({
        id: expirationList._id,
        updates: { products: newProducts },
      });

      toast.success(`${t("Count List updated successfully")}`);
    }
  }

  const columns = [{ key: t("Name"), isSortable: true }];

  const checkProductIsInExpirationLists = (product: string) => {
    return expirationLists?.some((expirationList) =>
      expirationList?.products?.some((item) => item.product === product)
    );
  };
  const rowKeys: RowKeyType<any>[] = [
    {
      key: "name",
      node: (row) => {
        const className = checkProductIsInExpirationLists(row.product)
          ? ""
          : "bg-red-200 w-fit px-2 py-1 rounded-md text-white";
        return <div className={className}>{row.name}</div>;
      },
    },
  ];

  // Adding location columns and rowkeys
  for (const expirationList of expirationLists) {
    columns.push({ key: expirationList.name, isSortable: true });
    rowKeys.push({
      key: expirationList._id,
      node: (row: any) => {
        const isChecked = expirationList?.products?.some(
          (item) => item.product === row.product
        );
        return isEnableEdit ? (
          <div
            className={`${
              expirationLists?.length === 1 ? "flex justify-center" : ""
            }`}
          >
            <CheckSwitch
              checked={isChecked ?? false}
              onChange={() => handleExpirationListUpdate(row, expirationList)}
            />
          </div>
        ) : isChecked ? (
          <IoCheckmark
            className={`text-blue-500 text-2xl ${
              expirationLists?.length === 1 ? "mx-auto" : ""
            }`}
          />
        ) : (
          <IoCloseOutline
            className={`text-red-800 text-2xl ${
              expirationLists?.length === 1 ? "mx-auto" : ""
            }`}
          />
        );
      },
    });
  }
  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [expirationLists, locations, products]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          filters={filters}
          rows={rows}
          title={t("Expiration List Products")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default ExpirationListProducts;
