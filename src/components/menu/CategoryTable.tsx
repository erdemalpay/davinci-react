import { useState } from "react";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { SlArrowDown, SlArrowUp } from "react-icons/sl";
import { toast } from "react-toastify";
import { NO_IMAGE_URL } from "../../navigation/constants";
import { MenuCategory } from "../../types";
import { useCategoryMutations } from "../../utils/api/category";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type Props = {
  categories: MenuCategory[];
};
const inputs = [
  {
    type: InputTypes.TEXT,
    formKey: "name",
    label: "Name",
    placeholder: "Name",
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
  { key: "imageUrl", type: FormKeyTypeEnum.STRING },
];
const CategoryTable = ({ categories }: Props) => {
  const { deleteCategory, updateCategory, createCategory } =
    useCategoryMutations();
  const [rowToAction, setRowToAction] = useState<MenuCategory>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const columns = ["", "Name", "Action"];
  const rowKeys = [
    { key: "imageUrl", isImage: true },
    {
      key: "name",
    },
  ];
  const addButton = {
    name: `Add Category`,
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => {
          setIsAddModalOpen(false);
        }}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createCategory as any}
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  function updateCategoryOrder(category: MenuCategory, up: boolean) {
    const newOrder = up ? category.order - 1 : category.order + 1;
    const otherItem =
      categories && categories.find((c) => c.order === newOrder);
    updateCategory({
      id: category._id,
      updates: { order: newOrder },
    });
    if (otherItem) {
      updateCategory({
        id: otherItem._id,
        updates: { order: category.order },
      });
    }

    toast.success("Category order updated");
  }

  const actions = [
    {
      name: "Delete",
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteCategory(rowToAction?._id);

            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title="Delete Category"
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
    {
      name: "Move",
      icon: null,
      className: "text-blue-500 cursor-pointer text-xl",
      node: (row: MenuCategory) => (
        <div className="flex flex-row justify-center items-center gap-2">
          <button
            onClick={() => updateCategoryOrder(row, true)}
            className={`${row.order === 1 ? "invisible" : "visible"}`}
          >
            <ButtonTooltip content="Up">
              <SlArrowUp className="text-green-500 w-6 h-6" />
            </ButtonTooltip>
          </button>

          <button
            onClick={() => updateCategoryOrder(row, false)}
            className={`${
              row.order === categories.length ? "invisible" : "visible"
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

  return (
    <div className="w-[90%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={categories}
        title={"Categories"}
        imageHolder={NO_IMAGE_URL}
        addButton={addButton}
      />
    </div>
  );
};

export default CategoryTable;
