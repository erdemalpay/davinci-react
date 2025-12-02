import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import {
  useGetPanelControlPages,
  usePanelControlPageMutations,
} from "../../utils/api/panelControl/page";
import { useGetAllUserRoles } from "../../utils/api/user";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
const PageTabPermissions = () => {
  const { t } = useTranslation();
  const { pageDetailsId } = useParams();
  const pages = useGetPanelControlPages();
  const roles = useGetAllUserRoles();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const currentPage = pages?.find((page) => page._id === pageDetailsId);
  const [tableKey, setTableKey] = useState(0);
  const { updatePanelControlPage } = usePanelControlPageMutations();
  function handleRolePermission(row: any, roleKey: number) {
    const newPermissionRoles = row?.permissionRoles || [];
    const index = newPermissionRoles.indexOf(roleKey);
    if (index === -1) {
      newPermissionRoles.push(roleKey);
    } else {
      newPermissionRoles.splice(index, 1);
    }
    const otherTabs =
      currentPage?.tabs?.filter((tab) => tab.name !== row.name) ?? [];
    if (!pageDetailsId) return;
    updatePanelControlPage({
      id: pageDetailsId,
      updates: {
        tabs: [
          ...otherTabs,
          { name: row.name, permissionRoles: newPermissionRoles },
        ],
      },
    });
    toast.success(`${t("Role permissions updated successfully.")}`);
  }
  const columns = [{ key: t("Tab"), isSortable: true }];
  const rowKeys = [
    {
      key: "name",
      node: (row: any) => {
        return <p>{t(row.name)}</p>;
      },
    },
  ];
  for (const role of roles) {
    if (currentPage?.permissionRoles?.includes(role._id)) {
      columns.push({ key: role.name, isSortable: true });
      rowKeys.push({
        key: role._id.toString(),
        node: (row: any) => {
          const hasPermission = row?.permissionRoles?.includes(role._id);
          return isEnableEdit ? (
            <div>
              <CheckSwitch
                checked={hasPermission}
                onChange={() => {
                  handleRolePermission(row, role._id);
                }}
              />
            </div>
          ) : hasPermission ? (
            <IoCheckmark className={`text-blue-500 text-2xl `} />
          ) : (
            <IoCloseOutline className={`text-red-800 text-2xl `} />
          );
        },
      });
    }
  }
  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  useEffect(() => {
    setTableKey((prevKey) => prevKey + 1);
  }, [pages, currentPage, pageDetailsId, roles]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={
            currentPage?.tabs?.sort((a, b) => a.name.localeCompare(b.name)) ??
            []
          }
          filters={filters}
          title={t("Page Tab Permissions")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default PageTabPermissions;
