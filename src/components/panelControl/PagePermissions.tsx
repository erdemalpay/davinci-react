import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { allRoutes } from "../../navigation/constants";
import { PanelControlPage } from "../../types";
import {
  useCreateMultiplePageMutation,
  useGetPanelControlPages,
  usePanelControlPageMutations,
} from "../../utils/api/panelControl/page";
import { useGetAllUserRoles } from "../../utils/api/user";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";

const PagePermissions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const roles = useGetAllUserRoles();
  const pages = useGetPanelControlPages();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { mutate: createMultiplePage } = useCreateMultiplePageMutation();
  const { setCurrentPage, setSortConfigKey, setSearchQuery } =
    useGeneralContext();
  const { updatePanelControlPage } = usePanelControlPageMutations();

  function handleRolePermission(row: PanelControlPage, roleKey: number) {
    const newPermissionRoles = row?.permissionRoles || [];
    const index = newPermissionRoles.indexOf(roleKey);
    if (index === -1) {
      newPermissionRoles.push(roleKey);
    } else {
      newPermissionRoles.splice(index, 1);
    }
    updatePanelControlPage({
      id: row._id,
      updates: { permissionRoles: newPermissionRoles },
    });
    toast.success(`${t("Role permissions updated successfully.")}`);
  }

  const fillMissingPages = useMemo(() => {
    const missedRoutes = [];
    for (const route of allRoutes) {
      if (route?.children) {
        continue;
      }
      const currentPage = pages.find((page) => page.name === route.name);
      const routeTabs = route?.tabs;
      const isAllTabsSame =
        routeTabs?.every((tab) => {
          return currentPage?.tabs?.find((t) => t.name === tab.label);
        }) ?? true;
      if (!currentPage || !isAllTabsSame) {
        missedRoutes.push({
          name: route.name,
          permissionRoles: currentPage?.permissionRoles ?? [1],
          tabs: routeTabs?.map((tab) => {
            return {
              name: tab.label,
              permissionRoles: currentPage?.tabs?.find(
                (t) => t.name === tab.label
              )?.permissionRoles ?? [1],
            };
          }),
        });
      }
    }
    if (missedRoutes.length > 0) {
      createMultiplePage(missedRoutes);
    }
    return missedRoutes;
  }, [pages, createMultiplePage]);

  const { columns, rowKeys } = useMemo(() => {
    const cols = [{ key: t("Page"), isSortable: true }];
    const keys = [
      {
        key: "name",
        node: (row: any) => {
          return row.tabs.length > 0 ? (
            <p
              className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
              onClick={() => {
                setCurrentPage(1);
                setSearchQuery("");
                setSortConfigKey(null);
                navigate(`/page-details/${row._id}`);
              }}
            >
              {t(row.name)}
            </p>
          ) : (
            <p>{t(row.name)}</p>
          );
        },
      },
    ];

    // Adding roles columns and rowkeys
    for (const role of roles) {
      cols.push({ key: role.name, isSortable: true });
      keys.push({
        key: role._id.toString(),
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
      });
    }

    return { columns: cols, rowKeys: keys };
  }, [
    t,
    roles,
    isEnableEdit,
    setCurrentPage,
    setSearchQuery,
    setSortConfigKey,
    navigate,
    updatePanelControlPage,
  ]);

  const filters = useMemo(
    () => [
      {
        label: t("Enable Edit"),
        isUpperSide: true,
        node: (
          <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />
        ),
      },
    ],
    [t, isEnableEdit]
  );

  const sortedPages = useMemo(() => {
    return pages.sort((a, b) => a.name.localeCompare(b.name));
  }, [pages]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={sortedPages}
          filters={filters}
          title={t("Page Permissions")}
          isActionsActive={false}
          isSearch={false}
        />
      </div>
    </>
  );
};

export default PagePermissions;
