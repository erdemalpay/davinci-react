import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  UpperCategory,
} from "../../types";

import { useGetCategories } from "../../utils/api/menu/category";
import {
  useGetUpperCategories,
  useUpperCategoryMutations,
} from "../../utils/api/menu/upperCategory";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import ButtonTooltip from "../panelComponents/Tables/ButtonTooltip";
import GenericTable from "../panelComponents/Tables/GenericTable";

const UpperCategories = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const upperCategories = useGetUpperCategories();
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
  const disabledConditions = useGetDisabledConditions();

  const upperCategoriesDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.ACCOUNTING_UPPERCATEGORIES,
      disabledConditions
    );
  }, [disabledConditions]);

  const collapsibleInputs = useMemo(
    () => [
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
    ],
    [t, categories, rowToAction]
  );

  const collapsibleFormKeys = useMemo(
    () => [
      { key: "category", type: FormKeyTypeEnum.STRING },
      { key: "percentage", type: FormKeyTypeEnum.NUMBER },
    ],
    []
  );

  const editCategoryInputs = useMemo(
    () => [
      {
        type: InputTypes.NUMBER,
        formKey: "percentage",
        label: t("Percentage"),
        placeholder: t("Percentage"),
        required: true,
      },
    ],
    [t]
  );

  const editCategoryFormKeys = useMemo(
    () => [{ key: "percentage", type: FormKeyTypeEnum.NUMBER }],
    []
  );

  const rows = useMemo(() => {
    return upperCategories?.map((upperCategory) => {
      return {
        ...upperCategory,
        collapsible: {
          collapsibleHeader: t("Categories"),
          collapsibleColumns: [
            { key: t("Category"), isSortable: true },
            { key: t("Percentage"), isSortable: true },
            { key: t("Actions"), isSortable: false, className: "text-center" },
          ],
          collapsibleRows: upperCategory?.categoryGroup?.map(
            (categoryGroup) => {
              return {
                ...categoryGroup,
                categoryName:
                  getItem(categoryGroup?.category, categories)?.name ?? "",
              };
            }
          ),
          collapsibleRowKeys: [{ key: "categoryName" }, { key: "percentage" }],
        },
      };
    });
  }, [upperCategories, t, categories]);

  const columns = useMemo(() => {
    return [
      { key: t("Name"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ];
  }, [t]);

  const rowKeys = useMemo(
    () => [
      {
        key: "name",
        className: "min-w-32 pr-1",
      },
    ],
    []
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
    ],
    [t]
  );

  const formKeys = useMemo(
    () => [{ key: "name", type: FormKeyTypeEnum.STRING }],
    []
  );

  const addCollapsible = useMemo(
    () => ({
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
                  ...(rowToAction?.categoryGroup as any),
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
    }),
    [
      t,
      rowToAction,
      isAddCollapsibleOpen,
      collapsibleInputs,
      collapsibleFormKeys,
      updateUpperCategory,
      form,
    ]
  );

  const addButton = useMemo(
    () => ({
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
      isDisabled: upperCategoriesDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          user?.role?._id &&
          !ac.permissionsRoles.includes(user.role._id)
      ),
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createUpperCategory,
      upperCategoriesDisabledCondition,
      user,
    ]
  );

  const actions = useMemo(
    () => [
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
        isDisabled: upperCategoriesDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
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
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: upperCategoriesDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      isEditModalOpen,
      inputs,
      formKeys,
      updateUpperCategory,
      deleteUpperCategory,
      upperCategoriesDisabledCondition,
      user,
    ]
  );

  const collapsibleActions = useMemo(
    () => [
      {
        name: t("Delete"),
        icon: <HiOutlineTrash />,
        node: (row: any) => {
          const isDeleteDisabled =
            upperCategoriesDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.DELETE &&
                user?.role?._id &&
                !ac.permissionsRoles.includes(user.role._id)
            );
          if (isDeleteDisabled) {
            return null;
          }
          return (
            <div
              className="text-red-500 cursor-pointer text-xl"
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
                  categoryGroup: rowToAction?.categoryGroup.map(
                    (category: any) =>
                      category.category === (rowToAction as any)?.category
                        ? {
                            category: category.category,
                            percentage: Number(editCategoryForm.percentage),
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
        isDisabled: upperCategoriesDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
      },
    ],
    [
      t,
      updateUpperCategory,
      isCategoryDeleteModalOpen,
      rowToAction,
      isCategoryEditModalOpen,
      editCategoryInputs,
      editCategoryFormKeys,
      editCategoryForm,
      upperCategoriesDisabledCondition,
      user,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Upper Categories")}
          addButton={addButton}
          isCollapsibleCheckActive={false}
          isCollapsible={true}
          addCollapsible={
            upperCategoriesDisabledCondition?.actions?.some(
              (ac) =>
                ac.action === ActionEnum.ADD &&
                user?.role?._id &&
                !ac.permissionsRoles.includes(user.role._id)
            )
              ? undefined
              : addCollapsible
          }
          collapsibleActions={collapsibleActions}
          isActionsActive={true}
        />
      </div>
    </>
  );
};

export default UpperCategories;
