import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFileUpload } from "react-icons/fa";
import { IoIosCreate } from "react-icons/io";
import * as XLSX from "xlsx";
import { Header } from "../components/header/Header";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import { useGeneralContext } from "../context/General.context";
import {
  useCreateBulkProductAndMenuItemMutation,
  useUpdateMultipleProductMutations,
} from "../utils/api/account/product";

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
  const createRef = useRef<HTMLInputElement>(null);
  const updateRef = useRef<HTMLInputElement>(null);
  const processExcelData = (data: any[], actionType: string) => {
    const isCreate = actionType === "create";
    const headers = data[0];
    const keys = [
      "name",
      "expenseType",
      "brand",
      "vendor",
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
      `${t("Name")} **`,
      `${t("Expense Type")} *`,
      t("Brand"),
      t("Vendor"),
      t("Image"),
      `${t("Menu Category")} *`,
      `${t("Price")} *`,
      `${t("Ingredients")}`,
      t("Online Price"),
      "SKU",
      t("Barcode"),
      t("Description"),
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
    setErrorDataForProductBulkCreation([]);
    if (isCreate) {
      createBulkProductAndMenuItem(items);
    } else {
      updateMultipleProduct(items);
    }
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
    errorDataForProductBulkCreation?.length > 0
      ? errorDataForProductBulkCreation
      : [
          {
            name: "7 Wonders Duel",
            expenseType: "Oyun Satışı",
            brand: "    ",
            vendor: "Kaissa Games",
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
            category: "Pizzalar",
            itemProduction: "    ",
            price: 280,
            onlinePrice: "   ",
            sku: " ",
            barcode: " ",
            description: "Domates sos, Mozerella peyniri, Fesleğen",
            image: "menu/Margharita.png",
          },
        ];
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
      key: `${t("Ingredients")} `,
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
    ...(errorDataForProductBulkCreation?.length > 0
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
    { key: "image" },
    { key: "category" },
    { key: "itemProduction" },
    { key: "price" },
    { key: "onlinePrice" },
    { key: "sku" },
    { key: "barcode" },
    { key: "description" },
    ...(errorDataForProductBulkCreation?.length > 0
      ? [{ key: "errorNote" }]
      : []),
  ];
  const filters = [
    {
      isUpperSide: false,
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
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [errorDataForProductBulkCreation]);
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 flex flex-col gap-6 ">
        <GenericTable
          key={tableKey}
          rows={rows}
          rowKeys={rowKeys}
          isActionsActive={false}
          columns={columns}
          isExcel={true}
          title={t("Bulk Product Adding")}
          isSearch={errorDataForProductBulkCreation?.length > 0}
          isColumnFilter={errorDataForProductBulkCreation?.length > 0}
          isPagination={errorDataForProductBulkCreation?.length > 0}
          isRowsPerPage={errorDataForProductBulkCreation?.length > 0}
          filters={filters}
          excelFileName={t("BulkProductAdding.xlsx")}
        />
        {errorDataForProductBulkCreation?.length === 0 && (
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
