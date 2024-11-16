import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CiCirclePlus } from "react-icons/ci";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { ItemGroup } from "../../pages/Menu";
import {
  AccountProduct,
  LocationEnum,
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
import { useGetAccountVendors } from "../../utils/api/account/vendor";
import {
  useMenuItemMutations,
  useUpdateItemsOrderMutation,
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
  const products = useGetAllAccountProducts();
  const { deleteItem, updateItem, createItem } = useMenuItemMutations();
  const expenseTypes = useGetAccountExpenseTypes();
  const brands = useGetAccountBrands();
  const vendors = useGetAccountVendors();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProductAddModalOpen, setIsProductAddModalOpen] = useState(false);
  const { mutate: updateItemsOrder } = useUpdateItemsOrderMutation();
  const { createPopular, deletePopular } = usePopularMutations();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
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

  const allRows = singleItemGroup?.items.map((item) => {
    return {
      ...item,
      matchedProductName: getItem(item?.matchedProduct, products)?.name,
      collapsible: {
        collapsibleHeader: t("Ingredients"),
        collapsibleColumns: [
          { key: t("Product"), isSortable: true },
          { key: t("Quantity"), isSortable: true },
          ...(!singleItemGroup?.category?.isOnlineOrder ||
          user?.role?._id === RoleEnum.MANAGER
            ? [{ key: t("Cost"), isSortable: true }]
            : []),
          { key: t("Decrement Stock"), isSortable: false },
          { key: t("Action"), isSortable: false, className: "text-center" },
        ],
        collapsibleRows: item?.itemProduction?.map((itemProduction) => ({
          product: itemProduction.product,
          name: products?.find(
            (product: AccountProduct) => product._id === itemProduction.product
          )?.name,
          price: formatPrice(
            (products?.find((product) => product._id === itemProduction.product)
              ?.unitPrice ?? 0) * itemProduction.quantity
          ),
          quantity: itemProduction.quantity,
          isDecrementStock: itemProduction?.isDecrementStock,
        })),

        collapsibleRowKeys: [
          { key: "name" },
          { key: "quantity" },
          ...(!singleItemGroup?.category?.isOnlineOrder ||
          user?.role?._id === RoleEnum.MANAGER
            ? [{ key: "price" }]
            : []),
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
      updates: { locations: newLocations },
    });
    toast.success(`${t("Menu Item updated successfully")}`);
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
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "description", type: FormKeyTypeEnum.STRING },
    { key: "price", type: FormKeyTypeEnum.NUMBER },
    { key: "onlinePrice", type: FormKeyTypeEnum.NUMBER },
    { key: "imageUrl", type: FormKeyTypeEnum.STRING },
    { key: "matchedProduct", type: FormKeyTypeEnum.STRING },
  ];
  // these are the columns and rowKeys for the table
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
    { key: t("Description"), isSortable: true },
    { key: "Bahçeli", isSortable: false },
    { key: "Neorama", isSortable: false },
    { key: `${t("Price")}`, isSortable: true },
    ...(singleItemGroup?.category?.isOnlineOrder
      ? [{ key: `${t("Online Price")}`, isSortable: true }]
      : []),
    { key: t("Cost"), isSortable: false },
    { key: t("Matched Product"), isSortable: false },
    { key: t("Action"), isSortable: false },
  ];

  const rowKeys = [
    { key: "imageUrl", isImage: true },
    { key: "name" },
    { key: "description" },
    {
      key: "bahceli",
      node: (row: MenuItem) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row?.locations?.includes(1)}
            onChange={() => handleLocationUpdate(row, 1)}
          />
        ) : row?.locations?.includes(1) ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        ),
    },
    {
      key: "neorama",
      node: (row: MenuItem) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row?.locations?.includes(2)}
            onChange={() => handleLocationUpdate(row, 2)}
          />
        ) : row?.locations?.includes(2) ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        ),
    },
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
    { key: "matchedProductName" },
  ];
  if (!singleItemGroup?.category?.locations?.includes(LocationEnum.BAHCELI)) {
    columns.splice(
      columns.findIndex((column) => column.key === "Bahçeli"),
      1
    );
    rowKeys.splice(
      rowKeys.findIndex((rowKey) => rowKey.key === "bahceli"),
      1
    );
  }
  if (!singleItemGroup?.category?.locations?.includes(LocationEnum.NEORAMA)) {
    columns.splice(
      columns.findIndex((column) => column.key === "Neorama"),
      1
    );
    rowKeys.splice(
      rowKeys.findIndex((rowKey) => rowKey.key === "neorama"),
      1
    );
  }
  // for online orders cost field is removed
  if (
    user &&
    ![RoleEnum.MANAGER].includes(user?.role?._id) &&
    singleItemGroup?.category?.isOnlineOrder
  ) {
    columns.splice(
      columns.findIndex((column) => column.key === "Cost"),
      1
    );
    rowKeys.splice(
      rowKeys.findIndex((rowKey) => rowKey.key === "cost"),
      1
    );
  }
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
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
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
              updateItem({
                id: row?._id,
                updates: {
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
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
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
  ];
  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
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
  ]);
  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={tableKey}
        rowKeys={rowKeys}
        actions={actions}
        isActionsActive={true}
        columns={columns}
        rows={rows}
        filters={filters}
        title={singleItemGroup?.category?.name}
        imageHolder={NO_IMAGE_URL}
        addButton={addButton}
        isCollapsibleCheckActive={false}
        addCollapsible={addCollapsible}
        isDraggable={true}
        isCollapsible={products.length > 0}
        collapsibleActions={collapsibleActions}
        onDragEnter={(DragRow, DropRow) => handleDrag(DragRow, DropRow)}
      />
    </div>
  );
};

export default MenuItemTable;
