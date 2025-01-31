import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { TbIndentIncrease } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import { ChecklistType, RoleEnum } from "../../types";
import {
  useCheckMutations,
  useGetChecks,
} from "../../utils/api/checklist/check";
import {
  useChecklistMutations,
  useGetChecklists,
} from "../../utils/api/checklist/checklist";
import { useGetStoreLocations } from "../../utils/api/location";
import { NameInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import SwitchButton from "../panelComponents/common/SwitchButton";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import {
  FormKeyTypeEnum,
  InputTypes,
  RowKeyType,
} from "../panelComponents/shared/types";
import GenericTable from "../panelComponents/Tables/GenericTable";

const ChecklistsTab = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const checklists = useGetChecklists();
  const [tableKey, setTableKey] = useState(0);
  const locations = useGetStoreLocations();
  const [showInactiveChecklists, setShowInactiveChecklists] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [rowToAction, setRowToAction] = useState<ChecklistType>();
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const { createCheck } = useCheckMutations();
  const checks = useGetChecks();
  const [checkLocationForm, setCheckLocationForm] = useState({
    location: 0,
  });
  const checkLocationFormKeys = [
    { key: "location", type: FormKeyTypeEnum.STRING },
  ];
  const checkLocationInputs = [
    {
      type: InputTypes.SELECT,
      formKey: "location",
      label: t("Location"),
      options: (rowToAction
        ? locations.filter((lctn) => {
            return rowToAction?.locations?.includes(lctn._id);
          })
        : locations
      )?.map((input) => {
        return {
          value: input._id,
          label: input.name,
        };
      }),
      placeholder: t("Location"),
      required: true,
    },
  ];
  const { resetGeneralContext } = useGeneralContext();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createChecklist, deleteChecklist, updateChecklist } =
    useChecklistMutations();

  function handleLocationUpdate(item: ChecklistType, location: number) {
    const newLocations = item.locations || [];
    const index = newLocations.indexOf(location);
    if (index === -1) {
      newLocations.push(location);
    } else {
      newLocations.splice(index, 1);
    }
    updateChecklist({
      id: item._id,
      updates: { locations: newLocations },
    });
    toast.success(`${t("Checklist updated successfully")}`);
  }
  const columns = [{ key: t("Name"), isSortable: true }];
  const rowKeys: RowKeyType<ChecklistType>[] = [
    {
      key: "name",
      node: (row: ChecklistType) => (
        <p
          className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            resetGeneralContext();
            navigate(`/checklist/${row._id}`);
          }}
        >
          {row.name}
        </p>
      ),
    },
  ];

  // Adding location columns and rowkeys
  for (const location of locations) {
    columns.push({ key: location?.name, isSortable: true });
    rowKeys.push({
      key: String(location._id),
      node: (row: ChecklistType) =>
        isEnableEdit ? (
          <CheckSwitch
            checked={row?.locations?.includes(location._id)}
            onChange={() => handleLocationUpdate(row, location?._id)}
          />
        ) : row?.locations?.includes(location?._id) ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        ),
    });
  }
  columns.push({ key: t("Actions"), isSortable: false });
  const inputs = [NameInput()];
  const formKeys = [{ key: "name", type: FormKeyTypeEnum.STRING }];

  const addButton = {
    name: t(`Add Checklist`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => {
          setIsAddModalOpen(false);
        }}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createChecklist as any}
        topClassName="flex flex-col gap-2"
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isCloseAllConfirmationDialogOpen}
          close={() => {
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          confirm={() => {
            deleteChecklist(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Checklist")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled:
        user &&
        ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id),
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => {
            setIsEditModalOpen(false);
          }}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={updateChecklist as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2"
          submitFunction={() => {
            updateChecklist({
              id: rowToAction._id,
              updates: {
                name: rowToAction.name,
              },
            });
          }}
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              name: rowToAction.name,
            },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled:
        user &&
        ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id),
    },
    {
      name: t("Toggle Active"),
      isDisabled:
        !showInactiveChecklists ||
        (user &&
          ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(
            user.role._id
          )),
      isModal: false,
      isPath: false,
      icon: null,

      node: (row: any) => (
        <div className="mt-2">
          <CheckSwitch
            checked={row?.active}
            onChange={() =>
              updateChecklist({
                id: row._id,
                updates: {
                  active: !(row?.active ? row.active : false),
                },
              })
            }
          ></CheckSwitch>
        </div>
      ),
    },
    {
      name: t("Checkit"),
      icon: <TbIndentIncrease />,
      className: "cursor-pointer text-xl  ",
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isCheckModalOpen}
          close={() => setIsCheckModalOpen(false)}
          inputs={checkLocationInputs}
          formKeys={checkLocationFormKeys}
          submitItem={() => {}}
          submitFunction={async () => {
            if (checkLocationForm.location === 0 || !user) return;
            if (
              checks?.filter((item) => {
                return (
                  item.isCompleted === false &&
                  item.location === checkLocationForm.location &&
                  item.user === user._id &&
                  item.checklist === rowToAction._id
                );
              }).length > 0
            ) {
              resetGeneralContext();
              navigate(
                `/check/${checkLocationForm.location}/${rowToAction._id}`
              );
            } else {
              createCheck({
                location: checkLocationForm.location,
                checklist: rowToAction._id,
                isCompleted: false,
                createdAt: new Date(),
                user: user._id,
              });
              resetGeneralContext();
              navigate(
                `/check/${checkLocationForm.location}/${rowToAction._id}`
              );
            }
          }}
          setForm={setCheckLocationForm}
          isEditMode={false}
          topClassName="flex flex-col gap-2 "
          buttonName={t("Submit")}
        />
      ) : null,
      isModalOpen: isCheckModalOpen,
      setIsModal: setIsCheckModalOpen,
      isPath: false,
    },
  ];
  const filters = [
    {
      label: t("Show Inactive Checklists"),
      isDisabled:
        user &&
        ![RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id),
      isUpperSide: true,
      node: (
        <SwitchButton
          checked={showInactiveChecklists}
          onChange={setShowInactiveChecklists}
        />
      ),
    },
    {
      label: t("Location Edit"),
      isUpperSide: false,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  useEffect(
    () => setTableKey((prev) => prev + 1),
    [checklists, locations, showInactiveChecklists, checks]
  );

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={
            user &&
            [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id)
              ? filters
              : []
          }
          rows={
            showInactiveChecklists
              ? checklists
              : checklists?.filter((checklist) => checklist.active)
          }
          title={t("Checklists")}
          addButton={
            user &&
            [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER].includes(user.role._id)
              ? addButton
              : undefined
          }
        />
      </div>
    </>
  );
};

export default ChecklistsTab;
