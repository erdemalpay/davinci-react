import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbTransferIn } from "react-icons/tb";
import { toast } from "react-toastify";
import { useFilterContext } from "../../context/Filter.context";
import { useUserContext } from "../../context/User.context";
import {
  DateRangeKey,
  RoleEnum,
  StockHistoryStatusEnum,
  commonDateOptions,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetFilteredStocks,
  useStockTransferMutation,
} from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { formatPrice } from "../../utils/formatPrice";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  ProductInput,
  QuantityInput,
  StockLocationInput,
  VendorInput,
} from "../../utils/panelInputs";
import { passesFilter } from "../../utils/passesFilter";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  GenericInputType,
  InputTypes,
} from "../panelComponents/shared/types";

const Stock = () => {
  const { t } = useTranslation();
  const {
    showStockFilters,
    setShowStockFilters,
    filterStockPanelFormElements,
    setFilterStockPanelFormElements,
    isStockEnableEdit,
    setIsStockEnableEdit,
    showStockPrices,
    setShowStockPrices,
  } = useFilterContext();
  const stocks = useGetFilteredStocks(
    filterStockPanelFormElements.after,
    filterStockPanelFormElements.location
  );
  const { user } = useUserContext();
  const products = useGetAccountProducts();
  const items = useGetMenuItems();
  const locations = useGetStockLocations();
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const expenseTypes = useGetAccountExpenseTypes();
  const [isStockTransferModalOpen, setIsStockTransferModalOpen] =
    useState(false);

  const [rowToAction, setRowToAction] = useState<any>();
  const isDisabledCondition = user
    ? ![RoleEnum.MANAGER, RoleEnum.OPERATIONSASISTANT].includes(user?.role?._id)
    : true;
  const { mutate: stockTransfer } = useStockTransferMutation();
  const [generalTotalExpense, setGeneralTotalExpense] = useState(() => {
    return stocks?.reduce((acc, stock) => {
      const expense = parseFloat(
        (
          (getItem(stock?.product, products)?.unitPrice ?? 0) * stock?.quantity
        )?.toFixed(1)
      );
      return acc + expense;
    }, 0);
  });
  const [form, setForm] = useState({
    product: "",
    location: "",
    quantity: 0,
    status: "",
    expenseType: "",
    vendor: "",
    brand: "",
  });
  const [stockTransferForm, setStockTransferForm] = useState({
    location: "",
    quantity: 0,
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rows, setRows] = useState(() => {
    const groupedProducts = stocks?.reduce((acc: any, stock) => {
      const rowProduct = getItem(stock?.product, products);
      const rowItem = getItem(rowProduct?.matchedMenuItem, items);
      const productName = rowProduct?.name;
      const locationName = getItem(stock?.location, locations)?.name;
      const unitPrice = rowProduct?.unitPrice ?? 0;
      const quantity = stock?.quantity;
      const totalPrice = parseFloat((unitPrice * quantity)?.toFixed(1));
      if (!productName) {
        return acc;
      }
      if (!acc[productName]) {
        acc[productName] = {
          ...stock,
          sku: rowItem?.sku ?? "",
          barcode: rowItem?.barcode ?? "",
          prdct: productName,
          unitPrice,
          totalGroupPrice: 0,
          menuPrice: rowItem?.price ?? "",
          totalQuantity: 0,
          collapsible: {
            collapsibleColumns: [
              { key: t("Location"), isSortable: true },
              { key: t("Quantity"), isSortable: true },
              isStockEnableEdit
                ? { key: t("Actions"), isSortable: false }
                : undefined,
            ].filter(Boolean),
            collapsibleRowKeys: [{ key: "location" }, { key: "quantity" }],
            collapsibleRows: [],
          },
        };
      }
      acc[productName].totalGroupPrice += totalPrice;
      acc[productName].totalQuantity += quantity;

      acc[productName].collapsible.collapsibleRows.push({
        stockId: stock?._id,
        stockProduct: stock?.product,
        stockLocation: stock?.location,
        stockQuantity: stock?.quantity,
        stockUnitPrice: rowProduct?.unitPrice ?? 0,
        location: locationName,
        quantity: quantity,
        totalPrice: totalPrice,
      });

      return acc;
    }, {});
    return Object.values(groupedProducts);
  });
  const { createAccountStock, deleteAccountStock, updateAccountStock } =
    useAccountStockMutations();
  const inputs = [
    ProductInput({
      products: products,
      required: true,
    }),
    StockLocationInput({ locations: locations }),
    QuantityInput(),
  ];
  const stockTransferInputs = [
    StockLocationInput({
      locations: rowToAction
        ? locations.filter(
            (location) => location?._id !== rowToAction?.stockLocation
          )
        : locations,
    }),
    QuantityInput(),
  ];
  const formKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const stockTransferFormKeys = [
    { key: "location", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
  ];
  const columns = [
    { key: t("Product"), isSortable: true, correspondingKey: "prdct" },
    { key: t("Sku"), isSortable: true, correspondingKey: "sku" },
    { key: t("Barcode"), isSortable: true, correspondingKey: "barcode" },
    { key: t("Quantity"), isSortable: true, correspondingKey: "totalQuantity" },
    { key: t("Unit Price"), isSortable: true },
    { key: t("Menu Price"), isSortable: true, correspondingKey: "menuPrice" },
    { key: t("Total Price"), isSortable: true },
  ];

  const rowKeys = [
    { key: "prdct" },
    { key: "sku" },
    { key: "barcode" },
    { key: "totalQuantity" },
    {
      key: "unitPrice",
      node: (row: any) => <div>{formatPrice(row?.unitPrice)} ₺</div>,
    },
    {
      key: "menuPrice",
      node: (row: any) => {
        if (row?.menuPrice) {
          return <div>{formatPrice(row?.menuPrice)} ₺</div>;
        }
        return <></>;
      },
    },
    {
      key: "totalGroupPrice",
      node: (row: any) => <div>{formatPrice(row?.totalGroupPrice)} ₺</div>,
    },
  ];
  if (
    (user && ![RoleEnum.MANAGER].includes(user?.role?._id)) ||
    !showStockPrices
  ) {
    const splicedColumns = ["Unit Price", "Menu Price", "Total Price"];
    const splicedRowKeys = ["unitPrice", "menuPrice", "totalGroupPrice"];
    splicedColumns.forEach((item) => {
      columns.splice(
        columns.findIndex((column) => column.key === item),
        1
      );
    });
    splicedRowKeys.forEach((item) => {
      rowKeys.splice(
        rowKeys.findIndex((rowKey) => rowKey.key === item),
        1
      );
    });
  }
  const addButton = {
    name: t("Add Stock"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        setForm={setForm}
        submitItem={createAccountStock as any}
        topClassName="flex flex-col gap-2 "
        generalClassName="overflow-visible"
        constantValues={{ status: StockHistoryStatusEnum.STOCKENTRY }}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
  };
  const collapsibleActions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteAccountStock(rowToAction?.stockId);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Stock")}
          text={`${
            getItem(rowToAction?.product, products)?.name
          } stock will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className:
        user?.role?._id === RoleEnum.MANAGER
          ? "text-blue-500 cursor-pointer text-xl "
          : "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      setForm: setForm,
      onClick: (row: any) => {
        setForm({
          ...form,
          product: row?.stockProduct,
        });
      },
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateAccountStock as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          generalClassName="overflow-visible"
          itemToEdit={{
            id: rowToAction?.stockId,
            updates: {
              product: rowToAction?.stockProduct,
              location: rowToAction?.stockLocation,
              quantity: rowToAction?.stockQuantity,
              unitPrice: getItem(rowToAction?.stockProduct, products)
                ?.unitPrice,
            },
          }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
    {
      name: t("Transfer"),
      icon: <TbTransferIn />,
      className: "text-green-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isStockTransferModalOpen}
          close={() => setIsStockTransferModalOpen(false)}
          inputs={stockTransferInputs as GenericInputType[]}
          setForm={setStockTransferForm}
          submitFunction={() => {
            if (
              stockTransferForm.location === "" ||
              stockTransferForm.quantity === 0
            ) {
              toast.error(t("Please fill all the fields"));
              return;
            }
            stockTransfer({
              currentStockLocation: rowToAction?.stockLocation,
              transferredStockLocation: stockTransferForm.location,
              product: rowToAction?.product,
              quantity: stockTransferForm.quantity,
            });
          }}
          formKeys={stockTransferFormKeys}
          submitItem={stockTransfer as any}
          topClassName="flex flex-col gap-2 "
        />
      ) : null,
      isModalOpen: isStockTransferModalOpen,
      setIsModal: setIsStockTransferModalOpen,
      isPath: false,
      isDisabled: isDisabledCondition,
    },
  ];
  const filters = [
    {
      label: t("Total") + " :",
      isUpperSide: false,
      node: (
        <div className="flex flex-row gap-2">
          <p>
            {new Intl.NumberFormat("en-US", {
              style: "decimal",
              minimumFractionDigits: 3,
              maximumFractionDigits: 3,
            })?.format(generalTotalExpense)}{" "}
            ₺
          </p>
        </div>
      ),
      isDisabled: isDisabledCondition,
    },
    {
      label: t("Show Prices"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showStockPrices}
          onChange={() => {
            setShowStockPrices(!showStockPrices);
          }}
        />
      ),
      isDisabled: isDisabledCondition,
    },
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={isStockEnableEdit}
          onChange={() => {
            setIsStockEnableEdit(!isStockEnableEdit);
          }}
        />
      ),
      isDisabled: isDisabledCondition,
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showStockFilters}
          onChange={() => {
            setShowStockFilters(!showStockFilters);
          }}
        />
      ),
    },
  ];

  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "expenseType",
      label: t("Expense Type"),
      options: expenseTypes?.map((expenseType) => {
        return {
          value: expenseType._id,
          label: expenseType.name,
        };
      }),
      placeholder: t("Expense Type"),
      additionalOnChange: ({
        value,
        label,
      }: {
        value: string;
        label: string;
      }) => {
        if (value) {
          setFilterStockPanelFormElements({
            ...filterStockPanelFormElements,
            expenseType: value,
            product: [],
          });
        }
      }, //invalidate keys did not work that is why i did it like this
      required: true,
    },
    ProductInput({
      products: !filterStockPanelFormElements?.expenseType
        ? products
        : products?.filter((product) =>
            product?.expenseType?.includes(
              filterStockPanelFormElements.expenseType
            )
          ),
      required: true,
      isMultiple: true,
    }),
    VendorInput({ vendors: vendors, required: true }),
    BrandInput({ brands: brands, required: true }),
    StockLocationInput({ locations: locations }),
    {
      type: InputTypes.SELECT,
      formKey: "date",
      label: t("Date"),
      options: commonDateOptions?.map((option) => {
        return {
          value: option.value,
          label: t(option.label),
        };
      }),
      placeholder: t("Date"),
      required: true,
      additionalOnChange: ({
        value,
        label,
      }: {
        value: string;
        label: string;
      }) => {
        const dateRange = dateRanges[value as DateRangeKey];
        if (dateRange) {
          setFilterStockPanelFormElements({
            ...filterStockPanelFormElements,
            ...dateRange(),
          });
        }
      },
    },
    {
      type: InputTypes.DATE,
      formKey: "after",
      label: t("Start Date"),
      placeholder: t("Start Date"),
      required: true,
      isDatePicker: true,
      invalidateKeys: [{ key: "date", defaultValue: "" }],
      isOnClearActive: false,
    },
  ];
  const filterPanel = {
    isFilterPanelActive: showStockFilters,
    inputs: filterPanelInputs,
    formElements: filterStockPanelFormElements,
    setFormElements: setFilterStockPanelFormElements,
    closeFilters: () => setShowStockFilters(false),
  };
  useEffect(() => {
    const processedRows = stocks
      ?.filter((stock) => {
        const rowProduct = getItem(stock?.product, products);
        return (
          passesFilter(
            filterStockPanelFormElements?.location,
            stock?.location
          ) &&
          (!filterStockPanelFormElements?.expenseType ||
            rowProduct?.expenseType.includes(
              filterStockPanelFormElements?.expenseType
            )) &&
          (!filterStockPanelFormElements?.vendor ||
            rowProduct?.vendor?.includes(
              filterStockPanelFormElements?.vendor
            )) &&
          (!filterStockPanelFormElements?.brand ||
            rowProduct?.brand?.includes(filterStockPanelFormElements?.brand)) &&
          (!filterStockPanelFormElements?.product?.length ||
            filterStockPanelFormElements?.product?.some(
              (panelProduct: string) =>
                passesFilter(panelProduct, stock?.product)
            ))
        );
      })
      ?.reduce((acc: any, stock) => {
        const rowProduct = getItem(stock?.product, products);
        const rowItem = getItem(rowProduct?.matchedMenuItem, items);
        const productName = rowProduct?.name;
        const locationName = getItem(stock?.location, locations)?.name;
        const unitPrice = rowProduct?.unitPrice ?? 0;
        const quantity = stock?.quantity;
        const totalPrice = parseFloat((unitPrice * quantity)?.toFixed(1));
        if (!productName) {
          return acc;
        }
        if (!acc[productName]) {
          acc[productName] = {
            ...stock,
            sku: rowItem?.sku ?? "",
            barcode: rowItem?.barcode ?? "",
            prdct: productName,
            unitPrice,
            menuPrice: rowItem?.price ?? "",
            totalGroupPrice: 0,
            totalQuantity: 0,
            collapsible: {
              collapsibleColumns: [
                { key: t("Location"), isSortable: true },
                { key: t("Quantity"), isSortable: true },
                isStockEnableEdit
                  ? { key: t("Actions"), isSortable: false }
                  : undefined,
              ].filter(Boolean),
              collapsibleRowKeys: [{ key: "location" }, { key: "quantity" }],
              collapsibleRows: [],
            },
          };
        }
        acc[productName].totalGroupPrice += totalPrice;
        acc[productName].totalQuantity += quantity;
        acc[productName].collapsible.collapsibleRows.push({
          stockId: stock?._id,
          stockProduct: stock?.product,
          stockLocation: stock?.location,
          stockQuantity: stock?.quantity,
          stockUnitPrice: rowProduct?.unitPrice ?? 0,
          location: locationName,
          quantity: quantity,
          totalPrice: totalPrice,
        });

        return acc;
      }, {});

    const newGeneralTotalExpense = Object.values(processedRows)?.reduce(
      (acc: any, stock: any) => {
        const expense = parseFloat(stock?.totalGroupPrice.toFixed(1));
        return acc + expense;
      },
      0
    );
    setRows(Object.values(processedRows));
    setGeneralTotalExpense(newGeneralTotalExpense as number);

    setTableKey((prev) => prev + 1);
  }, [
    stocks,
    // filterStockPanelFormElements,
    products,
    locations,
    user,
    isStockEnableEdit,
    items,
    expenseTypes,
    vendors,
    brands,
  ]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          collapsibleActions={isStockEnableEdit ? collapsibleActions : []}
          filters={filters}
          columns={columns}
          rows={rows}
          title={t("Product Stocks")}
          addButton={addButton}
          filterPanel={filterPanel}
          isActionsActive={false}
          isCollapsible={true}
          isToolTipEnabled={false}
          isExcel={user && [RoleEnum.MANAGER].includes(user?.role?._id)}
          excelFileName={t("GenelStok.xlsx")}
        />
      </div>
    </>
  );
};

export default Stock;
