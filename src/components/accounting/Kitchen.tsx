import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { useUserContext } from "../../context/User.context";
import { Kitchen, RoleEnum } from "../../types";
import { useGetLocations } from "../../utils/api/location";
import {
  useGetKitchens,
  useKitchenMutations,
} from "../../utils/api/menu/kitchen";
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
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetLocations();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<Kitchen>();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
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

  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Confirmation Required"), isSortable: true },
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
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    },
  ];

  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER, RoleEnum.GAMEMANAGER].includes(
      user?.role?._id
    )
  ) {
    locations?.forEach((item) => {
      columns.push({ key: item.name, isSortable: true });
      rowKeys.push({
        key: String(item._id),
        node: (row: any) =>
          isEnableEdit ? (
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
    columns.push({ key: t("Actions"), isSortable: false });
  }
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
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "isConfirmationRequired", type: FormKeyTypeEnum.BOOLEAN },
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
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id)
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
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
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
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  const filters = [
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
      isDisabled:
        user &&
        ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id),
    },
  ];
  useEffect(() => setTableKey((prev) => prev + 1), [kitchens, locations]);

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
          isActionsActive={
            user
              ? [
                  RoleEnum.MANAGER,
                  RoleEnum.CATERINGMANAGER,
                  RoleEnum.GAMEMANAGER,
                ].includes(user?.role?._id)
              : false
          }
        />
      </div>
    </>
  );
};

export default KitchenPage;
