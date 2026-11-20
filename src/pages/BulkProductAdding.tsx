import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaFileUpload } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoIosCreate, IoMdClose } from "react-icons/io";
import { toast } from "react-toastify";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../components/panelComponents/Tables/ButtonTooltip";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../types";
import { useGetAccountBrands } from "../utils/api/account/brand";
import { useGetAccountCountLists } from "../utils/api/account/countList";
import { useGetAccountExpenseTypes } from "../utils/api/account/expenseType";
import {
  CreateBulkProductAndMenuItem,
  useCreateBulkProductAndMenuItemMutation,
  useUpdateMultipleProductMutations,
  validateBulkProductAndMenuItem,
} from "../utils/api/account/product";
import { useGetAccountVendors } from "../utils/api/account/vendor";
import { useGetAllLocations } from "../utils/api/location";
import { useGetCategories } from "../utils/api/menu/category";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { getApiErrorMessage } from "../utils/getApiErrorMessage";
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
const hasValue = (value: any) => String(value ?? "").trim() !== "";
// Eski excel dosyalarında başlıklarda yıldız olmayabilir, eşleştirmede yok sayılır
const normalizeHeader = (header: any) =>
  String(header ?? "")
    .replace(/\*+$/, "")
    .trim();
const isEmptyRow = (item: any) =>
  !["name", ...productGroupKeys, ...menuGroupKeys].some((key) =>
    hasValue(item?.[key])
  );

// Tek ürün formu: seçmeli alanlarda değer kaydın adıdır, gönderirken excel satırı gibi virgülle birleştirilir
type SingleProductForm = {
  name: string;
  expenseType: string[];
  brand: string[];
  vendor: string[];
  countList: string[];
  locations: string[];
  image: string;
  category: string;
  itemProduction: string;
  price: string;
  onlinePrice: string;
  sku: string;
  barcode: string;
  description: string;
};
const initialSingleProductForm: SingleProductForm = {
  name: "",
  expenseType: [],
  brand: [],
  vendor: [],
  countList: [],
  locations: [],
  image: "",
  category: "",
  itemProduction: "",
  price: "",
  onlinePrice: "",
  sku: "",
  barcode: "",
  description: "",
};
const toNameOptions = (list: { name: string }[]) =>
  list.map((item) => ({ value: item.name, label: item.name }));
// Önizleme ya da hatalı satır tabloda sırasıyla tutulur, düzenle/kaldır hangi satır olduğunu buradan bilir
type ActionRow = CreateBulkProductAndMenuItem & { rowIndex: number };
const splitNames = (value?: string) =>
  String(value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
const trimText = (value?: string | number) => String(value ?? "").trim();
// Tablodaki satırı (excelden ya da formdan) tekrar düzenlemek için forma çevirir
const toSingleProductForm = (
  row: CreateBulkProductAndMenuItem
): SingleProductForm => ({
  name: trimText(row.name),
  expenseType: splitNames(row.expenseType),
  brand: splitNames(row.brand),
  vendor: splitNames(row.vendor),
  countList: splitNames(row.countList),
  locations: splitNames(row.locations),
  image: trimText(row.image),
  category: trimText(row.category),
  itemProduction: trimText(row.itemProduction),
  price: trimText(row.price),
  onlinePrice: trimText(row.onlinePrice),
  sku: trimText(row.sku),
  barcode: trimText(row.barcode),
  description: trimText(row.description),
});

const translateErrorNote = (errorNote: string, t: (key: string) => string) => {
  const separatorIndex = errorNote.indexOf(": ");
  if (separatorIndex === -1) return t(errorNote);
  const prefix = errorNote.slice(0, separatorIndex);
  const detail = errorNote.slice(separatorIndex + 2);
  return prefix === "Missing fields"
    ? `${t(prefix)}: ${detail
        .split(", ")
        .map((field) => t(field))
        .join(", ")}`
    : `${t(prefix)}: ${detail}`;
};

const bulkProductAddingInfo =
  "The Name field must not be left blank. The blue columns are designated for entering product details, while the orange columns are for menu item details. Fields marked with an asterisk (*) are mandatory. You can fill out either product details or menu item details independently.The Expense Type, Brand and Vendor fields allow multiple entries. When entering multiple values, separate them with commas.";

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
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const invalidPreviewRowCount = useMemo(
    () => previewRows?.filter((row) => row?.errorNote)?.length ?? 0,
    [previewRows]
  );
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const countLists = useGetAccountCountLists();
  const locations = useGetAllLocations();
  const categories = useGetCategories();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [singleProductForm, setSingleProductForm] = useState(
    initialSingleProductForm
  );
  // Excel'deki kural: bir grubun zorunlu alanları sadece o gruptan bir alan doluysa aranır
  const isProductGroupUsed = productGroupKeys.some((key) =>
    hasValue(singleProductForm[key as keyof SingleProductForm])
  );
  const isMenuGroupUsed = menuGroupKeys.some((key) =>
    hasValue(singleProductForm[key as keyof SingleProductForm])
  );
  const singleProductInputs = [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      labelClassName: "text-red-500",
      label: t("Name"),
      placeholder: t("Name"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      labelClassName: "text-blue-500",
      label: t("Expense Type"),
      options: toNameOptions(expenseTypes),
      isMultiple: true,
      placeholder: t("Expense Type"),
      required: isProductGroupUsed,
    },
    {
      type: InputTypes.SELECT,
      formKey: "brand",
      labelClassName: "text-blue-500",
      label: t("Brand"),
      options: toNameOptions(brands),
      isMultiple: true,
      placeholder: t("Brand"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "vendor",
      labelClassName: "text-blue-500",
      label: t("Vendor"),
      options: toNameOptions(vendors),
      isMultiple: true,
      placeholder: t("Vendor"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "countList",
      labelClassName: "text-blue-500",
      label: t("Count List"),
      options: toNameOptions(countLists),
      isMultiple: true,
      placeholder: t("Count List"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "locations",
      labelClassName: "text-blue-500",
      label: t("Locations"),
      options: toNameOptions(locations),
      isMultiple: true,
      placeholder: t("Locations"),
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "image",
      labelClassName: "text-orange-500",
      label: t("Image"),
      placeholder: "menu/7WondersDuel.png",
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "category",
      labelClassName: "text-orange-500",
      label: t("Menu Category"),
      options: toNameOptions(categories),
      placeholder: t("Menu Category"),
      required: isMenuGroupUsed,
    },
    {
      type: InputTypes.TEXT,
      formKey: "itemProduction",
      labelClassName: "text-orange-500",
      label: t("Ingredients"),
      placeholder: "7 Wonders Duel_2,Karakum_3,Arnak",
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "price",
      labelClassName: "text-orange-500",
      label: t("Price"),
      placeholder: t("Price"),
      required: isMenuGroupUsed,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "onlinePrice",
      labelClassName: "text-orange-500",
      label: t("Online Price"),
      placeholder: t("Online Price"),
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "sku",
      labelClassName: "text-orange-500",
      label: "SKU",
      placeholder: "SKU",
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "barcode",
      labelClassName: "text-orange-500",
      label: t("Barcode"),
      placeholder: t("Barcode"),
      required: false,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "description",
      labelClassName: "text-orange-500",
      label: t("Description"),
      placeholder: t("Description"),
      required: false,
    },
  ];
  const singleProductFormKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "expenseType", type: FormKeyTypeEnum.ARRAY },
    { key: "brand", type: FormKeyTypeEnum.ARRAY },
    { key: "vendor", type: FormKeyTypeEnum.ARRAY },
    { key: "countList", type: FormKeyTypeEnum.ARRAY },
    { key: "locations", type: FormKeyTypeEnum.ARRAY },
    { key: "image", type: FormKeyTypeEnum.STRING },
    { key: "category", type: FormKeyTypeEnum.STRING },
    { key: "itemProduction", type: FormKeyTypeEnum.STRING },
    { key: "price", type: FormKeyTypeEnum.NUMBER },
    { key: "onlinePrice", type: FormKeyTypeEnum.NUMBER },
    { key: "sku", type: FormKeyTypeEnum.STRING },
    { key: "barcode", type: FormKeyTypeEnum.STRING },
    { key: "description", type: FormKeyTypeEnum.STRING },
  ];
  // Excel önizlemesiyle aynı: liste doğrulanır, hatalar satırda görünür, kayıt ancak onaydan sonra yapılır
  const validatePreviewRows = async (items: CreateBulkProductAndMenuItem[]) => {
    if (items.length === 0) {
      setPreviewRows(null);
      return;
    }
    setIsPreviewLoading(true);
    try {
      const errorNotes = await validateBulkProductAndMenuItem(items);
      setErrorDataForProductBulkCreation([]);
      setPreviewRows(
        items.map((item, index) =>
          errorNotes?.[index] ? { ...item, errorNote: errorNotes[index] } : item
        )
      );
    } catch (error) {
      toast.error(getApiErrorMessage(error, t("An unexpected error occurred")));
    } finally {
      setIsPreviewLoading(false);
    }
  };
  // Tabloda o an görünen liste: önizleme açıksa o, değilse yüklemeden dönen hatalı satırlar
  const actionRows: CreateBulkProductAndMenuItem[] =
    previewRows ?? errorDataForProductBulkCreation;
  // Eski hata notu tekrar doğrulamaya gitmesin
  const toPreviewItems = (list: CreateBulkProductAndMenuItem[]) =>
    list.map((row) => ({ ...row, errorNote: undefined }));
  // Form satırı listeye eklenir ya da düzenlenen satırın yerine geçer; yükleme sonrası
  // hatalı satır düzenlenirse o satır hatalılardan çıkıp önizlemeye geçer
  const submitSingleProduct = (replacedRowIndex?: number) => {
    const form = singleProductForm;
    const formRow: CreateBulkProductAndMenuItem = {
      name: form.name,
      expenseType: form.expenseType.join(","),
      brand: form.brand.join(","),
      vendor: form.vendor.join(","),
      countList: form.countList.join(","),
      locations: form.locations.join(","),
      image: form.image,
      category: form.category,
      itemProduction: form.itemProduction,
      price: hasValue(form.price) ? Number(form.price) : undefined,
      onlinePrice: hasValue(form.onlinePrice)
        ? Number(form.onlinePrice)
        : undefined,
      sku: form.sku,
      barcode: form.barcode,
      description: form.description,
    };
    const previewList =
      replacedRowIndex === undefined
        ? [...(previewRows ?? []), formRow]
        : previewRows
        ? previewRows.map((row, index) =>
            index === replacedRowIndex ? formRow : row
          )
        : [formRow];
    validatePreviewRows(toPreviewItems(previewList));
    setSingleProductForm(initialSingleProductForm);
  };
  // Ekle ve düzenle aynı formu kullanır
  const singleProductPanelProps = {
    inputs: singleProductInputs,
    formKeys: singleProductFormKeys,
    setForm: setSingleProductForm,
    submitItem: () => undefined,
    generalClassName: "overflow-visible",
    topClassName: "flex flex-col gap-2",
    upperMessage: [t(bulkProductAddingInfo)],
  };
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<ActionRow>();
  const editedRow = rowToAction && actionRows[rowToAction.rowIndex];
  const actions = [
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToAction,
      modal:
        rowToAction && editedRow ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            {...singleProductPanelProps}
            constantValues={toSingleProductForm(editedRow)}
            isEditMode
            handleUpdate={() => submitSingleProduct(rowToAction.rowIndex)}
          />
        ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: isActionDisabled(
        bulkProductAddDisabledCondition,
        ActionEnum.ADD,
        user
      ),
    },
    {
      name: t("Remove"),
      icon: <HiOutlineTrash />,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: false,
      isPath: false,
      // Satır sadece bu listeden kalkar, veritabanına bir şey gitmez.
      // Önizlemede kalanlar yeniden doğrulanır (ör. aynı ad iki kez eklendiyse)
      onClick: (row: ActionRow) => {
        const remainingRows = actionRows.filter(
          (_, index) => index !== row.rowIndex
        );
        if (previewRows) {
          validatePreviewRows(toPreviewItems(remainingRows));
        } else {
          setErrorDataForProductBulkCreation(remainingRows);
        }
      },
    },
  ];
  const addButton = {
    name: t("Add Product"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        {...singleProductPanelProps}
        submitFunction={() => submitSingleProduct()}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    isDisabled:
      isPreviewLoading ||
      isActionDisabled(bulkProductAddDisabledCondition, ActionEnum.ADD, user),
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  const processExcelData = async (data: any[], actionType: string) => {
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
    if (!isCreate) {
      setErrorDataForProductBulkCreation([]);
      updateMultipleProduct(items);
      return;
    }
    await validatePreviewRows(items);
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
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      const buffer = e.target?.result;
      if (buffer) {
        // Loaded on demand: xlsx is too big for the main bundle.
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buffer, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
        await processExcelData(data, actionType);
      }
      // Bu olmadan aynı dosya art arda ikinci kez seçilemiyor
      if (ref.current) ref.current.value = "";
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileButtonClick = (actionType: string) => {
    if (isPreviewLoading) return;
    const ref = actionType === "create" ? createRef : updateRef;
    if (ref.current) {
      ref.current.click();
    }
  };
  const translateRowErrors = (list: any[]) =>
    list.map((row) =>
      row?.errorNote
        ? { ...row, errorNote: translateErrorNote(row.errorNote, t) }
        : row
    );
  const rows =
    actionRows.length > 0
      ? translateRowErrors(actionRows).map((row, rowIndex) => ({
          ...row,
          rowIndex,
        }))
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
        ];
  const isRowActionsActive = actionRows.length > 0;
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
    ...(isRowActionsActive ? [{ key: t("Actions"), isSortable: false }] : []),
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
      isDisabled:
        isPreviewLoading ||
        isActionDisabled(bulkProductAddDisabledCondition, ActionEnum.UPDATE, user),
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
      isDisabled:
        isPreviewLoading ||
        isActionDisabled(bulkProductAddDisabledCondition, ActionEnum.ADD, user),
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
        {isPreviewLoading && (
          <p className="mb-2 text-sm text-gray-500">
            {t("Rows are being checked")}
          </p>
        )}
        {previewRows && invalidPreviewRowCount === 0 && (
          <p className="mb-2 text-sm text-gray-500">
            {t("Products will be uploaded after your confirmation")}
          </p>
        )}
        <GenericTable
          key={tableKey}
          rows={rows}
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={isRowActionsActive}
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
          addButton={addButton}
          excelFileName="BulkProductAdding.xlsx"
        />
        {!previewRows && errorDataForProductBulkCreation?.length === 0 && (
          <p className="indent-2 text-sm">{t(bulkProductAddingInfo)}</p>
        )}
      </div>
    </>
  );
};

export default BulkProductAdding;
