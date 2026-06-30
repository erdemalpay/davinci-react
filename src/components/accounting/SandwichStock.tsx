import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { TbTransferIn } from "react-icons/tb";
import { toast } from "react-toastify";
import { useFilterContext } from "../../context/Filter.context";
import { useUserContext } from "../../context/User.context";
import { useStockTableMode } from "../../hooks/useStockTableMode";
import {
  ActionEnum,
  DateRangeKey,
  DisabledConditionEnum,
  SANDWICHEXPENSETYPE,
  StockHistoryStatusEnum,
  commonDateOptions,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useAccountProductMutations, useGetAccountProducts } from "../../utils/api/account/product";
import Loading from "../common/Loading";
import {
  useAccountStockMutations,
  useGetFilteredStocks,
  useStockTransferMutation,
} from "../../utils/api/account/stock";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { dateRanges } from "../../utils/api/dateRanges";
import { useGetStoreLocations } from "../../utils/api/location";
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

const SandwichStock = () => {
  const { t } = useTranslation();
  const {
    showSandwichStockFilters,
    setShowSandwichStockFilters,
    filterSandwichStockPanelFormElements,
    setFilterSandwichStockPanelFormElements,
    showSandwichStockPrices,
    setShowSandwichStockPrices,
    isSandwichStockEnableEdit,
    setIsSandwichStockEnableEdit,
    showHiddenSandwichStocks,
    setShowHiddenSandwichStocks,
  } = useFilterContext();
  const stocks = useGetFilteredStocks(
    filterSandwichStockPanelFormElements.after,
    filterSandwichStockPanelFormElements.location
  );
  const { user } = useUserContext();
  const products = useGetAccountProducts();
  const items = useGetMenuItems();
  const vendors = useGetAccountVendors();
  const brands = useGetAccountBrands();
  const locations = useGetStoreLocations();
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
  const { updateAccountProductAsync } = useAccountProductMutations();
  const [pendingHideChanges, setPendingHideChanges] = useState<
    Record<string, boolean>
  >({});
  const [isSavingHideChanges, setIsSavingHideChanges] = useState(false);

  const sandwichStockPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.STOCK_SANDWICHSTOCK,
      disabledConditions
    );
  }, [disabledConditions]);

  const filteredStocks = useMemo(() => {
    return stocks
      ?.filter((stock) =>
        getItem(stock?.product, products)?.expenseType?.includes(
          SANDWICHEXPENSETYPE
        )
      )
      ?.filter((stock) => {
        const rowProduct = getItem(stock?.product, products);
        const isHidden =
          stock?.product in pendingHideChanges
            ? pendingHideChanges[stock?.product]
            : (rowProduct?.isHidden ?? false);
        if (!showHiddenSandwichStocks && isHidden) return false;
        return (
          passesFilter(
            filterSandwichStockPanelFormElements?.location,
            stock?.location
          ) &&
          (!filterSandwichStockPanelFormElements?.product?.length ||
            filterSandwichStockPanelFormElements?.product?.some(
              (panelProduct: string) =>
                passesFilter(panelProduct, stock?.product)
            )) &&
          (!filterSandwichStockPanelFormElements?.itemCategory?.length ||
            (rowProduct?.matchedMenuItem &&
              filterSandwichStockPanelFormElements?.itemCategory?.includes(
                getItem(rowProduct?.matchedMenuItem, items)?.category
              ))) &&
          (!filterSandwichStockPanelFormElements?.vendor ||
            rowProduct?.vendor?.includes(
              filterSandwichStockPanelFormElements?.vendor
            )) &&
          (!filterSandwichStockPanelFormElements?.brand ||
            rowProduct?.brand?.includes(
              filterSandwichStockPanelFormElements?.brand
            ))
        );
      });
  }, [stocks, filterSandwichStockPanelFormElements, products, items, showHiddenSandwichStocks, pendingHideChanges]);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          ?.filter((product) =>
            product?.expenseType?.includes(SANDWICHEXPENSETYPE)
          )
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
      !showSandwichStockPrices ||
      sandwichStockPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.SHOWPRICES &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      )
    ) {
      const splicedColumns = [t("Unit Price"), t("Total Price")];
      const filtered = cols.filter(
        (column) => !splicedColumns.includes(column.key)
      );
      if (isSandwichStockEnableEdit) {
        filtered.push({ key: t("Hide"), isSortable: false });
      }
      return filtered;
    }
    if (isSandwichStockEnableEdit) {
      cols.push({ key: t("Hide"), isSortable: false });
    }
    return cols;
  }, [t, sandwichStockPageDisabledCondition, user, showSandwichStockPrices, isSandwichStockEnableEdit]);

  const {
    rows,
    columns: tableColumns,
    generalTotalExpense,
    getTableModeProps,
  } = useStockTableMode({
    filteredStocks,
    products,
    items,
    locations,
    locationFilter: filterSandwichStockPanelFormElements?.location,
    isEnableEdit: isSandwichStockEnableEdit,
    columns,
    sortByTotalQuantity: true,
    requireLocationName: true,
  });

  const rowKeys = useMemo(() => {
    const keys = [
      { key: "prdct" },
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

    const hideCheckboxEntry = isSandwichStockEnableEdit
      ? [
          {
            key: "isHiddenCheckbox",
            node: (row: any) => {
              const productId = row?.product;
              const isHidden =
                productId in pendingHideChanges
                  ? pendingHideChanges[productId]
                  : (getItem(productId, products)?.isHidden ?? false);
              return (
                <input
                  type="checkbox"
                  checked={isHidden}
                  onChange={() => {
                    const nextHidden = !isHidden;
                    setPendingHideChanges((prev) => ({
                      ...prev,
                      [productId]: nextHidden,
                    }));
                    toast.success(
                      nextHidden ? t("Item hidden") : t("Item visible")
                    );
                  }}
                  className="w-4 h-4 cursor-pointer"
                />
              );
            },
          },
        ]
      : [];

    if (
      !showSandwichStockPrices ||
      sandwichStockPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.SHOWPRICES &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      )
    ) {
      const splicedRowKeys = ["unitPrice", "totalGroupPrice"];
      return [
        ...keys.filter((key) => !splicedRowKeys.includes(key.key)),
        ...hideCheckboxEntry,
      ];
    }
    return [...keys, ...hideCheckboxEntry];
  }, [sandwichStockPageDisabledCondition, user, showSandwichStockPrices, isSandwichStockEnableEdit, pendingHideChanges, products, t]);

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
      isDisabled: sandwichStockPageDisabledCondition?.actions?.some(
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
      sandwichStockPageDisabledCondition,
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
        isDisabled: sandwichStockPageDisabledCondition?.actions?.some(
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
        isDisabled: sandwichStockPageDisabledCondition?.actions?.some(
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
        isDisabled: sandwichStockPageDisabledCondition?.actions?.some(
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
      sandwichStockPageDisabledCondition,
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
        isDisabled: sandwichStockPageDisabledCondition?.actions?.some(
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
            checked={showSandwichStockPrices}
            onChange={() => {
              setShowSandwichStockPrices(!showSandwichStockPrices);
            }}
          />
        ),
        isDisabled: sandwichStockPageDisabledCondition?.actions?.some(
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
            checked={isSandwichStockEnableEdit}
            onChange={async () => {
              if (isSandwichStockEnableEdit && Object.keys(pendingHideChanges).length > 0) {
                setIsSavingHideChanges(true);
                await Promise.all(
                  Object.entries(pendingHideChanges).map(([productId, isHidden]) =>
                    updateAccountProductAsync({ id: productId, updates: { isHidden } })
                  )
                );
                setPendingHideChanges({});
                setIsSavingHideChanges(false);
              }
              setIsSandwichStockEnableEdit(!isSandwichStockEnableEdit);
            }}
          />
        ),
        isDisabled: sandwichStockPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.ENABLEEDIT &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ),
      },
      {
        label: t("Show Hidden Items"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showHiddenSandwichStocks}
            onChange={() => {
              setShowHiddenSandwichStocks(!showHiddenSandwichStocks);
            }}
          />
        ),
      },
      {
        label: t("Show Filters"),
        isUpperSide: true,
        node: (
          <SwitchButton
            checked={showSandwichStockFilters}
            onChange={() => {
              setShowSandwichStockFilters(!showSandwichStockFilters);
            }}
          />
        ),
      },
    ],
    [
      t,
      generalTotalExpense,
      sandwichStockPageDisabledCondition,
      user,
      showSandwichStockPrices,
      setShowSandwichStockPrices,
      isSandwichStockEnableEdit,
      setIsSandwichStockEnableEdit,
      showSandwichStockFilters,
      setShowSandwichStockFilters,
      showHiddenSandwichStocks,
      setShowHiddenSandwichStocks,
      pendingHideChanges,
      updateAccountProductAsync,
    ]
  );

  const filterPanelInputs = useMemo(
    () => [
      {
        type: InputTypes.SELECT,
        formKey: "product",
        label: t("Product"),
        options: products
          ?.filter((product) =>
            product?.expenseType?.includes(SANDWICHEXPENSETYPE)
          )
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
            setFilterSandwichStockPanelFormElements({
              ...filterSandwichStockPanelFormElements,
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
      filterSandwichStockPanelFormElements,
      setFilterSandwichStockPanelFormElements,
    ]
  );

  const filterPanel = useMemo(
    () => ({
      isFilterPanelActive: showSandwichStockFilters,
      inputs: filterPanelInputs,
      formElements: filterSandwichStockPanelFormElements,
      setFormElements: setFilterSandwichStockPanelFormElements,
      closeFilters: () => setShowSandwichStockFilters(false),
    }),
    [
      showSandwichStockFilters,
      filterPanelInputs,
      filterSandwichStockPanelFormElements,
      setFilterSandwichStockPanelFormElements,
      setShowSandwichStockFilters,
    ]
  );

  return (
    <>
      {isSavingHideChanges && <Loading />}
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          {...getTableModeProps(collapsibleActions)}
          filters={filters}
          columns={tableColumns}
          rows={rows}
          title={t("Sandwich Stocks")}
          addButton={addButton}
          filterPanel={filterPanel}
          isToolTipEnabled={false}
          isExcel={
            user &&
            !sandwichStockPageDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.EXCEL &&
                user?.role?._id &&
                !ac?.permissionsRoles?.includes(user?.role?._id)
            )
          }
          excelFileName="SandwichStok.xlsx"
        />
      </div>
    </>
  );
};

export default SandwichStock;
