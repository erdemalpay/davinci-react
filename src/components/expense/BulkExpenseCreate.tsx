import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaFileUpload } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../../types";
import { useCreateMultipleExpenseMutation } from "../../utils/api/account/expense";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { convertDateFormat, formatCurrency } from "../../utils/format";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";

// Excel'den okunan bir satırın hangi alanları taşıyabileceği; boş satır ayıklamada kullanılır
const rowFieldKeys = [
  "date",
  "product",
  "expenseType",
  "location",
  "brand",
  "vendor",
  "paymentMethod",
  "quantity",
  "price",
  "vat",
  "discount",
  "isStockIncrement",
  "isAfterCount",
  "note",
];

// Tabloda yıldızlı gösterilen alanlar; eksikse satır sunucuya hiç gönderilmez
const requiredKeys = [
  "date",
  "product",
  "expenseType",
  "location",
  "vendor",
  "paymentMethod",
  "quantity",
  "price",
  "isStockIncrement",
  "isAfterCount",
];

const hasValue = (value: any) => String(value ?? "").trim() !== "";
const getMissingRequiredKeys = (item: any) =>
  requiredKeys.filter((key) => !hasValue(item?.[key]));
// Excel sonundaki biçimlendirmeden kalan satırlar eksik veri değil, hiç satır değildir
const isEmptyRow = (item: any) =>
  !rowFieldKeys.some((key) => hasValue(item?.[key]));
// Eski excel dosyalarında başlıklarda yıldız olmayabilir, eşleştirmede yok sayılır
const normalizeHeader = (header: any) =>
  String(header ?? "")
    .replace(/\*+$/, "")
    .trim();

const formatExcelDate = (value: any) =>
  typeof value === "number"
    ? convertDateFormat(
        new Date(Date.UTC(1899, 11, 30) + value * 86400000)
          .toISOString()
          .slice(0, 10)
      )
    : value;
// Excel hücresi metin gelebilir ("47,50"); geçersiz değer toplamı bozmasın diye 0 sayılır
const toNumber = (value: any) => {
  const parsed = Number(
    String(value ?? "")
      .replace(",", ".")
      .trim()
  );
  return Number.isFinite(parsed) ? parsed : 0;
};

// Backend ile birebir aynı: önce indirim düşülür, KDV indirimli tutar üzerinden eklenir
// davinci-be/src/modules/accounting/accounting.service.ts:1364
const getRowAmounts = (row: any) => {
  const price = toNumber(row?.price);
  const discount = toNumber(row?.discount);
  const vat = toNumber(row?.vat);
  const discountedPrice = price - (discount * price) / 100;
  const vatAmount = (discountedPrice * vat) / 100;
  return { discountedPrice, vatAmount, total: discountedPrice + vatAmount };
};

const BulkExpenseCreate = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const {
    errorDataForCreateMultipleExpense,
    setErrorDataForCreateMultipleExpense,
  } = useGeneralContext();
  const { mutate: createMultipleExpense } = useCreateMultipleExpenseMutation();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const bulkExpenseCreateDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.EXPENSES_BULKEXPENSECREATE,
      disabledConditions
    );
  }, [disabledConditions]);
  const inputRef = useRef<HTMLInputElement>(null);
  // Seçilen dosya onaylanana kadar burada bekler, önizleme ekrandayken sunucuya istek gitmez
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);
  const fieldLabels: Record<string, string> = useMemo(
    () => ({
      date: t("Date"),
      product: t("Product"),
      expenseType: t("Expense Type"),
      location: t("Location"),
      vendor: t("Vendor"),
      paymentMethod: t("Payment Method"),
      quantity: t("Quantity"),
      price: t("Price"),
      isStockIncrement: t("Stock Increment"),
      isAfterCount: t("Is After Count"),
    }),
    [t]
  );
  const invalidPreviewRowCount = useMemo(
    () => previewRows?.filter((row) => row?.errorNote)?.length ?? 0,
    [previewRows]
  );
  const isErrorColumnShown =
    invalidPreviewRowCount > 0 ||
    (!previewRows && errorDataForCreateMultipleExpense?.length > 0);
  const rows =
    previewRows ??
    (errorDataForCreateMultipleExpense?.length > 0
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
        ]);
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

    ...(isErrorColumnShown
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
    ...(isErrorColumnShown ? [{ key: "errorNote" }] : []),
  ];
  const processExcelData = (data: any[]) => {
    const headers = data[0];
    const columnKeys = columns.map((column) => normalizeHeader(column.key));
    const keys = rowKeys.map((rowKey) => rowKey.key);
    const items = data
      .slice(1)
      .reduce((accum: any[], row) => {
        const item: any = {};
        row.forEach((cell: any, index: number) => {
          const translatedIndex = columnKeys.indexOf(
            normalizeHeader(headers[index])
          );
          if (translatedIndex !== -1) {
            const key = keys[translatedIndex];
            item[key] = key === "date" ? formatExcelDate(cell) : cell;
          }
        });
        if (Object.keys(item).length > 0) {
          accum.push(item);
        }
        return accum;
      }, [])
      .filter((item: any) => !isEmptyRow(item));

    if (items.length === 0) {
      toast.error(t("No rows found in the selected file"));
      return;
    }
    setErrorDataForCreateMultipleExpense([]);
    setPreviewRows(
      items.map((item: any) => {
        const missingKeys = getMissingRequiredKeys(item);
        return missingKeys.length > 0
          ? {
              ...item,
              errorNote: `${t("Missing fields")}: ${missingKeys
                .map((key) => fieldLabels[key])
                .join(", ")}`,
            }
          : item;
      })
    );
  };

  const handlePreviewUpload = () => {
    if (!previewRows || invalidPreviewRowCount > 0) return;
    createMultipleExpense(previewRows);
    setPreviewRows(null);
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
      // Bu olmadan aynı dosya art arda ikinci kez seçilemiyor
      if (inputRef.current) inputRef.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };
  const handleFileButtonClick = () => {
    if (inputRef.current) {
      inputRef.current.click();
    }
  };

  const uploadFilters = [
    {
      isUpperSide: false,
      isDisabled: isActionDisabled(
        bulkExpenseCreateDisabledCondition,
        ActionEnum.UPLOAD,
        user
      ),
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
  const previewFilters = [
    {
      isUpperSide: false,
      node: (
        <div
          className="my-auto items-center text-xl cursor-pointer border px-2 py-1 rounded-md hover:bg-blue-50 bg-opacity-50 hover:scale-105"
          onClick={() => setPreviewRows(null)}
        >
          <ButtonTooltip content={t("Cancel")}>
            <IoMdClose />
          </ButtonTooltip>
        </div>
      ),
    },
    {
      isUpperSide: false,
      isDisabled: isActionDisabled(
        bulkExpenseCreateDisabledCondition,
        ActionEnum.UPLOAD,
        user
      ),
      node: (
        <div
          className={`my-auto items-center text-xl border px-2 py-1 rounded-md bg-opacity-50 ${
            invalidPreviewRowCount > 0
              ? "opacity-50 cursor-not-allowed"
              : "cursor-pointer text-green-600 hover:bg-blue-50 hover:scale-105"
          }`}
          onClick={handlePreviewUpload}
        >
          <ButtonTooltip
            content={
              invalidPreviewRowCount > 0
                ? t("Please fill all required fields")
                : t("Upload")
            }
          >
            <FaCheck />
          </ButtonTooltip>
        </div>
      ),
    },
  ];
  // Sabit örnek satırlarda toplam göstermek yanıltıcı olur; sadece gerçek veride gösterilir
  const isTotalShown =
    !!previewRows || errorDataForCreateMultipleExpense?.length > 0;
  const totals = useMemo(
    () =>
      (rows as any[]).reduce(
        (accum, row) => {
          const { discountedPrice, vatAmount, total } = getRowAmounts(row);
          return {
            subtotal: accum.subtotal + discountedPrice,
            vat: accum.vat + vatAmount,
            total: accum.total + total,
          };
        },
        { subtotal: 0, vat: 0, total: 0 }
      ),
    [rows]
  );
  const totalFilters = isTotalShown
    ? [
        {
          label: t("Subtotal (excluding VAT)") + " :",
          isUpperSide: false,
          node: <p>{formatCurrency(totals.subtotal)} ₺</p>,
        },
        {
          label: t("Vat") + " :",
          isUpperSide: false,
          node: <p>{formatCurrency(totals.vat)} ₺</p>,
        },
        {
          label: t("Grand Total") + " :",
          isUpperSide: false,
          node: <p>{formatCurrency(totals.total)} ₺</p>,
        },
      ]
    : [];
  const filters = [
    ...totalFilters,
    ...(previewRows ? previewFilters : uploadFilters),
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [errorDataForCreateMultipleExpense, previewRows]);
  return (
    <>
      <div className="w-[95%] mx-auto my-10 flex flex-col gap-6 min-h-screen">
        {isTotalShown && (
          <p className="text-base text-gray-500 italic mb-2">
            * {t("Bulk Expense Total Info Text")}
          </p>
        )}
        {previewRows && invalidPreviewRowCount === 0 && (
          <p className="mb-2 text-sm text-gray-500">
            {t("Expenses will be uploaded after your confirmation")}
          </p>
        )}
        <GenericTable
          key={tableKey}
          rows={rows}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          isExcel={
            user &&
            !isActionDisabled(
              bulkExpenseCreateDisabledCondition,
              ActionEnum.EXCEL,
              user
            )
          }
          title={t("Bulk Stock Expense Create")}
          isSearch={isTotalShown}
          isColumnFilter={isTotalShown}
          isPagination={isTotalShown}
          isRowsPerPage={isTotalShown}
          rowClassNameFunction={(row: any) =>
            row?.errorNote ? "bg-red-200" : ""
          }
          filters={filters}
          excelFileName="BulkExpenseCreate.xlsx"
        />
        {!previewRows && errorDataForCreateMultipleExpense?.length === 0 && (
          <p className="indent-2 text-sm">
            {t("Fields marked with an asterisk (*) are mandatory.")}
          </p>
        )}
      </div>
    </>
  );
};

export default BulkExpenseCreate;
