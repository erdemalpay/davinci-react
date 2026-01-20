import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { TbIndentIncrease } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  ChecklistType,
  DisabledConditionEnum,
} from "../../types";
import {
  useCheckMutations,
  useGetChecks,
} from "../../utils/api/checklist/check";
import {
  useChecklistMutations,
  useGetChecklists,
} from "../../utils/api/checklist/checklist";
import { useGetStoreLocations } from "../../utils/api/location";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
  RowKeyType,
} from "../panelComponents/shared/types";

const ChecklistsTab = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const navigate = useNavigate();
  const checklists = useGetChecklists();
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
  const { resetGeneralContext } = useGeneralContext();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createChecklist, deleteChecklist, updateChecklist } =
    useChecklistMutations();
  const disabledConditions = useGetDisabledConditions();

  const checklistsPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.CHECKLISTS_CHECKLISTS,
      disabledConditions
    );
  }, [disabledConditions]);

  const isActionDisabled = useCallback(
    (actionType: ActionEnum) => {
      if (!user?.role?._id) {
        return true;
      }

      const action = checklistsPageDisabledCondition?.actions?.find(
        (ac) => ac.action === actionType
      );
      if (!action) {
        return false;
      }
      return !action.permissionsRoles?.includes(user.role._id);
    },
    [checklistsPageDisabledCondition, user]
  );

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

  const { columns, rowKeys } = useMemo(() => {
    const cols = [{ key: t("Name"), isSortable: true }];
    const keys: RowKeyType<ChecklistType>[] = [
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
      cols.push({ key: location?.name, isSortable: true });
      keys.push({
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
    cols.push({ key: t("Actions"), isSortable: false });

    return { columns: cols, rowKeys: keys };
  }, [
    t,
    locations,
    isEnableEdit,
    resetGeneralContext,
    navigate,
    updateChecklist,
  ]);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
    ],
    [t]
  );

  const formKeys = useMemo(
    () => [{ key: "name", type: FormKeyTypeEnum.STRING }],
    []
  );

  const checkLocationFormKeys = useMemo(
    () => [{ key: "location", type: FormKeyTypeEnum.STRING }],
    []
  );

  const checkLocationInputs = useMemo(
    () => [
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
    ],
    [t, rowToAction, locations]
  );

  const addButton = useMemo(
    () => ({
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
      isDisabled: isActionDisabled(ActionEnum.ADD),
    }),
    [t, isAddModalOpen, inputs, formKeys, createChecklist, isActionDisabled]
  );

  const actions = useMemo(
    () => [
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
        isDisabled: isActionDisabled(ActionEnum.DELETE),
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
        isDisabled: isActionDisabled(ActionEnum.UPDATE),
      },
      {
        name: t("Toggle Active"),
        isDisabled: isActionDisabled(ActionEnum.TOGGLE),
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
        isDisabled: isActionDisabled(ActionEnum.CHECK),
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isCheckModalOpen}
            close={() => setIsCheckModalOpen(false)}
            inputs={checkLocationInputs}
            formKeys={checkLocationFormKeys}
            // eslint-disable-next-line
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
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteChecklist,
      isActionDisabled,
      isEditModalOpen,
      inputs,
      formKeys,
      updateChecklist,
      isCheckModalOpen,
      checkLocationInputs,
      checkLocationFormKeys,
      checks,
      user,
      resetGeneralContext,
      navigate,
      createCheck,
      checkLocationForm,
    ]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Inactive Checklists"),
        isDisabled: isActionDisabled(ActionEnum.SHOW_INACTIVE_ELEMENTS),
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
        isDisabled: isActionDisabled(ActionEnum.UPDATE_LOCATION),
        isUpperSide: false,
        node: (
          <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />
        ),
      },
    ],
    [t, isActionDisabled, showInactiveChecklists, isEnableEdit]
  );

  const filteredRows = useMemo(() => {
    return showInactiveChecklists
      ? checklists
      : checklists?.filter((checklist) => checklist.active);
  }, [showInactiveChecklists, checklists]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={filters}
          rows={filteredRows}
          title={t("Checklists")}
          addButton={addButton}
        />
      </div>
    </>
  );
};

export default ChecklistsTab;
