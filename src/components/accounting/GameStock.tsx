import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbTransferIn } from "react-icons/tb";
import { toast } from "react-toastify";
import { useFilterContext } from "../../context/Filter.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
  GAMEEXPENSETYPE,
  StockHistoryStatusEnum,
  commonDateOptions,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountProducts } from "../../utils/api/account/product";
import {
  useAccountStockMutations,
  useGetFilteredStocks,
  useStockTransferMutation,
} from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStockLocations } from "../../utils/api/location";
import { useGetCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { formatPrice } from "../../utils/formatPrice";
import { getItem } from "../../utils/getItem";
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

const GameStock = () => {
  const { t } = useTranslation();
  const {
    showGameStockFilters,
    setShowGameStockFilters,
    filterGameStockPanelFormElements,
    setFilterGameStockPanelFormElements,
    showGameStockPrices,
    setShowGameStockPrices,
    isGameStockEnableEdit,
    setIsGameStockEnableEdit,
  } = useFilterContext();
  const stocks = useGetFilteredStocks(
    filterGameStockPanelFormElements.after,
    filterGameStockPanelFormElements.location
  );
  const { user } = useUserContext();
  const products = useGetAccountProducts();
  const items = useGetMenuItems();
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  const locations = useGetStockLocations();
  const disabledConditions = useGetDisabledConditions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { mutate: stockTransfer } = useStockTransferMutation();
  const categories = useGetCategories();
  const onlineCategories = categories?.filter((cat) => cat?.isOnlineOrder);
  const [rowToAction, setRowToAction] = useState<any>();
  const [isStockTransferModalOpen, setIsStockTransferModalOpen] =
    useState(false);
  const [stockTransferForm, setStockTransferForm] = useState({
    location: "",
    quantity: 0,
  });
  const [form, setForm] = useState({
    product: "",
    location: "",
    quantity: 0,
    status: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const { createAccountStock, deleteAccountStock, updateAccountStock } =
    useAccountStockMutations();

  const gameStockPageDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.STOCK_GAMESTOCK, disabledConditions);
  }, [disabledConditions]);

  const filteredStocks = useMemo(() => {
    return stocks
      ?.filter((stock) =>
        getItem(stock?.product, products)?.expenseType?.includes(
          GAMEEXPENSETYPE
        )
      )
      ?.filter((stock) => {
        const rowProduct = getItem(stock?.product, products);
        return (
          passesFilter(
            filterGameStockPanelFormElements?.location,
            stock?.location
          ) &&
          (!filterGameStockPanelFormElements?.product?.length ||
            filterGameStockPanelFormElements?.product?.some(
              (panelProduct: string) =>
                passesFilter(panelProduct, stock?.product)
            )) &&
          (!filterGameStockPanelFormElements?.itemCategory?.length ||
            (rowProduct?.matchedMenuItem &&
              filterGameStockPanelFormElements?.itemCategory?.includes(
                getItem(rowProduct?.matchedMenuItem, items)?.category
              ))) &&
          (!filterGameStockPanelFormElements?.vendor ||
            rowProduct?.vendor?.includes(
              filterGameStockPanelFormElements?.vendor
            )) &&
          (!filterGameStockPanelFormElements?.brand ||
            rowProduct?.brand?.includes(
              filterGameStockPanelFormElements?.brand
            ))
        );
      });
  }, [stocks, filterGameStockPanelFormElements, products]);

  const rows = useMemo(() => {
    const processedRows = filteredStocks?.reduce((acc: any, stock) => {
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
          prdct: productName,
          sku: rowItem?.sku ?? "",
          barcode: rowItem?.barcode ?? "",
          unitPrice,
          menuPrice: rowItem?.price ?? "",
          onlineMenuPrice: rowItem?.onlinePrice ?? "",
          totalGroupPrice: 0,
          totalQuantity: 0,
          collapsible: {
            collapsibleColumns: [
              { key: t("Location"), isSortable: true },
              { key: t("Quantity"), isSortable: true },
              isGameStockEnableEdit
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

    return Object.values(processedRows || {});
  }, [filteredStocks, products, items, locations, t, isGameStockEnableEdit]);

  const generalTotalExpense = useMemo(() => {
    return (rows?.reduce((acc: number, stock: any) => {
      const expense = parseFloat(stock?.totalGroupPrice?.toFixed(1) || "0");
      return acc + expense;
    }, 0) || 0) as number;
  }, [rows]);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          ?.filter((product) => product?.expenseType?.includes(GAMEEXPENSETYPE))
          ?.map((product) => ({
            value: product._id,
            label: product.name,
          })),
        placeholder: t("Product"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "quantity",
        label: t("Quantity"),
        placeholder: t("Quantity"),
        required: true,
      },
    ],
    [products, locations, t]
  );

  const stockTransferInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: (rowToAction
          ? locations.filter(
              (location) => location._id !== rowToAction?.stockLocation
            )
          : locations
        )?.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.NUMBER,
        formKey: "quantity",
        label: t("Quantity"),
        placeholder: t("Quantity"),
        required: true,
      },
    ],
    [locations, rowToAction, t]
  );

  const formKeys = useMemo(
    () => [
      { key: "product", type: FormKeyTypeEnum.STRING },
      { key: "location", type: FormKeyTypeEnum.STRING },
      { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    ],
    []
  );

  const stockTransferFormKeys = useMemo(
    () => [
      { key: "location", type: FormKeyTypeEnum.STRING },
      { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    ],
    []
  );

  const columns = useMemo(() => {
    const cols = [
      { key: t("Product"), isSortable: true, correspondingKey: "prdct" },
      { key: t("Sku"), isSortable: true, correspondingKey: "sku" },
      { key: t("Barcode"), isSortable: true, correspondingKey: "barcode" },
      {
        key: t("Quantity"),
        isSortable: true,
        correspondingKey: "totalQuantity",
      },
      {
        key: t("Unit Price"),
        isSortable: true,
        correspondingKey: "unitPrice",
      },
      { key: t("Menu Price"), isSortable: true, correspondingKey: "menuPrice" },
      {
        key: t("Online Price"),
        isSortable: true,
        correspondingKey: "menuPrice",
      },
      { key: t("Total Price"), isSortable: true },
    ];

    if (
      !showGameStockPrices ||
      gameStockPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.SHOWPRICES &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      )
    ) {
      const splicedColumns = ["Unit Price", "Total Price"];
      return cols.filter((column) => !splicedColumns.includes(column.key));
    }
    return cols;
  }, [t, gameStockPageDisabledCondition, user, showGameStockPrices]);

  const rowKeys = useMemo(() => {
    const keys = [
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
        key: "onlineMenuPrice",
        node: (row: any) => {
          if (row?.onlineMenuPrice) {
            return <div>{formatPrice(row?.onlineMenuPrice)} ₺</div>;
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
      !showGameStockPrices ||
      gameStockPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.SHOWPRICES &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      )
    ) {
      const splicedRowKeys = [
        "unitPrice",
        "totalGroupPrice",
      ];
      return keys.filter((key) => !splicedRowKeys.includes(key.key));
    }
    return keys;
  }, [gameStockPageDisabledCondition, user, showGameStockPrices]);

  const addButton = useMemo(
    () => ({
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
      isDisabled: gameStockPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ),
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createAccountStock,
      gameStockPageDisabledCondition,
      user,
    ]
  );

  const collapsibleActions = useMemo(
    () => [
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
        isDisabled: gameStockPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
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
        isDisabled: gameStockPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        name: t("Transfer"),
        icon: <TbTransferIn />,
        className: "text-green-500 cursor-pointer text-xl",
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
        isDisabled: gameStockPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.TRANSFER &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteAccountStock,
      products,
      gameStockPageDisabledCondition,
      user,
      isEditModalOpen,
      inputs,
      formKeys,
      updateAccountStock,
      form,
      isStockTransferModalOpen,
      stockTransferInputs,
      stockTransferFormKeys,
      stockTransferForm,
      stockTransfer,
    ]
  );

  const filters = useMemo(
    () => [
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
        isDisabled: gameStockPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOWTOTAL &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        label: t("Show Prices"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showGameStockPrices}
            onChange={() => {
              setShowGameStockPrices(!showGameStockPrices);
            }}
          />
        ),
        isDisabled: gameStockPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOWPRICES &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        label: t("Enable Edit"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={isGameStockEnableEdit}
            onChange={() => {
              setIsGameStockEnableEdit(!isGameStockEnableEdit);
            }}
          />
        ),
        isDisabled: gameStockPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.ENABLEEDIT &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showGameStockFilters}
            onChange={() => {
              setShowGameStockFilters(!showGameStockFilters);
            }}
          />
        ),
      },
    ],
    [
      t,
      generalTotalExpense,
      gameStockPageDisabledCondition,
      user,
      showGameStockPrices,
      setShowGameStockPrices,
      isGameStockEnableEdit,
      setIsGameStockEnableEdit,
      showGameStockFilters,
      setShowGameStockFilters,
    ]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          ?.filter((product) => product?.expenseType?.includes(GAMEEXPENSETYPE))
          ?.map((product) => ({
            value: product._id,
            label: product.name,
          })),
        placeholder: t("Product"),
        required: true,
        isMultiple: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "vendor",
        label: t("Vendor"),
        options: vendors.map((vendor) => ({
          value: vendor._id,
          label: vendor.name,
        })),
        placeholder: t("Vendor"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "brand",
        label: t("Brand"),
        options: brands.map((brand) => ({
          value: brand._id,
          label: brand.name,
        })),
        placeholder: t("Brand"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "location",
        label: t("Location"),
        options: locations.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        placeholder: t("Location"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "itemCategory",
        label: t("Item Category"),
        options: onlineCategories.map((input) => ({
          value: input._id,
          label: input.name,
        })),
        isMultiple: true,
        placeholder: t("Item Category"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "date",
        label: t("Date"),
        options: commonDateOptions?.map((option) => ({
          value: option.value,
          label: t(option.label),
        })),
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
            setFilterGameStockPanelFormElements({
              ...filterGameStockPanelFormElements,
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
    ],
    [
      products,
      vendors,
      brands,
      locations,
      t,
      filterGameStockPanelFormElements,
      setFilterGameStockPanelFormElements,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showGameStockFilters,
      inputs: filterPanelInputs,
      formElements: filterGameStockPanelFormElements,
      setFormElements: setFilterGameStockPanelFormElements,
      closeFilters: () => setShowGameStockFilters(false),
    }),
    [
      showGameStockFilters,
      filterPanelInputs,
      filterGameStockPanelFormElements,
      setFilterGameStockPanelFormElements,
      setShowGameStockFilters,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          collapsibleActions={isGameStockEnableEdit ? collapsibleActions : []}
          filters={filters}
          columns={columns}
          rows={rows}
          title={t("Game Stocks")}
          addButton={addButton}
          filterPanel={filterPanel}
          isActionsActive={isGameStockEnableEdit}
          isCollapsible={true}
          isToolTipEnabled={false}
          isExcel={
            user &&
            !gameStockPageDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          excelFileName="OyunStok.xlsx"
        />
      </div>
    </>
  );
};

export default GameStock;
