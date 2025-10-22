import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { Education, DisabledConditionEnum, ActionEnum } from "../../types";
import {
  useEducationMutations,
  useGetEducations,
} from "../../utils/api/education";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { useGetAllUserRoles } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";

const EducationPermissions = () => {
  const { t } = useTranslation();
  const roles = useGetAllUserRoles();
  const educations = useGetEducations();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { updateEducation } = useEducationMutations();
  const { user } = useUserContext();
  const disabledConditions = useGetDisabledConditions();
  const educationPageDisabledCondition = getItem(
    DisabledConditionEnum.PANELCONTROL_EDUCATIONPERMISSIONS,
    disabledConditions
  );
  function handleRolePermission(row: Education, roleKey: number) {
    const newPermissionRoles = row?.permissionRoles || [];
    const index = newPermissionRoles.indexOf(roleKey);
    if (index === -1) {
      newPermissionRoles.push(roleKey);
    } else {
      newPermissionRoles.splice(index, 1);
    }
    updateEducation({
      id: row._id,
      updates: { permissionRoles: newPermissionRoles },
    });
    toast.success(`${t("Role permissions updated successfully.")}`);
  }
  const columns = [{ key: t("Header"), isSortable: true }];
  const rowKeys = [
    {
      key: "header",
    },
  ];
  // Adding roles columns and rowkeys
  for (const role of roles) {
    columns.push({ key: role.name, isSortable: true });
    rowKeys.push({
      key: role._id,
      node: (row: any) => {
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
    } as any);
  }
  const isEnableEditDisabled = educationPageDisabledCondition?.actions?.some(
    (ac) => ac.action === ActionEnum.ENABLEEDIT &&
      user?.role?._id && !ac?.permissionsRoles?.includes(user?.role?._id)
  ) ?? false;

  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [educations, roles]);

  const filters = !isEnableEditDisabled ? [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ] : [];
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={educations}
          filters={filters}
          title={t("Education Permissions")}
          isActionsActive={false}
          isSearch={false}
        />
      </div>
    </>
  );
};

export default EducationPermissions;
