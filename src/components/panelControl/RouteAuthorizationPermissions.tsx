import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { Authorization } from "../../types";
import {
  useAuthorizationMutations,
  useGetAuthorizations,
} from "../../utils/api/authorization";
import { useGetAllUserRoles } from "../../utils/api/user";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";

const RouteAuthorizationPermissions = () => {
  const { t } = useTranslation();
  const roles = useGetAllUserRoles();
  const authorizations = useGetAuthorizations();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { updateAuthorization } = useAuthorizationMutations();
  function handleRolePermission(row: Authorization, roleKey: number) {
    const newPermissionRoles = row?.roles || [];
    const index = newPermissionRoles.indexOf(roleKey);
    if (index === -1) {
      newPermissionRoles.push(roleKey);
    } else {
      newPermissionRoles.splice(index, 1);
    }
    updateAuthorization({
      id: row._id,
      updates: { roles: newPermissionRoles },
    });
    toast.success(`${t("Role permissions updated successfully.")}`);
  }
  const columns = [
    { key: t("Method"), isSortable: true },
    { key: t("Path"), isSortable: true },
  ];
  const rowKeys = [{ key: "method" }, { key: "path" }];
  // Adding roles columns and rowkeys
  for (const role of roles) {
    columns.push({ key: role.name, isSortable: true });
    rowKeys.push({
      key: role._id.toString(),
      node: (row: any) => {
        const hasPermission = row?.roles?.includes(role._id);
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

  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [authorizations, roles]);

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
          rows={authorizations}
          filters={filters}
          title={t("Route Authorization Permissions")}
          isActionsActive={false}
          isSearch={false}
        />
      </div>
    </>
  );
};

export default RouteAuthorizationPermissions;
