import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useFilterContext } from "../../context/Filter.context";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { ItemGroup } from "../../pages/Menu";
import {
  AccountProduct,
  MenuItem,
  MenuPopular,
  RoleEnum,
  TURKISHLIRA,
} from "../../types";
import { useGetAccountBrands } from "../../utils/api/account/brand";
import { useGetAccountExpenseTypes } from "../../utils/api/account/expenseType";
import {
  useAccountProductMutations,
  useGetAllAccountProducts,
} from "../../utils/api/account/product";
import { useGetIkasCategories } from "../../utils/api/account/productCategories";
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import { useGetStoreLocations } from "../../utils/api/location";
import {
  useCreateMultipleIkasProductMutation,
  useGetAllMenuItems,
  useMenuItemMutations,
  useUpdateBulkItemsMutation,
  useUpdateItemsOrderMutation,
  useUpdateItemsSlugsMutation,
} from "../../utils/api/menu/menu-item";
import { usePopularMutations } from "../../utils/api/menu/popular";
import { formatPrice } from "../../utils/formatPrice";
import { getItem } from "../../utils/getItem";
import {
  BrandInput,
  ExpenseTypeInput,
  VendorInput,
} from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import ButtonFilter from "../panelComponents/common/ButtonFilter";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {
  singleItemGroup: ItemGroup;
  popularItems: MenuPopular[];
};

const MenuItemTable = ({ singleItemGroup, popularItems }: Props) => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const { i18n } = useTranslation();
  const { selectedRows, setSelectedRows, setIsSelectionActive } =
    useGeneralContext();
  const products = useGetAllAccountProducts();
  const {
    setSelectedMenuItem,
    isShownInMenu,
    setIsShownInMenu,
    isMenuShowIkasCategories,
    setIsMenuShowIkasCategories,
    isMenuLocationEdit,
    setIsMenuLocationEdit,
  } = useGeneralContext();
  const { deleteItem, updateItem, createItem } = useMenuItemMutations();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const locations = useGetStoreLocations();
  const items = useGetAllMenuItems();
  const { showDeletedItems, setShowDeletedItems } = useFilterContext();
  const { mutate: updateBulkItems } = useUpdateBulkItemsMutation();
  const { mutate: updateItemsSlugs } = useUpdateItemsSlugsMutation();
  const [isEditSelectionCompeted, setIsEditSelectionCompeted] = useState(false);
  const productCategories = useGetIkasCategories();
  const vendors = useGetAccountVendors();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProductAddModalOpen, setIsProductAddModalOpen] = useState(false);
  const ikasCategories = useGetIkasCategories();
  const isDisabledCondition = user
    ? ![RoleEnum.MANAGER].includes(user?.role?._id)
    : true;
  const { mutate: updateItemsOrder } = useUpdateItemsOrderMutation();
  const { createPopular, deletePopular } = usePopularMutations();
  const { mutate: createMultipleIkasProduct } =
    useCreateMultipleIkasProductMutation();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const initialBulkInputForm = {
    productCategories: [],
    price: 0,
    bulkEditSelection: [],
  };
  const [bulkInputForm, setBulkInputForm] = useState({
    ...initialBulkInputForm,
  });
  const [isAddCollapsibleOpen, setIsAddCollapsibleOpen] = useState(false);
  const [form, setForm] = useState({
    product: "",
    quantity: 0,
  });
  const [tableKey, setTableKey] = useState(0);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<MenuItem>();
  const { createAccountProduct } = useAccountProductMutations();
  const [productInputForm, setProductInputForm] = useState({
    brand: [],
    vendor: [],
    expenseType: [],
  });
  const usedItems = showDeletedItems
    ? items.filter((item) => item.category === singleItemGroup.category._id)
    : singleItemGroup?.items;
  const allRows = usedItems?.map((item) => {
    return {
      ...item,
      matchedProductName: getItem(item?.matchedProduct, products)?.name,
      collapsible: {
        collapsibleHeader: t("Ingredients"),
        collapsibleColumns: [
          { key: t("Product"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
          ...(!isDisabledCondition
            ? [{ key: t("Cost"), isSortable: true }]
            : []),
          { key: t("Decrement Stock"), isSortable: false },
          {
            key: t("Action"),
            isSortable: false,
            className: "text-center",
          },
        ],
        collapsibleRows: item?.itemProduction?.map((itemProduction) => ({
          product: itemProduction.product,
          name: products?.find(
            (product: AccountProduct) => product._id === itemProduction.product
          )?.name,
          ...(!isDisabledCondition && {
            price: formatPrice(
              (products?.find(
                (product) => product._id === itemProduction.product
              )?.unitPrice ?? 0) * itemProduction.quantity
            ),
          }),
          quantity: itemProduction.quantity,
          ...(!isDisabledCondition && {
            isDecrementStock: itemProduction?.isDecrementStock,
          }),
        })),
        collapsibleRowKeys: [
          { key: "name" },
          { key: "quantity" },
          ...(!isDisabledCondition ? [{ key: "price" }] : []),
          {
            key: "isDecrementStock",
            node: (row: any) => {
              return (
                <div className="ml-6">
                  <CheckSwitch
                    checked={row?.isDecrementStock}
                    onChange={() => {
                      updateItem({
                        id: item?._id,
                        updates: {
                          ...item,
                          itemProduction: item?.itemProduction?.map(
                            (itemProduction) => {
                              if (itemProduction.product === row?.product) {
                                return {
                                  ...itemProduction,
                                  isDecrementStock:
                                    !itemProduction.isDecrementStock,
                                };
                              } else {
                                return itemProduction;
                              }
                            }
                          ),
                        },
                      });
                    }}
                  />
                </div>
              );
            },
          },
        ],
      },
    };
  });
  const [isBulkEditModalOpen, setIsBulkEditModalOpen] = useState(false);
  const [rows, setRows] = useState(allRows);
  function handleLocationUpdate(item: MenuItem, location: number) {
    const newLocations = item?.locations || [];
    // Add if it doesn't exist, remove otherwise
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateItem({
      id: item?._id,
      updates: {
        ...item,
        locations: newLocations,
      },
    });
  }
  const collapsibleInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "product",
      label: t("Product"),
      options: products
        .filter(
          (product) =>
            !rowToAction?.itemProduction?.find(
              (item) => item?.product === product._id
            )
        )
        .map((product) => {
          return {
            value: product._id,
            label: product.name,
          };
        }),
      placeholder: t("Product"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "quantity",
      label: t("Quantity"),
      placeholder: t("Quantity"),
      required: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isDecrementStock",
      label: t("Decrement Stock"),
      placeholder: t("Decrement Stock"),
      required: true,
      isTopFlexRow: true,
    },
  ];
  const collapsibleFormKeys = [
    { key: "product", type: FormKeyTypeEnum.STRING },
    { key: "quantity", type: FormKeyTypeEnum.NUMBER },
    { key: "isDecrementStock", type: FormKeyTypeEnum.BOOLEAN },
  ];
  const bulkEditSelectionsOptions = [
    {
      _id: "productCategories",
      label: t("Ikas Category"),
    },
    {
      _id: "price",
      label: t("Price"),
    },
  ];
  const bulkEditInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "bulkEditSelection",
      label: t("Edit Option Selection"),
      options: bulkEditSelectionsOptions.map((selection) => {
        return {
          value: selection._id,
          label: selection.label,
        };
      }),
      placeholder: t("Edit Option Selection"),
      required: true,
      isMultiple: true,
      isDisabled: isEditSelectionCompeted,
    },
    {
      type: InputTypes.SELECT,
      formKey: "productCategories",
      label: t("Ikas Category"),
      options: ikasCategories?.map((category) => {
        return {
          value: category._id,
          label: category.name,
        };
      }),
      placeholder: t("Ikas Category"),
      required: false,
      isMultiple: true,
      isDisabled:
        !isEditSelectionCompeted ||
        !(bulkInputForm?.bulkEditSelection as string[])?.includes(
          "productCategories"
        ),
    },
    {
      type: InputTypes.NUMBER,
      formKey: "price",
      label: `${t("Price")}`,
      placeholder: `${t("Price")}`,
      isDisabled:
        !isEditSelectionCompeted ||
        !(bulkInputForm?.bulkEditSelection as string[])?.includes("price"),
      required: false,
    },
  ];
  const bulkEditFormKeys = [
    { key: "bulkEditSelection", type: FormKeyTypeEnum.STRING },
    { key: "productCategories", type: FormKeyTypeEnum.STRING },
    { key: "price", type: FormKeyTypeEnum.NUMBER },
  ];
  const productInputs = [
    ExpenseTypeInput({
      expenseTypes: expenseTypes,
      isMultiple: true,
      required: true,
    }),
    VendorInput({
      vendors: vendors,
      isMultiple: true,
      required: true,
    }),
    BrandInput({ brands: brands, isMultiple: true }),
  ];
  const productFormKeys = [
    { key: "expenseType", type: FormKeyTypeEnum.STRING },
    { key: "vendor", type: FormKeyTypeEnum.STRING },
    { key: "brand", type: FormKeyTypeEnum.STRING },
  ];
  // these are the inputs for the add item modal
  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      label: t("Name"),
      placeholder: t("Name"),
      required: true,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "description",
      label: t("Description"),
      placeholder: t("Description"),
      required: false,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "price",
      label: `${t("Price")}`,
      placeholder: `${t("Price")}`,
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "onlinePrice",
      label: `${t("Online Price")}`,
      placeholder: `${t("Online Price")}`,
      required: singleItemGroup?.category?.isOnlineOrder ?? false,
      isDisabled: !singleItemGroup?.category?.isOnlineOrder,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "ikasDiscountedPrice",
      label: `${t("Ikas Discounted Price")}`,
      placeholder: `${t("Ikas Discounted Price")}`,
      required: false,
      isDisabled: !singleItemGroup?.category?.isOnlineOrder,
    },
    {
      type: InputTypes.IMAGE,
      formKey: "imageUrl",
      label: "Image",
      required: false,
      folderName: "menu",
    },
    {
      type: InputTypes.SELECT,
      formKey: "matchedProduct",
      label: t("Matched Product"),
      options: products.map((product) => {
        return {
          value: product._id,
          label: product.name,
        };
      }),
      placeholder: t("Matched Product"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "productCategories",
      label: t("Product Categories"),
      options: productCategories.map((productCategory) => {
        return {
          value: productCategory._id,
          label: productCategory.name,
        };
      }),
      placeholder: t("Product Categories"),
      isMultiple: true,
      required: false,
    },
    {
      type: InputTypes.TEXT,
      formKey: "ikasId",
      label: "Ikas ID",
      placeholder: "Ikas ID",
      required: false,
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "description", type: FormKeyTypeEnum.STRING },
    { key: "price", type: FormKeyTypeEnum.NUMBER },
    { key: "onlinePrice", type: FormKeyTypeEnum.NUMBER },
    { key: "ikasDiscountedPrice", type: FormKeyTypeEnum.NUMBER },
    { key: "imageUrl", type: FormKeyTypeEnum.STRING },
    { key: "matchedProduct", type: FormKeyTypeEnum.STRING },
    { key: "productCategories", type: FormKeyTypeEnum.STRING },
    { key: "ikasId", type: FormKeyTypeEnum.STRING },
  ];
  // these are the columns and rowKeys for the table
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
    { key: t("Description"), isSortable: true },
    { key: `${t("Price")}`, isSortable: true },
    ...(singleItemGroup?.category?.isOnlineOrder
      ? [{ key: `${t("Online Price")}`, isSortable: true }]
      : []),
    ...(singleItemGroup?.category?.isOnlineOrder
      ? [{ key: `${t("Ikas Discounted Price")}`, isSortable: true }]
      : []),
    ...(!isDisabledCondition ? [{ key: t("Cost"), isSortable: false }] : []),
    ...(isMenuShowIkasCategories
      ? [{ key: t("Ikas Categories"), isSortable: false }]
      : []),
    { key: "Ikas ID", isSortable: false },
    { key: t("Matched Product"), isSortable: false },
    { key: t("Shown In Menu"), isSortable: false },
  ];
  const rowKeys = [
    { key: "imageUrl", isImage: true },
    {
      key: "name",
      node: (item: MenuItem) => {
        return (
          <p
            className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              const foundItem = getItem(item._id, items);
              if (foundItem) {
                setSelectedMenuItem(foundItem);
                window.scrollTo(0, 0);
              }
            }}
          >
            {item.name}
          </p>
        );
      },
    },
    { key: "description" },
    {
      key: "price",
      node: (item: MenuItem) => {
        return `${item?.price} ₺`;
      },
    },
    ...(singleItemGroup?.category?.isOnlineOrder
      ? [
          {
            key: "onlinePrice",
            node: (item: MenuItem) => {
              return `${
                item?.onlinePrice ? item?.onlinePrice + TURKISHLIRA : "-"
              } `;
            },
          },
        ]
      : []),
    ...(singleItemGroup?.category?.isOnlineOrder
      ? [
          {
            key: "ikasDiscountedPrice",
            node: (item: MenuItem) => {
              return `${
                item?.ikasDiscountedPrice
                  ? item?.ikasDiscountedPrice + TURKISHLIRA
                  : "-"
              } `;
            },
          },
        ]
      : []),
    ...(!isDisabledCondition
      ? [
          {
            key: "cost",
            node: (item: MenuItem) => {
              const total =
                item?.itemProduction?.reduce((acc, curr) => {
                  const product = products?.find(
                    (product) => product._id === curr.product
                  );
                  const unitPrice = product?.unitPrice ?? 0;
                  return acc + unitPrice * curr.quantity;
                }, 0) ?? 0;

              return total === 0 ? "-" : `${formatPrice(total)} ₺`;
            },
          },
        ]
      : []),
    ...(isMenuShowIkasCategories
      ? [
          {
            key: "productCategories",
            node: (item: MenuItem) => {
              return item?.productCategories
                ?.map((productCategory) => {
                  const foundProductCategory = getItem(
                    productCategory,
                    productCategories
                  );
                  return foundProductCategory?.name;
                })
                ?.join(", ");
            },
          },
        ]
      : []),
    {
      key: "ikasId",
      className: "min-w-32 pr-1",
    },
    { key: "matchedProductName" },
    {
      key: "shownInMenu",
      node: (row: MenuItem) => {
        if (isShownInMenu) {
          return (
            <CheckSwitch
              checked={row?.shownInMenu ?? false}
              onChange={() => {
                updateItem({
                  id: row._id,
                  updates: {
                    ...row,
                    shownInMenu: !row.shownInMenu,
                  },
                });
              }}
            />
          );
        }
        return row?.shownInMenu ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        );
      },
    },
  ];
  const insertIndex = 3;
  for (const location of locations) {
    if (singleItemGroup?.category?.locations?.includes(location._id)) {
      columns.splice(insertIndex, 0, { key: location.name, isSortable: false });
      (rowKeys as any).splice(insertIndex, 0, {
        key: location.name,
        node: (row: any) => {
          const isExist = row?.locations?.includes(location._id);
          if (isMenuLocationEdit) {
            return (
              <CheckSwitch
                checked={isExist}
                onChange={() => handleLocationUpdate(row, location._id)}
              />
            );
          }
          return isExist ? (
            <IoCheckmark className="text-blue-500 text-2xl" />
          ) : (
            <IoCloseOutline className="text-red-800 text-2xl" />
          );
        },
      });
    }
  }
  columns.push({ key: t("Action"), isSortable: false });

  const addButton = {
    name: t(`Add Item`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createItem as any}
        constantValues={{
          category: singleItemGroup?.category,
          locations: [1, 2],
        }}
        folderName="menu"
        generalClassName="overflow-scroll"
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    isDisabled: isDisabledCondition,
  };
  const handleDrag = (DragRow: MenuItem, DropRow: MenuItem) => {
    updateItemsOrder({
      id: DragRow._id,
      newOrder: DropRow.order,
    });
  };
  const addCollapsible = {
    name: "+",
    isModal: true,
    setRow: setRowToAction,
    modal: rowToAction ? (
      <GenericAddEditPanel
        topClassName="flex flex-col gap-2 "
        buttonName={t("Add")}
        isOpen={isAddCollapsibleOpen}
        close={() => setIsAddCollapsibleOpen(false)}
        inputs={collapsibleInputs}
        formKeys={collapsibleFormKeys}
        submitItem={updateItem as any}
        isEditMode={true}
        setForm={setForm}
        handleUpdate={() => {
          updateItem({
            id: rowToAction?._id,
            updates: {
              ...rowToAction,
              itemProduction: [...(rowToAction?.itemProduction || []), form],
            },
          });
        }}
      />
    ) : null,
    isModalOpen: isAddCollapsibleOpen,
    setIsModal: setIsAddCollapsibleOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  const collapsibleActions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      node: (row: any) => {
        return (
          <div
            className="text-red-500 cursor-pointer text-xl"
            onClick={() => {
              const foundMenuItem = getItem(row?._id, items);
              if (!foundMenuItem) return;
              updateItem({
                id: row?._id,
                updates: {
                  ...foundMenuItem,
                  itemProduction: row?.itemProduction?.filter(
                    (item: any) => item?.product !== row?.product
                  ),
                },
              });
            }}
          >
            <ButtonTooltip content={t("Delete")}>
              <HiOutlineTrash />
            </ButtonTooltip>
          </div>
        );
      },
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: false,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => deleteItem(rowToAction?._id)}
          title={t("Delete Item")}
          text={`${rowToAction?.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateItem as any}
          constantValues={{ category: singleItemGroup?.category }}
          isEditMode={true}
          itemToEdit={{ id: rowToAction?._id, updates: rowToAction }}
          generalClassName="overflow-scroll"
          topClassName="flex flex-col gap-2 "
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
    {
      name: t(`Add Product`),
      icon: <CiCirclePlus />,
      isModal: true,
      className: "text-2xl mt-1  cursor-pointer",
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isProductAddModalOpen}
          close={() => setIsProductAddModalOpen(false)}
          inputs={productInputs}
          formKeys={productFormKeys}
          setForm={setProductInputForm}
          submitItem={createAccountProduct as any}
          generalClassName="overflow-visible"
          topClassName="flex flex-col gap-2 "
          submitFunction={() => {
            createAccountProduct({
              ...productInputForm,
              matchedMenuItem: rowToAction?._id,
              name: rowToAction?.name,
            });
            setProductInputForm({
              brand: [],
              vendor: [],
              expenseType: [],
            });
          }}
        />
      ) : null,
      isModalOpen: isProductAddModalOpen,
      setIsModal: setIsProductAddModalOpen,
      isPath: false,
    },
    {
      name: t("Popular"),
      isPath: false,
      isModal: false,
      icon: null,
      node: (row: MenuItem) => {
        const isPopular = popularItems?.some(
          (popularItem) => popularItem?.item === row?._id
        );
        return isPopular ? (
          <button
            className="text-blue-500 cursor-pointer text-xl mt-1"
            onClick={() => deletePopular(row?._id)}
          >
            <ButtonTooltip content={t("Unpopular")}>
              <FaStar className="text-yellow-700" />
            </ButtonTooltip>
          </button>
        ) : (
          <button
            className="text-gray-500 cursor-pointer text-xl mt-1"
            onClick={() => createPopular({ item: row?._id })}
          >
            <ButtonTooltip content={t("Popular")}>
              <FaRegStar />
            </ButtonTooltip>
          </button>
        );
      },
    },
    {
      name: t("Toggle Active"),
      isDisabled: !showDeletedItems,
      isModal: false,
      isPath: false,
      icon: null,
      node: (row: any) => (
        <div className="mt-2 mr-auto">
          <CheckSwitch
            checked={!row?.deleted}
            onChange={() => {
              updateItem({
                id: row?._id,
                updates: {
                  ...row,
                  deleted: !row?.deleted,
                },
              });
            }}
          ></CheckSwitch>
        </div>
      ),
    },
  ];
  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={isMenuLocationEdit}
          onChange={() => {
            setIsMenuLocationEdit(!isMenuLocationEdit);
          }}
        />
      ),
    },
    {
      label: t("Shown In Menu"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={isShownInMenu}
          onChange={() => {
            setIsShownInMenu(!isShownInMenu);
          }}
        />
      ),
    },
    {
      label: t("Show Ikas Categories"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={isMenuShowIkasCategories}
          onChange={() => {
            setIsMenuShowIkasCategories(!isMenuShowIkasCategories);
          }}
        />
      ),
    },
    {
      label: t("Show Deleted Items"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showDeletedItems}
          onChange={() => {
            setShowDeletedItems(!showDeletedItems);
          }}
        />
      ),
    },
    {
      isUpperSide: true,
      isDisabled: isDisabledCondition,
      node: (
        <ButtonFilter
          buttonName={t("Update Items Slugs")}
          onclick={updateItemsSlugs}
        />
      ),
    },
  ];
  const selectionActions = [
    {
      name: t(`Edit`),
      isButton: true,
      buttonClassName:
        "px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer",
      isModal: true,
      className: "cursor-pointer",
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isBulkEditModalOpen}
          close={() => setIsBulkEditModalOpen(false)}
          inputs={bulkEditInputs}
          formKeys={bulkEditFormKeys}
          setForm={setBulkInputForm}
          submitItem={updateBulkItems as any}
          generalClassName="overflow-visible"
          topClassName="flex flex-col gap-2 "
          submitFunction={() => {
            if (!isEditSelectionCompeted) {
              setIsEditSelectionCompeted(true);
              return;
            }
            const adjustedBulkInputForm =
              bulkInputForm.bulkEditSelection.reduce((acc, key) => {
                acc[key] =
                  key in bulkInputForm
                    ? bulkInputForm[key]
                    : initialBulkInputForm[key];
                return acc;
              }, {});
            updateBulkItems({
              itemIds: selectedRows.map((row) => row._id),
              updates: adjustedBulkInputForm,
            });
            setSelectedRows([]);
            setIsSelectionActive(false);
            setIsEditSelectionCompeted(false);
          }}
          isSubmitButtonActive={isEditSelectionCompeted}
          buttonName={t("Edit")}
          additionalButtons={[
            {
              label: isEditSelectionCompeted ? t("Back") : t("Forward"),
              isInputRequirementCheck: true,
              onClick: () => {
                if (isEditSelectionCompeted) {
                  setIsEditSelectionCompeted(false);
                  return;
                }
                setIsEditSelectionCompeted(true);
              },
            },
          ]}
          additionalCancelFunction={() => {
            setSelectedRows([]);
            setIsSelectionActive(false);
            setIsEditSelectionCompeted(false);
          }}
        />
      ) : null,
      isModalOpen: isBulkEditModalOpen,
      setIsModal: setIsBulkEditModalOpen,
      isPath: false,
    },
    {
      name: t("Create Ikas Product"),
      isButton: true,
      buttonClassName:
        "px-2 ml-auto bg-blue-500 hover:text-blue-500 hover:border-blue-500 sm:px-3 py-1 h-fit w-fit  text-white  hover:bg-white  transition-transform  border  rounded-md cursor-pointer",
      onClick: () => {
        createMultipleIkasProduct({
          itemIds: selectedRows?.map((row) => row._id),
        } as any);
        setSelectedRows([]);
        setIsSelectionActive(false);
        setIsEditSelectionCompeted(false);
      },
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [
    singleItemGroup?.items,
    products,
    i18n.language,
    expenseTypes,
    brands,
    vendors,
    locations,
    productCategories,
    items,
    ikasCategories,
    showDeletedItems,
  ]);

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={tableKey}
        rowKeys={rowKeys}
        actions={actions}
        {...(!isDisabledCondition && { selectionActions: selectionActions })} //this condition may be removed
        isActionsActive={true}
        columns={columns}
        rows={rows}
        filters={filters}
        title={singleItemGroup?.category?.name}
        imageHolder={NO_IMAGE_URL}
        addButton={addButton}
        isCollapsibleCheckActive={false}
        addCollapsible={addCollapsible}
        isCollapsible={products.length > 0}
        collapsibleActions={collapsibleActions}
        isDraggable={true}
        onDragEnter={(DragRow, DropRow) => handleDrag(DragRow, DropRow)}
      />
    </div>
  );
};

export default MenuItemTable;
