import { TrashIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { ItemGroup } from "../../pages/MenuPage";
import { MenuItem } from "../../types";
import { useMenuItemMutations } from "../../utils/api/menu-item";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { AddMenuItemDialog } from "./AddItemDialog";

type Props = { singleItemGroup: ItemGroup };

const MenuItemTable = ({ singleItemGroup }: Props) => {
  const { deleteItem, updateItem } = useMenuItemMutations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
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
  const addButton = {
    name: `Add Item`,
    isModal: true,
    modal: (
      <AddMenuItemDialog
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        category={singleItemGroup.category}
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
