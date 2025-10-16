import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { DisabledCondition } from "../../types";
import {
  useDisabledConditionMutations,
  useGetDisabledConditions,
} from "../../utils/api/panelControl/disabledCondition";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { useGetAllUserRoles } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { NameInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
  RowKeyType,
} from "../panelComponents/shared/types";

export interface DisabledConditionRow extends DisabledCondition {
  pageName: string;
}
const DisabledConditions = () => {
  const { t } = useTranslation();
  const roles = useGetAllUserRoles();
  const [rowToAction, setRowToAction] = useState<DisabledCondition | null>(
    null
  );
  const pages = useGetPanelControlPages();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const disabledConditions = useGetDisabledConditions();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const {
    createDisabledCondition,
    updateDisabledCondition,
    deleteDisabledCondition,
  } = useDisabledConditionMutations();
  function handleRolePermission(row: DisabledCondition, roleKey: number) {
    const newPermissionRoles = row?.permissionRoles || [];
    const index = newPermissionRoles.indexOf(roleKey);
    if (index === -1) {
      newPermissionRoles.push(roleKey);
    } else {
      newPermissionRoles.splice(index, 1);
    }
    updateDisabledCondition({
      id: row._id,
      updates: { permissionRoles: newPermissionRoles },
    });
    toast.success(`${t("Role permissions updated successfully.")}`);
  }
  const allRows = disabledConditions.map((dc) => {
    const page = getItem(dc.page, pages);
    return {
      ...dc,
      pageName: page?.name || dc.page,
    };
  });

  const inputs = [
    NameInput({ required: true }),
    {
      type: InputTypes.SELECT,
      formKey: "page",
      label: t("Page"),
      placeholder: t("Page"),
      options: pages.map((p) => ({ value: p._id, label: p.name })),
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "permissionRoles",
      label: t("Permission Roles"),
      placeholder: t("Permission Roles"),
      options: roles.map((r) => ({ value: r._id, label: r.name })),
      isMultiple: true,
      required: true,
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "page", type: FormKeyTypeEnum.STRING },
    { key: "permissionRoles", type: FormKeyTypeEnum.STRING },
  ];
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Page"), isSortable: true },
  ];

  const rowKeys: RowKeyType<DisabledConditionRow>[] = [
    { key: "name" },
    { key: "pageName" },
  ];
  for (const role of roles) {
    columns.push({ key: role.name, isSortable: true });
    rowKeys.push({
      key: role._id.toString(),
      node: (row: DisabledConditionRow) => {
        const hasPermission = row?.permissionRoles?.includes(role._id);
        return isEnableEdit ? (
          <CheckSwitch
            checked={hasPermission}
            onChange={() => handleRolePermission(row, role._id)}
          />
        ) : hasPermission ? (
          <IoCheckmark className={`text-blue-500 text-2xl `} />
        ) : (
          <IoCloseOutline className={`text-red-800 text-2xl `} />
        );
      },
    });
  }
  columns.push({ key: t("Actions"), isSortable: false });
  const addButton = {
    name: t(`Add Disabled Condition`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createDisabledCondition as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
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
            deleteDisabledCondition(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Disabled Condition")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ",
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
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateDisabledCondition as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [disabledConditions, roles]);

  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          title={t("Disabled Conditions")}
          isActionsActive={true}
          actions={actions}
          addButton={addButton}
          isSearch={false}
        />
      </div>
    </>
  );
};

export default DisabledConditions;
