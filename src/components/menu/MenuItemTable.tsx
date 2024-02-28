import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { ItemGroup } from "../../pages/MenuPage";
import { MenuItem } from "../../types";
import { useMenuItemMutations } from "../../utils/api/menu-item";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = { singleItemGroup: ItemGroup };
// these are the inputs for the add item modal
const inputs = [
  {
    type: InputTypes.TEXT,
    formKey: "name",
    label: "Name",
    placeholder: "Name",
  },
  {
    type: InputTypes.TEXTAREA,
    formKey: "description",
    label: "Description",
    placeholder: "Description",
  },
  {
    type: InputTypes.NUMBER,
    formKey: "priceBahceli",
    label: "Price (Bahçeli)",
    placeholder: "Price (Bahçeli)",
  },
  {
    type: InputTypes.NUMBER,
    formKey: "priceNeorama",
    label: "Price (Neorama)",
    placeholder: "Price (Neorama)",
  },
  {
    type: InputTypes.IMAGE,
    formKey: "imageUrl",
    label: "Image",

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
  const [rowToEdit, setRowToEdit] = useState<MenuItem>();
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
      icon: <TrashIcon />,
      onClick: (row: MenuItem) => deleteItem(row._id),
      className: "text-red-500 cursor-pointer",
      isModal: false,
      isPath: false,
    },
    {
      name: "Edit",
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToEdit,
      modal: rowToEdit ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateItem as any}
          constantValues={{ category: singleItemGroup.category }}
          isEditMode={true}
          itemToEdit={{ id: rowToEdit._id, updates: rowToEdit }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,

      isPath: false,
    },
  ];
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
