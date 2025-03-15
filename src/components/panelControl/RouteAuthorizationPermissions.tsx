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
import { InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
export function methodBgColor(method: string): string {
  switch (method.toUpperCase()) {
    case "GET":
      return "#4CAF50";
    case "POST":
      return "#2196F3";
    case "PUT":
      return "#FF9800";
    case "DELETE":
      return "#F44336";
    case "PATCH":
      return "#9C27B0";
    case "OPTIONS":
      return "#607D8B";
    default:
      return "#BDBDBD";
  }
}
const RouteAuthorizationPermissions = () => {
  const { t } = useTranslation();
  const roles = useGetAllUserRoles();
  const authorizations = useGetAuthorizations();
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      method: "",
    });
  const [showFilters, setShowFilters] = useState(false);
  const allRows = authorizations?.filter((row: Authorization) => {
    const method = filterPanelFormElements.method;
    return method ? row.method === method : true;
  });
  const [rows, setRows] = useState(allRows);
  const methodOptions = [
    { value: "GET", label: "GET" },
    { value: "POST", label: "POST" },
    { value: "PUT", label: "PUT" },
    { value: "DELETE", label: "DELETE" },
    { value: "PATCH", label: "PATCH" },
    { value: "OPTIONS", label: "OPTIONS" },
  ];
  const filterPanelInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "method",
      label: t("Method"),
      options: methodOptions,
      placeholder: t("Method"),
      required: true,
    },
  ];
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
  const rowKeys = [
    {
      key: "method",
      node: (row: any) => {
        return (
          <div className=" min-w-32">
            <p
              className="w-fit rounded-md text-sm ml-2 px-2 py-1 font-semibold text-white"
              style={{
                backgroundColor: methodBgColor(row?.method),
              }}
            >
              {row?.method}
            </p>
          </div>
        );
      },
    },
    { key: "path" },
  ];
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
  const filterPanel = {
    isFilterPanelActive: showFilters,
    inputs: filterPanelInputs,
    formElements: filterPanelFormElements,
    setFormElements: setFilterPanelFormElements,
    closeFilters: () => setShowFilters(false),
  };
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [authorizations, roles, filterPanelFormElements]);

  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
    {
      label: t("Show Filters"),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showFilters}
          onChange={() => {
            setShowFilters(!showFilters);
          }}
        />
      ),
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
          filterPanel={filterPanel}
          title={t("Route Authorization Permissions")}
          isActionsActive={false}
          isSearch={false}
        />
      </div>
    </>
  );
};

export default RouteAuthorizationPermissions;
