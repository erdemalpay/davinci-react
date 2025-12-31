import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileUpload } from "react-icons/fa";
import * as XLSX from "xlsx";
import { useGeneralContext } from "../../context/General.context";
import { useCreateMultipleExpenseMutation } from "../../utils/api/account/expense";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";

const BulkExpenseCreate = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const {
    errorDataForCreateMultipleExpense,
    setErrorDataForCreateMultipleExpense,
  } = useGeneralContext();
  const { mutate: createMultipleExpense } = useCreateMultipleExpenseMutation();
  const inputRef = useRef<HTMLInputElement>(null);
  const rows =
    errorDataForCreateMultipleExpense?.length > 0
      ? errorDataForCreateMultipleExpense
      : [
          {
            date: "04-01-2025",
            product: "3 Peynirli Simit",
            expenseType: "Sandviç",
            location: "Neorama",
            brand: " ",
            vendor: "Atlantik Gıda",
            paymentMethod: "Kredi Kartı",
            quantity: 1,
            price: 50,
            vat: 18,
            discount: 5,
            isStockIncrement: false,
            isAfterCount: true,
            note: " ",
          },

          {
            date: "04-01-2025",
            product: "Filtre Kahve 250gr",
            expenseType: "İçecek",
            location: "Bahçeli",
            brand: "Tchibo",
            vendor: "Ramazan Ağca (trendyol)",
            paymentMethod: "Havale",
            quantity: 1,
            price: 120,
            vat: 10,
            discount: 0,
            isStockIncrement: true,
            isAfterCount: true,
            note: " ",
          },
        ];
  const columns = [
    {
      key: `${t("Date")} *`,
      isSortable: false,
      correspondingKey: "date",
    },
    {
      key: `${t("Product")} *`,
      isSortable: false,
      correspondingKey: "product",
    },

    {
      key: `${t("Expense Type")} *`,
      isSortable: true,
      correspondingKey: "expenseType",
    },
    {
      key: `${t("Location")} *`,
      isSortable: true,
      correspondingKey: "location",
    },
    {
      key: t("Brand"),
      isSortable: true,
      correspondingKey: "brand",
    },
    {
      key: `${t("Vendor")} *`,
      isSortable: true,
      correspondingKey: "vendor",
    },
    {
      key: `${t("Payment Method")} *`,
      isSortable: true,
      correspondingKey: "paymentMethod",
    },
    {
      key: `${t("Quantity")} *`,
      isSortable: true,
      correspondingKey: "quantity",
    },
    {
      key: `${t("Price")} *`,
      isSortable: true,
      correspondingKey: "price",
    },
    {
      key: `${t("Vat")} `,
      isSortable: true,
      correspondingKey: "vat",
    },
    {
      key: `${t("Discount")} `,
      isSortable: true,
      correspondingKey: "discount",
    },
    {
      key: `${t("Stock Increment")} *`,
      isSortable: true,
      correspondingKey: "isStockIncrement",
    },
    {
      key: `${t("Is After Count")} *`,
      isSortable: true,
      correspondingKey: "isAfterCount",
    },
    {
      key: t("Note"),
      isSortable: true,
      correspondingKey: "note",
    },

    ...(errorDataForCreateMultipleExpense?.length > 0
      ? [
          {
            key: t("Error"),
            isSortable: true,
            correspondingKey: "errorNote",
          },
        ]
      : []),
  ];
  const rowKeys = [
    { key: "date" },
    { key: "product" },
    { key: "expenseType", className: "pr-4" },
    { key: "location", className: "pr-4" },
    { key: "brand", className: "pr-4" },
    { key: "vendor", className: "pr-4" },
    { key: "paymentMethod", className: "pr-4" },
    { key: "quantity" },
    { key: "price" },
    { key: "vat" },
    { key: "discount" },
    { key: "isStockIncrement" },
    { key: "isAfterCount" },
    { key: "note" },
    ...(errorDataForCreateMultipleExpense?.length > 0
      ? [{ key: "errorNote" }]
      : []),
  ];
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

    setErrorDataForCreateMultipleExpense([]);
    createMultipleExpense(items);
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
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [errorDataForCreateMultipleExpense]);
  return (
    <>
      <div className="w-[95%] mx-auto my-10 flex flex-col gap-6 min-h-screen">
        <GenericTable
          key={tableKey}
          rows={rows}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          isExcel={true}
          title={t("Bulk Stock Expense Create")}
          isSearch={errorDataForCreateMultipleExpense?.length > 0}
          isColumnFilter={errorDataForCreateMultipleExpense?.length > 0}
          isPagination={errorDataForCreateMultipleExpense?.length > 0}
          isRowsPerPage={errorDataForCreateMultipleExpense?.length > 0}
          filters={filters}
          excelFileName="BulkExpenseCreate.xlsx"
        />
        {errorDataForCreateMultipleExpense?.length === 0 && (
          <p className="indent-2 text-sm">
            {t("Fields marked with an asterisk (*) are mandatory.")}
          </p>
        )}
      </div>
    </>
  );
};

export default BulkExpenseCreate;
