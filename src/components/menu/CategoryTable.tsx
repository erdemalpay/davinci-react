import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { MenuCategory } from "../../types";
import { useCategoryMutations } from "../../utils/api/menu/category";
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
  const { deleteCategory, updateCategory, createCategory } =
    useCategoryMutations();
  const [rowToAction, setRowToAction] = useState<MenuCategory>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        key={categories.length}
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        isActionsActive={true}
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
