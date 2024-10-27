import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetMenuItems } from "../utils/api/menu/menu-item";
import { getItem } from "../utils/getItem";

const MenuPrice = () => {
  const { t } = useTranslation();
  const items = useGetMenuItems();
  const categories = useGetCategories();
  const [tableKey, setTableKey] = useState(0);
  const allRows = items.map((item) => ({
    ...item,
    category: getItem(item.category, categories)?.name,
  }));
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: "ID", isSortable: false, correspondingKey: "_id" },
    { key: t("Name"), isSortable: true, correspondingKey: "name" },
    { key: t("Price"), isSortable: true, correspondingKey: "price" },
    { key: t("Category"), isSortable: true, correspondingKey: "category" },
  ];
  const rowKeys = [
    { key: "_id" },
    { key: "name" },
    { key: "price" },
    { key: "category" },
  ];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [items, categories]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[98%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rows={rows}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          isExcel={true}
          title={t("Menu Price")}
          excelFileName={t("Menu Price")}
        />
      </div>
    </>
  );
};

export default MenuPrice;
