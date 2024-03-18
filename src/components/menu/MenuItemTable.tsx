import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FaRegStar, FaStar } from "react-icons/fa";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { ItemGroup } from "../../pages/Menu";
import { MenuItem, MenuPopular } from "../../types";
import { useMenuItemMutations } from "../../utils/api/menu/menu-item";
import { usePopularMutations } from "../../utils/api/menu/popular";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {
  singleItemGroup: ItemGroup;
  popularItems: MenuPopular[];
};

const MenuItemTable = ({ singleItemGroup, popularItems }: Props) => {
  const { t } = useTranslation();
  const { deleteItem, updateItem, createItem } = useMenuItemMutations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { createPopular, deletePopular } = usePopularMutations();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<MenuItem>();
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
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "priceBahceli",
      label: `${t("Price")} (Bahçeli)`,
      placeholder: `${t("Price")} (Bahçeli)`,
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "priceNeorama",
      label: `${t("Price")} (Neorama)`,
      placeholder: `${t("Price")} (Neorama)`,
      required: true,
    },
    {
      type: InputTypes.IMAGE,
      formKey: "imageUrl",
      label: "Image",
      required: false,
      folderName: "menu",
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "description", type: FormKeyTypeEnum.STRING },
    { key: "priceBahceli", type: FormKeyTypeEnum.NUMBER },
    { key: "priceNeorama", type: FormKeyTypeEnum.NUMBER },
    { key: "imageUrl", type: FormKeyTypeEnum.STRING },
  ];
  // these are the columns and rowKeys for the table
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
    { key: t("Description"), isSortable: true },
    { key: `${t("Price")} (Bahçeli)`, isSortable: true },
    { key: `${t("Price")} (Neorama)`, isSortable: true },
    { key: t("Action"), isSortable: false },
  ];

  const rowKeys = [
    { key: "imageUrl", isImage: true },
    {
      key: "name",
    },
    {
      key: "description",
    },
    {
      key: "priceBahceli",
    },
    {
      key: "priceNeorama",
    },
  ];
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
        constantValues={{ category: singleItemGroup.category }}
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
    updateItem({
      id: DragRow._id,
      updates: { order: DropRow.order },
    });
    updateItem({
      id: DropRow._id,
      updates: { order: DragRow.order },
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
          confirm={() => deleteItem(rowToAction?._id)}
          title={t("Delete Item")}
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
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateItem as any}
          constantValues={{ category: singleItemGroup.category }}
          isEditMode={true}
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
    {
      name: t("Popular"),
      isPath: false,
      isModal: false,
      icon: null,
      node: (row: MenuItem) => {
        const isPopular = popularItems.some(
          (popularItem) => (popularItem.item as MenuItem)._id === row._id
        );
        return isPopular ? (
          <button
            className="text-blue-500 cursor-pointer text-xl"
            onClick={() => deletePopular(row._id)}
          >
            <ButtonTooltip content={t("Unpopular")}>
              <FaStar className="text-yellow-700" />
            </ButtonTooltip>
          </button>
        ) : (
          <button
            className="text-gray-500 cursor-pointer text-xl"
            onClick={() => createPopular({ item: row._id })}
          >
            <ButtonTooltip content={t("Popular")}>
              <FaRegStar />
            </ButtonTooltip>
          </button>
        );
      },
    },
  ];

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={singleItemGroup.items}
        title={singleItemGroup.category.name}
        imageHolder={NO_IMAGE_URL}
        addButton={addButton}
        isDraggable={true}
        onDragEnter={(DragRow, DropRow) => handleDrag(DragRow, DropRow)}
      />
    </div>
  );
};

export default MenuItemTable;
