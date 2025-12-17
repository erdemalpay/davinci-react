import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { useUserContext } from "../../context/User.context";
import { Role, RoleEnum, RolePermissionEnum } from "../../types";
import { UpdatePayload } from "../../utils/api";
import { useGetRoles, useRoleMutations } from "../../utils/api/user/role";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

const Roles = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const roles = useGetRoles();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Role>();

  const { createRole, updateRole } = useRoleMutations();

  const rows = useMemo(() => {
    return roles ?? [];
  }, [roles]);

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
      { key: t("Color"), isSortable: false },
      { key: t("Permissions"), isSortable: false },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "name" },
      {
        key: "color",
        node: (row: Role) => (
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full border"
              style={{ backgroundColor: row.color }}
            />
            <span>{row.color}</span>
          </div>
        ),
      },
      {
        key: "permissions",
        node: (row: Role) => (
          <div className="flex flex-wrap gap-1">
            {row.permissions.map((permission: RolePermissionEnum) => (
              <span
                key={permission}
                className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs"
              >
                {permission}
              </span>
            ))}
          </div>
        ),
      },
    ],
    []
  );

  const permissionOptions = useMemo(
    () =>
      Object.values(RolePermissionEnum).map((permission) => ({
        value: permission,
        label: permission,
      })),
    []
  );

  const addInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.COLOR,
        formKey: "color",
        label: t("Color"),
        placeholder: t("Color"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "permissions",
        label: t("Permissions"),
        options: permissionOptions,
        isMultiple: true,
        placeholder: t("Permissions"),
        required: true,
      },
    ],
    [t, permissionOptions]
  );

  const editInputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.COLOR,
        formKey: "color",
        label: t("Color"),
        placeholder: t("Color"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "permissions",
        label: t("Permissions"),
        options: permissionOptions,
        isMultiple: true,
        placeholder: t("Permissions"),
        required: true,
      },
    ],
    [t, permissionOptions]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "color", type: FormKeyTypeEnum.STRING },
      { key: "permissions", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Role"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={addInputs}
          formKeys={formKeys}
          submitItem={
            createRole as unknown as (
              item: Partial<Role> | UpdatePayload<Partial<Role>>
            ) => void
          }
          topClassName="flex flex-col gap-2"
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
    }),
    [t, isAddModalOpen, addInputs, formKeys, createRole, user]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={editInputs}
            formKeys={formKeys}
            submitItem={
              updateRole as unknown as (
                item: Role | UpdatePayload<Role>
              ) => void
            }
            isEditMode={true}
            topClassName="flex flex-col gap-2"
            itemToEdit={{
              id: rowToAction._id,
              updates: rowToAction,
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
      },
    ],
    [t, rowToAction, isEditModalOpen, editInputs, formKeys, updateRole, user]
  );

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("Roles")}
        addButton={addButton}
        isActionsActive={true}
      />
    </div>
  );
};

export default Roles;
