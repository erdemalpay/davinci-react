import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { RoleEnum, UpperCategory } from "../../types";

import { useGetCategories } from "../../utils/api/menu/category";
import {
  useGetUpperCategories,
  useUpperCategoryMutations,
} from "../../utils/api/menu/upperCategory";
import { getItem } from "../../utils/getItem";
import { NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";

const UpperCategories = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const upperCategories = useGetUpperCategories();
  const [tableKey, setTableKey] = useState(0);
  const categories = useGetCategories();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isAddCollapsibleOpen, setIsAddCollapsibleOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<UpperCategory>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [isCategoryDeleteModalOpen, setIsCategoryDeleteModalOpen] =
    useState(false);
  const [isCategoryEditModalOpen, setIsCategoryEditModalOpen] = useState(false);
  const initialForm = {
    category: 0,
    percentage: 100,
  };
  const [form, setForm] = useState(initialForm);
  const [editCategoryForm, setEditCategoryForm] = useState({ percentage: 0 });
  const { createUpperCategory, deleteUpperCategory, updateUpperCategory } =
    useUpperCategoryMutations();
  const collapsibleInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "category",
      label: t("Category"),
      options: (rowToAction
        ? categories?.filter(
            (category) =>
              !rowToAction?.categoryGroup?.some(
                (categoryGroup) => categoryGroup?.category === category?._id
              )
          )
        : categories
      )?.map((category) => {
        return {
          value: category._id,
          label: category.name,
        };
      }),
      placeholder: t("Category"),
      required: true,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "percentage",
      label: t("Percentage"),
      placeholder: t("Percentage"),
      required: true,
    },
  ];
  const collapsibleFormKeys = [
    { key: "category", type: FormKeyTypeEnum.STRING },
    { key: "percentage", type: FormKeyTypeEnum.NUMBER },
  ];
  const editCategoryInputs = [
    {
      type: InputTypes.NUMBER,
      formKey: "percentage",
      label: t("Percentage"),
      placeholder: t("Percentage"),
      required: true,
    },
  ];
  const editCategoryFormKeys = [
    { key: "percentage", type: FormKeyTypeEnum.NUMBER },
  ];
  const allRows = upperCategories?.map((upperCategory) => {
    return {
      ...upperCategory,
      collapsible: {
        collapsibleHeader: t("Categories"),
        collapsibleColumns: [
          { key: t("Category"), isSortable: true },
          { key: t("Percentage"), isSortable: true },
          { key: t("Actions"), isSortable: false, className: "text-center" },
        ],
        collapsibleRows: upperCategory?.categoryGroup?.map((categoryGroup) => {
          return {
            ...categoryGroup,
            categoryName:
              getItem(categoryGroup?.category, categories)?.name ?? "",
          };
        }),
        collapsibleRowKeys: [{ key: "categoryName" }, { key: "percentage" }],
      },
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [{ key: t("Name"), isSortable: true }];
  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER, RoleEnum.GAMEMANAGER].includes(
      user?.role?._id
    )
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
  ];
  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const addCollapsible = {
    name: t(`Add Category`),
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
        submitItem={updateUpperCategory as any}
        constantValues={{ percentage: 100 }}
        isEditMode={true}
        setForm={setForm}
        handleUpdate={() => {
          updateUpperCategory({
            id: rowToAction?._id,
            updates: {
              categoryGroup: [
                ...rowToAction?.categoryGroup,
                {
                  category: form.category,
                  percentage: form.percentage,
                },
              ],
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
  const addButton = {
    name: t(`Add Upper Category`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createUpperCategory as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    isDisabled: user
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id)
      : true,
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
            deleteUpperCategory(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Upper Category")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
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
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateUpperCategory as any}
          isEditMode={false}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  const collapsibleActions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      node: (row: any) => {
        return (
          <div
            className="text-red-500 cursor-pointer text-xl "
            onClick={() => {
              updateUpperCategory({
                id: row?._id,
                updates: {
                  categoryGroup: row?.categoryGroup.filter(
                    (category: any) => category.category !== row?.category
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
      isModalOpen: isCategoryDeleteModalOpen,
      setIsModal: setIsCategoryDeleteModalOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isCategoryEditModalOpen}
          setForm={setEditCategoryForm}
          close={() => setIsCategoryEditModalOpen(false)}
          inputs={editCategoryInputs}
          formKeys={editCategoryFormKeys}
          submitItem={updateUpperCategory as any}
          constantValues={{ percentage: (rowToAction as any).percentage }}
          isEditMode={true}
          submitFunction={() => {
            updateUpperCategory({
              id: rowToAction?._id,
              updates: {
                categoryGroup: rowToAction?.categoryGroup.map((category: any) =>
                  category.category === (rowToAction as any)?.category
                    ? {
                        category: category.category,
                        percentage: editCategoryForm.percentage,
                      }
                    : category
                ),
              },
            });
          }}
          topClassName="flex flex-col gap-2 "
        />
      ) : null,
      isModalOpen: isCategoryEditModalOpen,
      setIsModal: setIsCategoryEditModalOpen,
      isPath: false,
      isDisabled: user
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [upperCategories]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Upper Categories")}
          addButton={addButton}
          isCollapsibleCheckActive={false}
          isCollapsible={true}
          addCollapsible={addCollapsible}
          collapsibleActions={collapsibleActions}
          isActionsActive={
            user
              ? [
                  RoleEnum.MANAGER,
                  RoleEnum.CATERINGMANAGER,
                  RoleEnum.GAMEMANAGER,
                ].includes(user?.role?._id)
              : false
          }
        />
      </div>
    </>
  );
};

export default UpperCategories;
