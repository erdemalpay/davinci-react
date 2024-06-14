import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
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
  const { t } = useTranslation();
  const pages = useGetPanelControlPages();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { mutate: createMultiplePage } = useCreateMultiplePageMutation();
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
        return (
          <div className="flex items-center gap-2">
            <div>{t(row.name)}</div>
          </div>
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
      if (!pages.find((page) => page.name === route.name)) {
        missedRoutes.push({ name: route.name, permissionRoles: [1] });
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
          rows={pages}
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
