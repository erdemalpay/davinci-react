import { Switch } from "@headlessui/react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { MenuCategory } from "../../types";
import { useCategoryMutations } from "../../utils/api/menu/category";
import { NameInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";

import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
type Props = {
  categories: MenuCategory[];
};

const CategoryTable = ({ categories }: Props) => {
  const { t } = useTranslation();
  const { menuActiveTab, setMenuActiveTab, setIsCategoryTabChanged } =
    useGeneralContext();
  const { deleteCategory, updateCategory, createCategory } =
    useCategoryMutations();
  const [rowToAction, setRowToAction] = useState<MenuCategory>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const inputs = [
    NameInput(),
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
    { key: "imageUrl", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: "", isSortable: false },
    { key: t("Name"), isSortable: true },
    { key: "Bahçeli", isSortable: false },
    { key: "Neorama", isSortable: false },
    { key: t("Action"), isSortable: false },
  ];

  const rowKeys = [
    { key: "imageUrl", isImage: true },
    {
      key: "name",
      node: (row: MenuCategory) => (
        <p
          onClick={() => setMenuActiveTab(row.order - 1)}
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
        >
          {row.name}
        </p>
      ),
    },
    {
      key: "bahceli",
      node: (row: MenuCategory) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.locations?.includes(1)}
            onChange={() => handleLocationUpdate(row, 1)}
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.locations?.includes(1) ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {row.locations?.includes(1) ? t("Yes") : t("No")}
          </p>
        ),
    },
    {
      key: "neorama",
      node: (row: MenuCategory) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row.locations?.includes(2)}
            onChange={() => handleLocationUpdate(row, 2)}
          />
        ) : (
          <p
            className={`w-fit px-2 py-1 rounded-md text-white ${
              row.locations?.includes(2) ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {row.locations?.includes(2) ? t("Yes") : t("No")}
          </p>
        ),
    },
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
        }}
        additionalSubmitFunction={() => {
          setMenuActiveTab(menuActiveTab + 1);
          setIsCategoryTabChanged(true);
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
  };

  const handleDrag = (DragRow: MenuCategory, DropRow: MenuCategory) => {
    updateCategory({
      id: DragRow._id,
      updates: { order: DropRow.order },
    });
    updateCategory({
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
          confirm={() => {
            deleteCategory(rowToAction?._id);
            setMenuActiveTab(menuActiveTab - 1);
            setIsCategoryTabChanged(true);
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
        <Switch
          checked={isEnableEdit}
          onChange={() => setIsEnableEdit((value) => !value)}
          className={`${isEnableEdit ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] min-w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${isEnableEdit ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
      ),
    },
  ];
  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={categories.length}
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={categories}
        filters={filters}
        title={t("Categories")}
        imageHolder={NO_IMAGE_URL}
        addButton={addButton}
        isDraggable={true}
        onDragEnter={(DragRow: MenuCategory, DropRow) =>
          handleDrag(DragRow, DropRow)
        }
      />
    </div>
  );
};

export default CategoryTable;
