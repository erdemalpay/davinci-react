import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { Kitchen, RoleEnum } from "../../types";
import { useGetStoreLocations } from "../../utils/api/location";
import {
  useGetKitchens,
  useKitchenMutations,
} from "../../utils/api/menu/kitchen";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { useGetAllUserRoles, useGetUsers } from "../../utils/api/user";
import { NameInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const KitchenPage = () => {
  const { t } = useTranslation();
  const kitchens = useGetKitchens();
  const { user } = useUserContext();
  const users = useGetUsers();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetStoreLocations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const pages = useGetPanelControlPages();
  const roles = useGetAllUserRoles();
  const [rowToAction, setRowToAction] = useState<Kitchen>();
  const [isLocationEdit, setIsLocationEdit] = useState(false);
  const [isEnableSoundRole, setIsEnableSoundRole] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createKitchen, deleteKitchen, updateKitchen } = useKitchenMutations();
  function handleLocationUpdate(row: any, changedLocationId: number) {
    let newLocations: number[] = row?.locations;
    if (newLocations?.includes(changedLocationId)) {
      newLocations = newLocations.filter(
        (item) => item !== changedLocationId && item !== null
      );
    } else {
      newLocations.push(changedLocationId);
    }
    updateKitchen({
      id: row?._id,
      updates: { locations: newLocations },
    });
    toast.success(`${t("Kitchen location updated successfully")}`);
  }

  function handleRoleSoundPermission(row: any, roleKey: number) {
    const newSoundRoles = row?.soundRoles || [];
    const index = newSoundRoles.indexOf(roleKey);
    if (index === -1) {
      newSoundRoles.push(roleKey);
    } else {
      newSoundRoles.splice(index, 1);
    }
    updateKitchen({
      id: row._id,
      updates: { soundRoles: newSoundRoles },
    });
    toast.success(`${t("Role permissions updated successfully.")}`);
  }
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Confirmation Required"), isSortable: true },
    { key: t("Selected Users"), isSortable: true },
  ];

  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
    {
      key: "isConfirmationRequired",
      node: (row: any) =>
        row?.isConfirmationRequired ? (
          <IoCheckmark className={`text-blue-500 text-2xl  `} />
        ) : (
          <IoCloseOutline className={`text-red-800 text-2xl   `} />
        ),
    },
    {
      key: "selectedUsers",
      node: (row: any) => {
        const selectedUserNames = users
          ?.filter((user) => row?.selectedUsers?.includes(user._id))
          .map((user) => user.name)
          .join(", ");
        return <span className="whitespace-normal">{selectedUserNames}</span>;
      },
    },
  ];

  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)
  ) {
    if (isLocationEdit) {
      locations?.forEach((item) => {
        columns.push({ key: item.name, isSortable: true });
        rowKeys.push({
          key: String(item._id),
          node: (row: any) =>
            isLocationEdit ? (
              <CheckSwitch
                checked={row?.locations?.includes(item._id)}
                onChange={() => handleLocationUpdate(row, item._id)}
              />
            ) : row?.locations?.includes(item._id) ? (
              <IoCheckmark className="text-blue-500 text-2xl " />
            ) : (
              <IoCloseOutline className="text-red-800 text-2xl" />
            ),
        });
      });
    } else if (isEnableSoundRole && pages) {
      const kitchenTabs = pages.find((page) => page._id === "orders")?.tabs;
      if (!kitchenTabs) return <></>;
      for (const role of roles) {
        columns.push({ key: role.name, isSortable: true });
        rowKeys.push({
          key: role._id.toString(),
          node: (row: any) => {
            const hasPermission = kitchenTabs
              ?.find((tab) => tab.name === row.name)
              ?.permissionRoles?.includes(role._id);
            if (!hasPermission) return <></>;
            const isSoundPermission = row?.soundRoles?.includes(role._id);
            return isEnableSoundRole ? (
              <CheckSwitch
                checked={isSoundPermission ?? false}
                onChange={() => handleRoleSoundPermission(row, role._id)}
              />
            ) : isSoundPermission ? (
              <IoCheckmark className={`text-blue-500 text-2xl `} />
            ) : (
              <IoCloseOutline className={`text-red-800 text-2xl `} />
            );
          },
        });
      }
    }
  }
  columns.push({ key: t("Actions"), isSortable: false });

  const inputs = [
    NameInput(),
    {
      type: InputTypes.CHECKBOX,
      formKey: "isConfirmationRequired",
      label: t("Confirmation Required"),
      placeholder: t("Confirmation Required"),
      required: false,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "selectedUsers",
      label: t("Selected Users"),
      options: users?.map((user) => ({
        value: user._id,
        label: user.name,
      })),
      placeholder: t("Selected Users"),
      isMultiple: true,
      required: false,
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "isConfirmationRequired", type: FormKeyTypeEnum.BOOLEAN },
    { key: "selectedUsers", type: FormKeyTypeEnum.STRING },
  ];

  const addButton = {
    name: t(`Add Kitchen`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createKitchen as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    isDisabled: user
      ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)
      : true,
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
            deleteKitchen(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Kitchen")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id) &&
          !isLocationEdit
        : true,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl mr-auto",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateKitchen as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id) &&
          !isLocationEdit
        : true,
    },
  ];
  const filterDisableCondition =
    user && ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id);
  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: (
        <SwitchButton checked={isLocationEdit} onChange={setIsLocationEdit} />
      ),
      isDisabled: filterDisableCondition || isEnableSoundRole,
    },
    {
      label: t("Role Sound Edit"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={isEnableSoundRole}
          onChange={setIsEnableSoundRole}
        />
      ),
      isDisabled: filterDisableCondition || isLocationEdit,
    },
  ];
  useEffect(
    () => setTableKey((prev) => prev + 1),
    [
      kitchens,
      locations,
      pages,
      isLocationEdit,
      isEnableSoundRole,
      roles,
      users,
    ]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={kitchens}
          title={t("Kitchens")}
          addButton={addButton}
          filters={filters}
          isActionsActive={!filterDisableCondition}
        />
      </div>
    </>
  );
};

export default KitchenPage;
