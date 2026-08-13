import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaFileUpload } from "react-icons/fa";
import { IoIosCreate, IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import { Header } from "../components/header/Header";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../types";
import {
  useCreateBulkProductAndMenuItemMutation,
  useUpdateMultipleProductMutations,
} from "../utils/api/account/product";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { getItem } from "../utils/getItem";
import { isActionDisabled } from "../utils/permissions";

// Ürün ve menü alanları bağımsız iki gruptur, bir grubun zorunlu alanları sadece o grup kullanılıyorsa aranır
const productGroupKeys = [
  "expenseType",
  "brand",
  "vendor",
  "countList",
  "locations",
];
const menuGroupKeys = [
  "category",
  "itemProduction",
  "price",
  "onlinePrice",
  "sku",
  "barcode",
  "description",
  "image",
];
const productRequiredKeys = ["expenseType"];
const menuRequiredKeys = ["category", "price"];

const hasValue = (value: any) => String(value ?? "").trim() !== "";
// Eski excel dosyalarında başlıklarda yıldız olmayabilir, eşleştirmede yok sayılır
const normalizeHeader = (header: any) =>
  String(header ?? "")
    .replace(/\*+$/, "")
    .trim();
// Excel sonundaki biçimlendirmeden kalan satırlar eksik veri değil, hiç satır değildir
const isEmptyRow = (item: any) =>
  !["name", ...productGroupKeys, ...menuGroupKeys].some((key) =>
    hasValue(item?.[key])
  );

const getMissingRequiredKeys = (item: any) => {
  const missingKeys: string[] = [];
  if (!hasValue(item?.name)) {
    missingKeys.push("name");
  }
  if (productGroupKeys.some((key) => hasValue(item?.[key]))) {
    for (const key of productRequiredKeys) {
      if (!hasValue(item?.[key])) missingKeys.push(key);
    }
  }
  if (menuGroupKeys.some((key) => hasValue(item?.[key]))) {
    for (const key of menuRequiredKeys) {
      if (!hasValue(item?.[key])) missingKeys.push(key);
    }
  }
  return missingKeys;
};

const BulkProductAdding = () => {
  const { t } = useTranslation();
  const [tableKey, setTableKey] = useState(0);
  const { mutate: createBulkProductAndMenuItem } =
    useCreateBulkProductAndMenuItemMutation();
  const { mutate: updateMultipleProduct } = useUpdateMultipleProductMutations();
  const {
    errorDataForProductBulkCreation,
    setErrorDataForProductBulkCreation,
  } = useGeneralContext();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const bulkProductAddDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.BULKPRODUCTADD, disabledConditions);
  }, [disabledConditions]);
  const createRef = useRef<HTMLInputElement>(null);
  const updateRef = useRef<HTMLInputElement>(null);
  // Seçilen dosya onaylanana kadar burada bekler, önizleme ekrandayken sunucuya istek gitmez
  const [previewRows, setPreviewRows] = useState<any[] | null>(null);
  const fieldLabels: Record<string, string> = useMemo(
    () => ({
      name: t("Name"),
      expenseType: t("Expense Type"),
      category: t("Menu Category"),
      price: t("Price"),
    }),
    [t]
  );
  const invalidPreviewRowCount = useMemo(
    () => previewRows?.filter((row) => row?.errorNote)?.length ?? 0,
    [previewRows]
  );
  const processExcelData = (data: any[], actionType: string) => {
    const isCreate = actionType === "create";
    const headers = data[0];
    const keys = [
      "name",
      "expenseType",
      "brand",
      "vendor",
      "countList",
      "locations",
      "image",
      "category",
      "itemProduction",
      "price",
      "onlinePrice",
      "sku",
      "barcode",
      "description",
    ];
    const translatedHeaders = [
      t("Name"),
      t("Expense Type"),
      t("Brand"),
      t("Vendor"),
      t("Count List"),
      t("Locations"),
      t("Image"),
      t("Menu Category"),
      t("Ingredients"),
      t("Price"),
      t("Online Price"),
      "SKU",
      t("Barcode"),
      t("Description"),
    ];

    const items = data
      .slice(1)
      .map((row) => {
        const item: any = {};
        row.forEach((cell: any, index: number) => {
          const translatedIndex = translatedHeaders.indexOf(
            normalizeHeader(headers[index])
          );
          if (translatedIndex !== -1) {
            const key = keys[translatedIndex];
            item[key] = cell;
          }
        });
        return item;
      })
      .filter((item) => !isEmptyRow(item));
    if (items.length === 0) {
      toast.error(t("No rows found in the selected file"));
      return;
    }
    setErrorDataForProductBulkCreation([]);
    if (!isCreate) {
      updateMultipleProduct(items);
      return;
    }
    setPreviewRows(
      items.map((item) => {
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
    createBulkProductAndMenuItem(previewRows);
    setPreviewRows(null);
  };
  const uploadExcelFile = (
    ref: React.RefObject<HTMLInputElement>,
    actionType: string
  ) => {
    const file = ref.current?.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const buffer = e.target?.result;
      if (buffer) {
        const wb = XLSX.read(buffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        processExcelData(data, actionType);
      }
      // Bu olmadan aynı dosya art arda ikinci kez seçilemiyor
      if (ref.current) ref.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileButtonClick = (actionType: string) => {
    const ref = actionType === "create" ? createRef : updateRef;
    if (ref.current) {
      ref.current.click();
    }
  };
  const rows =
    previewRows ??
    (errorDataForProductBulkCreation?.length > 0
      ? errorDataForProductBulkCreation
      : [
          {
            name: "7 Wonders Duel",
            expenseType: "Oyun Satışı",
            brand: "    ",
            vendor: "Kaissa Games",
            countList: "Temizlik Malzemeleri,Bar Genel",
            locations: "Neorama,Bahçeli",
            category: "İthal Oyunlar",
            itemProduction: "    ",
            price: 2100,
            onlinePrice: 2450,
            sku: "7WD-001",
            barcode: "1234567890123",
            description: "    ",
            image: "menu/7WondersDuel.png",
          },
          {
            name: "Orta boy çöp poşeti",
            expenseType: "Genel,Mutfak Genel",
            brand: "Eczacıbaşı,Selpak",
            vendor: "Öz Rize,Anka Toptan,Pem Ambalaj",
            countList: "    ",
            locations: "    ",
            category: "     ",
            itemProduction: "    ",
            price: "  ",
            onlinePrice: "   ",
            sku: " ",
            barcode: " ",
            description: "    ",
            image: "   ",
          },
          {
            name: "Margharita",
            expenseType: "    ",
            brand: "    ",
            vendor: "    ",
            countList: "    ",
            locations: "    ",
            category: "Pizzalar",
            itemProduction: "7 Wonders Duel_2,Karakum_3,Arnak",
            price: 280,
            onlinePrice: "   ",
            sku: " ",
            barcode: " ",
            description: "Domates sos, Mozerella peyniri, Fesleğen",
            image: "menu/Margharita.png",
          },
        ]);
  const isErrorColumnShown =
    invalidPreviewRowCount > 0 ||
    (!previewRows && errorDataForProductBulkCreation?.length > 0);
  const columns = [
    {
      key: `${t("Name")} **`,
      isSortable: false,
      className: "text-red-500",
      correspondingKey: "name",
    },

    {
      key: `${t("Expense Type")} *`,
      isSortable: true,
      className: "text-blue-500",
      correspondingKey: "expenseType",
    },
    {
      key: t("Brand"),
      isSortable: true,
      className: "text-blue-500",
      correspondingKey: "brand",
    },
    {
      key: t("Vendor"),
      isSortable: true,
      className: "text-blue-500",
      correspondingKey: "vendor",
    },
    {
      key: t("Count List"),
      isSortable: true,
      correspondingKey: "countList",
      className: "text-orange-500",
    },
    {
      key: t("Locations"),
      isSortable: true,
      correspondingKey: "locations",
      className: "text-orange-500",
    },

    {
      key: t("Image"),
      isSortable: true,
      correspondingKey: "image",
      className: "text-orange-500",
    },
    {
      key: `${t("Menu Category")} *`,
      isSortable: true,
      className: "text-orange-500",
      correspondingKey: "category",
    },
    {
      key: t("Ingredients"),
      isSortable: true,
      className: "text-orange-500",
      correspondingKey: "itemProduction",
    },
    {
      key: `${t("Price")} *`,
      isSortable: true,
      correspondingKey: "price",
      className: "text-orange-500",
    },
    {
      key: t("Online Price"),
      isSortable: true,
      correspondingKey: "onlinePrice",
      className: "text-orange-500",
    },
    {
      key: "SKU",
      isSortable: true,
      correspondingKey: "sku",
      className: "text-orange-500",
    },
    {
      key: t("Barcode"),
      isSortable: true,
      correspondingKey: "barcode",
      className: "text-orange-500",
    },
    {
      key: t("Description"),
      isSortable: true,
      correspondingKey: "description",
      className: "text-orange-500",
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
    { key: "name" },
    { key: "expenseType", className: "pr-4" },
    { key: "brand", className: "pr-4" },
    { key: "vendor", className: "pr-4" },
    { key: "countList", className: "pr-4" },
    { key: "locations", className: "pr-4" },
    { key: "image" },
    { key: "category" },
    { key: "itemProduction" },
    { key: "price" },
    { key: "onlinePrice" },
    { key: "sku" },
    { key: "barcode" },
    { key: "description" },
    ...(isErrorColumnShown ? [{ key: "errorNote" }] : []),
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
      isDisabled: isActionDisabled(bulkProductAddDisabledCondition, ActionEnum.ADD, user),
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
  const uploadFilters = [
    {
      isUpperSide: false,
      isDisabled: isActionDisabled(bulkProductAddDisabledCondition, ActionEnum.UPDATE, user),
      node: (
        <div
          className="my-auto  items-center text-xl cursor-pointer border px-2 py-1 rounded-md hover:bg-blue-50  bg-opacity-50 hover:scale-105"
          onClick={() => handleFileButtonClick("update")}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={() => uploadExcelFile(updateRef, "update")}
            style={{ display: "none" }}
            ref={updateRef}
          />
          <ButtonTooltip content={t("Update Products")}>
            <IoIosCreate />
          </ButtonTooltip>
        </div>
      ),
    },
    {
      isUpperSide: false,
      isDisabled: isActionDisabled(bulkProductAddDisabledCondition, ActionEnum.ADD, user),
      node: (
        <div
          className="my-auto  items-center text-xl cursor-pointer border px-2 py-1 rounded-md hover:bg-blue-50  bg-opacity-50 hover:scale-105"
          onClick={() => handleFileButtonClick("create")}
        >
          <input
            type="file"
            accept=".xlsx, .xls"
            onChange={() => uploadExcelFile(createRef, "create")}
            style={{ display: "none" }}
            ref={createRef}
          />
          <ButtonTooltip content={t("Create")}>
            <FaFileUpload />
          </ButtonTooltip>
        </div>
      ),
    },
  ];
  const filters = previewRows ? previewFilters : uploadFilters;
  const isTableToolsActive =
    !!previewRows || errorDataForProductBulkCreation?.length > 0;
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [errorDataForProductBulkCreation, previewRows]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 flex flex-col gap-6 ">
        {previewRows && invalidPreviewRowCount === 0 && (
          <p className="mb-2 text-sm text-gray-500">
            {t("Products will be uploaded after your confirmation")}
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
            !isActionDisabled(bulkProductAddDisabledCondition, ActionEnum.EXCEL, user)
          }
          title={t("Bulk Product Adding")}
          isSearch={isTableToolsActive}
          isColumnFilter={isTableToolsActive}
          isPagination={isTableToolsActive}
          isRowsPerPage={isTableToolsActive}
          rowClassNameFunction={(row: any) =>
            row?.errorNote ? "bg-red-200" : ""
          }
          filters={filters}
          excelFileName="BulkProductAdding.xlsx"
        />
        {!previewRows && errorDataForProductBulkCreation?.length === 0 && (
          <p className="indent-2 text-sm">
            {t(
              "The Name field must not be left blank. The blue columns are designated for entering product details, while the orange columns are for menu item details. Fields marked with an asterisk (*) are mandatory. You can fill out either product details or menu item details independently.The Expense Type, Brand and Vendor fields allow multiple entries. When entering multiple values, separate them with commas."
            )}
          </p>
        )}
      </div>
    </>
  );
};

export default BulkProductAdding;
