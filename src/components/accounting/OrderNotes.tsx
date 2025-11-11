import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { ActionEnum, DisabledConditionEnum } from "../../types";
import { useGetAllCategories } from "../../utils/api/menu/category";
import { useGetMenuItems } from "../../utils/api/menu/menu-item";
import {
  useGetOrderNotes,
  useOrderNotesMutations,
} from "../../utils/api/order/orderNotes";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const OrderNotes = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const categories = useGetAllCategories();
  const items = useGetMenuItems();
  const notes = useGetOrderNotes();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const { createOrderNote, updateOrderNote, deleteOrderNote } =
    useOrderNotesMutations();
  const disabledConditions = useGetDisabledConditions();

  const orderNotesDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.ACCOUNTING_ORDERNOTES, disabledConditions);
  }, [disabledConditions]);

  const rows = useMemo(() => {
    return (
      notes?.map((note) => {
        return {
          ...note,
          ...(note?.categories && {
            categoryNames: note?.categories
              ?.map((categoryId) => {
                const foundCategory = getItem(categoryId, categories);
                return foundCategory ? foundCategory.name : "";
              })
              ?.join(", "),
          }),
          ...(note?.items && {
            itemNames: note?.items
              ?.map((itemId) => {
                const foundItem = getItem(itemId, items);
                return foundItem ? foundItem.name : "";
              })
              ?.join(", "),
          }),
        };
      }) ?? []
    );
  }, [notes, categories, items]);

  const columns = useMemo(
    () => [
      { key: t("Note"), isSortable: true },
      {
        key: t("Categories"),
        isSortable: false,
      },
      { key: t("Items"), isSortable: false },
      {
        key: t("Actions"),
        isSortable: false,
      },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [{ key: "note" }, { key: "categoryNames" }, { key: "itemNames" }],
    []
  );

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXTAREA,
        formKey: "note",
        label: t("Note"),
        placeholder: t("Note"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "categories",
        label: t("Categories"),
        placeholder: t("Categories"),
        required: false,
        options: categories?.map((category) => ({
          label: category.name,
          value: category._id,
        })),
        isMultiple: true,
        invalidateKeys: [{ key: "items", defaultValue: [] }],
      },
      {
        type: InputTypes.SELECT,
        formKey: "items",
        label: t("Items"),
        placeholder: t("Items"),
        required: false,
        options:
          items?.map((item) => ({
            label: item.name,
            value: item._id,
          })) ?? [],
        isMultiple: true,
      },
    ],
    [t, categories, items]
  );

  const formKeys = useMemo(
    () => [
      { key: "note", type: FormKeyTypeEnum.STRING },
      { key: "categories", type: FormKeyTypeEnum.STRING },
      { key: "items", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t(`Add Order Note`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createOrderNote as any}
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
      isDisabled: orderNotesDisabledCondition?.actions?.some(
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
      createOrderNote,
      orderNotesDisabledCondition,
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
              deleteOrderNote(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Order Note")}
            text={`${t("Note")} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: orderNotesDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.DELETE &&
            user?.role?._id &&
            !ac.permissionsRoles.includes(user.role._id)
        ),
      },
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl ",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={inputs}
            formKeys={formKeys}
            submitItem={updateOrderNote as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: Number(rowToAction?._id), updates: rowToAction }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: orderNotesDisabledCondition?.actions?.some(
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
      updateOrderNote,
      deleteOrderNote,
      orderNotesDisabledCondition,
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
          title={t("Order Notes")}
          addButton={addButton}
          isToolTipEnabled={false}
          isActionsActive={true}
        />
      </div>
    </>
  );
};

export default OrderNotes;
