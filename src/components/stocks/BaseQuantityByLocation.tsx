import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileUpload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useGetAccountProducts,
  useUpdateProductsBaseQuantities,
} from "../../utils/api/account/product";
import { useGetAllLocations } from "../../utils/api/location";
import { ExpenseTypeInput } from "../../utils/panelInputs";
import SwitchButton from "../panelComponents/common/SwitchButton";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";

type FormElementsState = {
  [key: string]: any;
};
interface Quantities {
  [key: string]: number;
}
const BaseQuantityByLocation = () => {
  const { t } = useTranslation();
  const products = useGetAccountProducts();
  const [showFilters, setShowFilters] = useState(false);
  const { mutate: updateProductsBaseQuantities } =
    useUpdateProductsBaseQuantities();
  const locations = useGetAllLocations();
  const expenseTypes = useGetAccountExpenseTypes();
  const [tableKey, setTableKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const allRows = products?.map((product) => {
    const quantitiesObject = locations?.reduce<Quantities>((acc, location) => {
      acc[`${location._id}`] =
        product?.baseQuantities?.find(
          (baseQuantity) => baseQuantity?.location === location._id
        )?.quantity ?? 0;
      return acc;
    }, {});
    return {
      ...product,
      ...quantitiesObject,
    };
  });
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      expenseType: [],
    });
  const [rows, setRows] = useState(allRows);
  const filterPanelInputs = [
    ExpenseTypeInput({ expenseTypes: expenseTypes, isMultiple: true }),
  ];
  const columns = [
    { key: t("Name"), isSortable: true, correspondingKey: "name" },
  ];
  const rowKeys = [{ key: "name" }];
  locations?.forEach((location) => {
    columns.push({
      key: location.name,
      isSortable: true,
      correspondingKey: `${location._id}`,
    });
    rowKeys.push({
      key: `${location._id}`,
    });
  });
  const processExcelData = (data: any[]) => {
    const headers = data[0];
    const columnKeys = columns.map((column) => column.key);
    const keys = rowKeys.map((rowKey) => rowKey.key);
    const items = data.slice(1).reduce((accum: any[], row) => {
      const item: any = {};
      row.forEach((cell: any, index: number) => {
        const translatedIndex = columnKeys.indexOf(headers[index]);
        if (translatedIndex !== -1) {
          const key = keys[translatedIndex];
          item[key] = cell;
        }
      });
      if (Object.keys(item).length > 0) {
        accum.push(item);
      }
      return accum;
    }, []);
    updateProductsBaseQuantities(items);
  };
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
  const handleFileButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };
  const filters = [
    {
      isUpperSide: false,
      node: (
        <div
          className="my-auto  items-center text-xl cursor-pointer border px-2 py-1 rounded-md hover:bg-blue-50  bg-opacity-50 hover:scale-105"
          onClick={handleFileButtonClick}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={uploadExcelFile}
            style={{ display: "none" }}
            ref={inputRef}
          />
          <ButtonTooltip content={t("Upload")}>
            <FaFileUpload />
          </ButtonTooltip>
        </div>
      ),
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: <SwitchButton checked={showFilters} onChange={setShowFilters} />,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  useEffect(() => {
    const filteredRows = allRows?.filter((row) => {
      if (filterPanelFormElements.expenseType.length === 0) {
        return true;
      }
      return row.expenseType?.some((expense) =>
        filterPanelFormElements.expenseType.includes(expense)
      );
    });
    setRows(filteredRows);
    setTableKey((prev) => prev + 1);
  }, [products, locations, expenseTypes, filterPanelFormElements]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          title={t("Base Quantity By Location")}
          filters={filters}
          isActionsActive={false}
          isExcel={true}
          filterPanel={filterPanel}
          excelFileName={t("BaseQuantityByLocation.xlsx")}
        />
      </div>
    </>
  );
};

export default BaseQuantityByLocation;
