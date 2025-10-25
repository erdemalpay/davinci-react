import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { Action, RoleEnum } from "../../types";

import {
  useActionMutations,
  useGetActions,
} from "../../utils/api/panelControl/action";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const Actions = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const panelControlActions = useGetActions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Action>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createAction, deleteAction, updateAction } = useActionMutations();

  const canManage = useMemo(() => {
    return user && [RoleEnum.MANAGER].includes(user?.role?._id);
  }, [user]);

  const rows = useMemo(() => panelControlActions, [panelControlActions]);

  const columns = useMemo(() => {
    const cols = [{ key: t("Name"), isSortable: true }];
    if (canManage) {
      cols.push({ key: t("Actions"), isSortable: false });
    }
    return cols;
  }, [t, canManage]);

  const rowKeys = useMemo(() => [{ key: "name" }], []);

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

  const addButton = useMemo(
    () => ({
      name: t(`Add Action`),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createAction as any}
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: !canManage,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    }),
    [t, isAddModalOpen, inputs, formKeys, createAction, canManage]
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
              deleteAction(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Action")}
            text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
        isDisabled: !canManage,
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
            submitItem={updateAction as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: !canManage,
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      isEditModalOpen,
      inputs,
      formKeys,
      updateAction,
      deleteAction,
      canManage,
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
          title={t("Actions")}
          addButton={addButton}
          isActionsActive={canManage ?? false}
        />
      </div>
    </>
  );
};

export default Actions;
