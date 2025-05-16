import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { Authorization } from "../../types";
import {
  useAuthorizationMutations,
  useGetAuthorizations,
} from "../../utils/api/authorization";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { useGetAllUserRoles } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

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
  const pages = useGetPanelControlPages();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Authorization>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { updateAuthorization, deleteAuthorization } =
    useAuthorizationMutations();
  const [filterPanelFormElements, setFilterPanelFormElements] =
    useState<FormElementsState>({
      method: "",
    });
  const [showFilters, setShowFilters] = useState(false);
  const allRows = authorizations?.filter((row: Authorization) => {
    if (filterPanelFormElements.method) {
      return row.method === filterPanelFormElements.method;
    }
    return true;
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
  const inputs = [
    {
      type: InputTypes.SELECT,
      formKey: "relatedPages",
      label: t("Related Pages"),
      options: pages.map((page) => {
        return {
          value: page._id,
          label: page.name,
        };
      }),
      isMultiple: true,
      placeholder: t("Related Pages"),
      required: false,
    },
  ];
  const formKeys = [{ key: "relatedPages", type: FormKeyTypeEnum.STRING }];
  function handleRolePermission(row: Authorization, roleKey: number) {
    const newPermissionRoles = row?.roles || [];
    const index = newPermissionRoles.indexOf(roleKey);
    if (index === -1) {
      newPermissionRoles.push(roleKey);
    } else {
      newPermissionRoles.splice(index, 1);
    }
    updateAuthorization({
      id: Number(row._id),
      updates: { roles: newPermissionRoles },
    });
    toast.success(`${t("Role permissions updated successfully.")}`);
  }
  function handleAllRolePermission(row: Authorization) {
    const hasAllRoles = roles.every((role) => row?.roles?.includes(role._id));
    const newPermissionRoles = hasAllRoles ? [] : roles.map((role) => role._id);

    updateAuthorization({
      id: Number(row._id),
      updates: { roles: newPermissionRoles },
    });
    toast.success(`${t("Role permissions updated successfully.")}`);
  }

  const columns = [
    { key: t("Method"), isSortable: true },
    { key: t("Path"), isSortable: true },
    { key: t("Related Pages"), isSortable: true },
    { key: t("All"), isSortable: false },
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
    {
      key: "relatedPages",
      node: (row: any) => {
        return (
          <div className="flex flex-col gap-2 min-w-32">
            {row?.relatedPages?.map((page: any, index: number) => {
              const foundPage = getItem(page, pages);
              return (
                <p key={index} className="text-gray-500">
                  {foundPage?.name}
                </p>
              );
            })}
          </div>
        );
      },
    },
    {
      key: "all",
      node: (row: any) => {
        // Check if every role is assigned to this row
        const hasAllRoles = roles.every((role) =>
          row?.roles?.includes(role._id)
        );
        return (
          <div className="flex flex-col gap-2 min-w-32">
            {isEnableEdit ? (
              <CheckSwitch
                checked={hasAllRoles}
                onChange={() => handleAllRolePermission(row)}
              />
            ) : hasAllRoles ? (
              <IoCheckmark className="text-blue-500 text-2xl" />
            ) : (
              <IoCloseOutline className="text-red-800 text-2xl" />
            )}
          </div>
        );
      },
    },
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
  columns.push({ key: t("Actions"), isSortable: false });
  const actions = [
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
          submitItem={updateAuthorization as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => setIsCloseAllConfirmationDialogOpen(false)}
          confirm={() => {
            deleteAuthorization(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Route Authorization")}
          text={`${rowToAction.path} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
    },
  ];
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
  }, [authorizations, roles, filterPanelFormElements, pages]);

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
          isActionsActive={true}
          actions={actions}
        />
      </div>
    </>
  );
};

export default RouteAuthorizationPermissions;
