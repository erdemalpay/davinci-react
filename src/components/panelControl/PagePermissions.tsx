import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { allRoutes } from "../../navigation/constants";
import { PanelControlPage, RoleEnum, RoleNameEnum } from "../../types";
import {
  useCreateMultiplePageMutation,
  useGetPanelControlPages,
  usePanelControlPageMutations,
} from "../../utils/api/panelControl/page";
import { NameInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import { FormKeyTypeEnum } from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

const PagePermissions = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const pages = useGetPanelControlPages();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { mutate: createMultiplePage } = useCreateMultiplePageMutation();
  const { setCurrentPage, setSortConfigKey, setSearchQuery } =
    useGeneralContext();
  const { createPanelControlPage, updatePanelControlPage } =
    usePanelControlPageMutations();
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
  const columns = [{ key: t("Page"), isSortable: true }];
  const rowKeys = [
    {
      key: "name",
      node: (row: any) => {
        return row.tabs.length > 0 ? (
          <p
            className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              setCurrentPage(1);
              // setRowsPerPage(RowPerPageEnum.FIRST);
              setSearchQuery("");
              setSortConfigKey(null);
              navigate(`/page-details/${row._id}`);
            }}
          >
            {row.name}
          </p>
        ) : (
          <p>{row.name}</p>
        );
      },
    },
  ];
  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];
  const addButton = {
    name: t(`Add Page`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createPanelControlPage as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
  };

  // Adding roles columns and rowkeys
  for (const roleKey of Object.keys(RoleEnum)) {
    const roleEnumKey = roleKey as keyof typeof RoleEnum;
    const roleName = RoleNameEnum[roleEnumKey];
    const roleValue = RoleEnum[roleEnumKey];

    if (roleName) {
      columns.push({ key: roleName, isSortable: true });
      rowKeys.push({
        key: roleKey,
        node: (row: any) => {
          const hasPermission = row?.permissionRoles?.includes(roleValue);
          return isEnableEdit ? (
            <CheckSwitch
              checked={hasPermission}
              onChange={() => handleRolePermission(row, roleValue)}
            />
          ) : hasPermission ? (
            <IoCheckmark className="text-blue-500 text-2xl" />
          ) : (
            <IoCloseOutline className="text-red-800 text-2xl" />
          );
        },
      });
    }
  }
  const fillMissingPages = () => {
    const missedRoutes = [];
    for (const route of allRoutes) {
      const currentPage = pages.find((page) => page.name === route.name);
      let isTabsSame = true;
      if (route.tabs) {
        for (const tab of route.tabs) {
          currentPage?.tabs?.find((pageTab) => pageTab.name === tab.label);
          if (
            !currentPage?.tabs?.find((pageTab) => pageTab.name === tab.label)
          ) {
            isTabsSame = false;
            break;
          }
        }
      }
      if (!currentPage || !isTabsSame) {
        missedRoutes.push({
          name: route.name,
          permissionRoles: [1],
          tabs: route?.tabs?.map((tab) => {
            return {
              name: tab.label,
              permissionRoles: [1],
            };
          }),
        });
      }
    }
    if (missedRoutes.length > 0) {
      createMultiplePage(missedRoutes);
    }
  };
  useEffect(() => {
    fillMissingPages();
    setTableKey((prev) => prev + 1);
  }, [pages]);

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
          rows={pages.sort((a, b) => a.name.localeCompare(b.name))}
          filters={filters}
          title={t("Page Permissions")}
          addButton={addButton}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default PagePermissions;
