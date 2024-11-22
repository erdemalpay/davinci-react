import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { MenuCategory, OrderDiscountStatus, RoleEnum } from "../../types";
import {
  useCategoryMutations,
  useUpdateCategoriesOrderMutation,
} from "../../utils/api/menu/category";
import { useGetKitchens } from "../../utils/api/menu/kitchen";
import { useGetOrderDiscounts } from "../../utils/api/order/orderDiscount";
import { getItem } from "../../utils/getItem";
import { NameInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

type Props = {
  categories: MenuCategory[];
  handleCategoryChange: () => void;
};

const CategoryTable = ({ categories, handleCategoryChange }: Props) => {
  const { t } = useTranslation();
  const {
    menuActiveTab,
    setMenuActiveTab,
    isCategoryTableEditOpen,
    setIsCategoryTableEditOpen,
  } = useGeneralContext();
  const discounts = useGetOrderDiscounts()?.filter(
    (discount) => discount?.status !== OrderDiscountStatus.DELETED
  );
  const { user } = useUserContext();
  const isDisabledCondition = user
    ? ![
        RoleEnum.MANAGER,
        RoleEnum.CATERINGMANAGER,
        RoleEnum.GAMEMANAGER,
      ].includes(user?.role?._id)
    : true;
  const kitchens = useGetKitchens();
  const { deleteCategory, updateCategory, createCategory } =
    useCategoryMutations();
  const { mutate: updateCategoriesOrder } = useUpdateCategoriesOrderMutation();
  const [tableKey, setTableKey] = useState(0);
  const [rowToAction, setRowToAction] = useState<MenuCategory>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const allRows = categories.map((category) => {
    const categoryKitchen = getItem(category.kitchen, kitchens);
    return {
      ...category,

      kitchenName: categoryKitchen?.name,
    };
  });
  const [rows, setRows] = useState(allRows);
  const inputs = [
    NameInput(),
    {
      type: InputTypes.SELECT,
      formKey: "kitchen",
      label: t("Kitchen"),
      options: kitchens?.map((kitchen) => {
        return {
          value: kitchen._id,
          label: kitchen.name,
        };
      }),
      placeholder: t("Kitchen"),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "discounts",
      label: t("Discount"),
      options: discounts?.map((discount) => ({
        value: discount._id,
        label: discount.name,
      })),
      placeholder: t("Discount"),
      isMultiple: true,
      required: false,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isAutoServed",
      label: t("Auto served"),
      placeholder: t("Auto served"),
      required: true,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isOnlineOrder",
      label: t("Online Order"),
      placeholder: t("Online Order"),
      required: true,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.IMAGE,
      formKey: "imageUrl",
      label: t("Image"),
      required: false,
      folderName: "menu",
    },
  ];

  function handleLocationUpdate(item: MenuCategory, location: number) {
    const newLocations = item.locations || [];
    // Add if it doesn't exist, remove otherwise
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateCategory({
      id: item._id,
      updates: { locations: newLocations },
    });
    toast.success(`${t("Category updated successfully")}`);
  }
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "kitchen", type: FormKeyTypeEnum.STRING },
    { key: "discounts", type: FormKeyTypeEnum.STRING },
    { key: "isAutoServed", type: FormKeyTypeEnum.BOOLEAN },
    { key: "isOnlineOrder", type: FormKeyTypeEnum.BOOLEAN },
    { key: "imageUrl", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
    { key: t("Kitchen"), isSortable: true },
    { key: t("Discounts"), isSortable: false },
    { key: "Bahçeli", isSortable: false },
    { key: "Neorama", isSortable: false },
    ...(!isDisabledCondition
      ? [
          { key: t("Auto served"), isSortable: false },
          { key: t("Online Order"), isSortable: false },
          { key: t("Action"), isSortable: false },
        ]
      : []),
  ];

  const rowKeys = [
    { key: "imageUrl", isImage: true },
    {
      key: "name",
      node: (row: MenuCategory) => (
        <p
          onClick={() => {
            setMenuActiveTab(row.order - 2);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform sm:pl-4"
        >
          {row.name}
        </p>
      ),
    },
    { key: "kitchenName" },
    {
      key: "discounts",
      className: "min-w-32",
      node: (row: any) => {
        if (!row?.discounts) {
          return <span className="text-sm">-</span>;
        }
        return row?.discounts?.map((discount: number, index: any) => {
          const foundDiscount = discounts?.find(
            (dscnt) => dscnt._id === discount
          );
          return (
            <span
              key={foundDiscount?.name ?? index + row._id + "foundDiscount"}
              className={`text-sm   mr-1 rounded-md w-fit `}
            >
              {foundDiscount?.name}
              {(row?.discounts?.length ?? 0) - 1 !== index && ","}
            </span>
          );
        });
      },
    },
    {
      key: "bahceli",
      node: (row: MenuCategory) =>
        isCategoryTableEditOpen ? (
          <CheckSwitch
            checked={row.locations?.includes(1)}
            onChange={() => handleLocationUpdate(row, 1)}
          />
        ) : row?.locations?.includes(1) ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    },
    {
      key: "neorama",
      node: (row: MenuCategory) =>
        isCategoryTableEditOpen ? (
          <CheckSwitch
            checked={row.locations?.includes(2)}
            onChange={() => handleLocationUpdate(row, 2)}
          />
        ) : row?.locations?.includes(2) ? (
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    },
    ...(!isDisabledCondition
      ? [
          {
            key: "isAutoServed",
            node: (row: MenuCategory) =>
              row.isAutoServed ? (
                <IoCheckmark className="text-blue-500 text-2xl " />
              ) : (
                <IoCloseOutline className="text-red-800 text-2xl " />
              ),
          },
          {
            key: "isOnlineOrder",
            node: (row: MenuCategory) =>
              row?.isOnlineOrder ? (
                <IoCheckmark className="text-blue-500 text-2xl " />
              ) : (
                <IoCloseOutline className="text-red-800 text-2xl " />
              ),
          },
        ]
      : []),
  ];
  const addButton = {
    name: t("Add Category"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        submitItem={createCategory as any}
        close={() => {
          setIsAddModalOpen(false);
          handleCategoryChange();
        }}
        additionalSubmitFunction={() => {
          setMenuActiveTab(menuActiveTab + 1);
        }}
        inputs={inputs}
        formKeys={formKeys}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    isDisabled: isDisabledCondition,
  };

  const handleDrag = (DragRow: MenuCategory, DropRow: MenuCategory) => {
    updateCategoriesOrder({
      id: DragRow._id,
      newOrder: DropRow.order,
    });
  };
  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            handleCategoryChange();
            deleteCategory(rowToAction?._id);
            setMenuActiveTab(menuActiveTab - 1);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Category")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
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
          close={() => {
            setIsEditModalOpen(false);
          }}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateCategory as any}
          isEditMode={true}
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={isCategoryTableEditOpen}
          onChange={setIsCategoryTableEditOpen}
        />
      ),
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [kitchens, categories]);

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={tableKey}
        rowKeys={rowKeys}
        actions={isDisabledCondition ? [] : actions}
        columns={columns}
        isActionsActive={!isDisabledCondition}
        rows={rows}
        filters={filters}
        title={t("Categories")}
        imageHolder={NO_IMAGE_URL}
        addButton={addButton}
        isDraggable={!isDisabledCondition}
        onDragEnter={(DragRow: MenuCategory, DropRow) =>
          handleDrag(DragRow, DropRow)
        }
      />
    </div>
  );
};

export default CategoryTable;
