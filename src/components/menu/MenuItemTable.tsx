import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { SlArrowDown, SlArrowUp } from "react-icons/sl";
import { toast } from "react-toastify";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { ItemGroup } from "../../pages/MenuPage";
import { MenuItem } from "../../types";
import { useMenuItemMutations } from "../../utils/api/menu-item";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
type Props = {
  singleItemGroup: ItemGroup;
};
// these are the inputs for the add item modal
const inputs = [
  {
    type: InputTypes.TEXT,
    formKey: "name",
    label: "Name",
    placeholder: "Name",
    required: true,
  },
  {
    type: InputTypes.TEXTAREA,
    formKey: "description",
    label: "Description",
    placeholder: "Description",
    required: true,
  },
  {
    type: InputTypes.NUMBER,
    formKey: "priceBahceli",
    label: "Price (Bahçeli)",
    placeholder: "Price (Bahçeli)",
    required: true,
  },
  {
    type: InputTypes.NUMBER,
    formKey: "priceNeorama",
    label: "Price (Neorama)",
    placeholder: "Price (Neorama)",
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
  "",
  "Name",
  "Description",
  "	Price (Bahçeli)",
  "Price (Neorama)",
  "Action",
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

const MenuItemTable = ({ singleItemGroup }: Props) => {
  const { deleteItem, updateItem, createItem } = useMenuItemMutations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<MenuItem>();
  const addButton = {
    name: `Add Item`,
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
  const actions = [
    {
      name: "Delete",
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => deleteItem(rowToAction?._id)}
          title="Delete Item"
          text={`${rowToAction.name} will be deleted. Are you sure you want to continue?`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
    {
      name: "Edit",
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
      name: "Move",
      icon: null,
      className: "text-blue-500 cursor-pointer text-xl",
      node: (row: MenuItem) => (
        <div className="flex flex-row justify-center items-center gap-2">
          <button
            onClick={() => updateItemOrder(row, true)}
            className={`${
              singleItemGroup.items[0] === row ? "invisible" : "visible"
            }`}
          >
            <ButtonTooltip content="Up">
              <SlArrowUp className="text-green-500 w-6 h-6" />
            </ButtonTooltip>
          </button>

          <button
            onClick={() => updateItemOrder(row, false)}
            className={`${
              singleItemGroup.items[singleItemGroup.items.length - 1] === row
                ? "invisible"
                : "visible"
            }`}
          >
            <ButtonTooltip content="Down">
              <SlArrowDown className="text-green-500 w-6 h-6" />
            </ButtonTooltip>
          </button>
        </div>
      ),

      isModal: false,
      setRow: setRowToAction,
      isPath: false,
    },
  ];
  function updateItemOrder(item: MenuItem, up: boolean) {
    const newOrder = up
      ? singleItemGroup.items[singleItemGroup.items.indexOf(item) - 1].order
      : singleItemGroup.items[singleItemGroup.items.indexOf(item) + 1].order;
    const otherItem =
      singleItemGroup &&
      singleItemGroup.items.find((c) => c.order === newOrder);
    updateItem({
      id: item._id,
      updates: { order: newOrder },
    });
    if (otherItem) {
      updateItem({
        id: otherItem._id,
        updates: { order: item.order },
      });
    }

    toast.success("Item order updated");
  }
  return (
    <div className="w-[90%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={singleItemGroup.items}
        title={singleItemGroup.category.name}
        imageHolder={NO_IMAGE_URL}
        addButton={addButton}
      />
    </div>
  );
};

export default MenuItemTable;
