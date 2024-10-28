import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileUpload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { Header } from "../components/header/Header";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGetCategories } from "../utils/api/menu/category";
import {
  useGetMenuItems,
  useUpdateItemsMutation,
} from "../utils/api/menu/menu-item";
import { getItem } from "../utils/getItem";

const MenuPrice = () => {
  const { t } = useTranslation();
  const items = useGetMenuItems();
  const categories = useGetCategories();
  const [tableKey, setTableKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { mutate: updateItems } = useUpdateItemsMutation();
  const allRows = items?.map((item) => ({
    ...item,
    category: getItem(item.category, categories)?.name,
    onlinePrice: item?.onlinePrice ?? "",
  }));
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: "ID", isSortable: false, correspondingKey: "_id" },
    { key: t("Name"), isSortable: true, correspondingKey: "name" },
    { key: t("Price"), isSortable: true, correspondingKey: "price" },
    {
      key: t("Online Price"),
      isSortable: true,
      correspondingKey: "onlinePrice",
    },
    { key: t("Category"), isSortable: true, correspondingKey: "category" },
  ];
  const rowKeys = [
    { key: "_id" },
    { key: "name" },
    { key: "price" },
    { key: "onlinePrice" },
    { key: "category" },
  ];
  const uploadExcelFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const buffer = e.target?.result;
      if (buffer) {
        const wb = XLSX.read(buffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        processExcelData(data);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processExcelData = (data: any[]) => {
    const headers = data[0];
    const keys = ["_id", "name", "price", "onlinePrice", "category"];
    const translatedHeaders = [
      t("ID"),
      t("Name"),
      t("Price"),
      t("Online Price"),
      t("Category"),
    ];
    const items = data.slice(1).map((row) => {
      const item: any = {};
      row.forEach((cell: any, index: number) => {
        const translatedIndex = translatedHeaders.indexOf(headers[index]);
        if (translatedIndex !== -1) {
          const key = keys[translatedIndex];
          item[key] = cell;
        }
      });
      return item;
    });
    updateItems(items);
  };
  const handleFileButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [items, categories]);
  const filters = [
    {
      isUpperSide: false,
      node: (
        <div>
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={uploadExcelFile}
            style={{ display: "none" }}
            ref={inputRef}
          />
          <ButtonTooltip content={t("Upload")}>
            <FaFileUpload
              className="text-3xl my-auto cursor-pointer "
              onClick={handleFileButtonClick}
            />
          </ButtonTooltip>
        </div>
      ),
    },
  ];
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
          filters={filters}
          excelFileName={t("MenuPrice.xlsx")}
        />
      </div>
    </>
  );
};

export default MenuPrice;