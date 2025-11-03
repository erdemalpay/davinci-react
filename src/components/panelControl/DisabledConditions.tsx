import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledCondition,
  DisabledConditionEnum,
  FormElementsState,
} from "../../types";
import { useGetActions } from "../../utils/api/panelControl/action";
import {
  useDisabledConditionMutations,
  useGetDisabledConditions,
} from "../../utils/api/panelControl/disabledCondition";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { useGetAllUserRoles } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

export interface DisabledConditionRow extends DisabledCondition {
  pageName: string;
}

const DisabledConditions = () => {
  const { t } = useTranslation();
  const roles = useGetAllUserRoles();
  const componentActions = useGetActions();
  const [rowToAction, setRowToAction] = useState<DisabledCondition | null>(
    null
  );
  const { setCurrentPage, setSortConfigKey, setSearchQuery } =
    useGeneralContext();
  const navigate = useNavigate();
  const pages = useGetPanelControlPages();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const disabledConditions = useGetDisabledConditions();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const { user } = useUserContext();
  const {
    createDisabledCondition,
    updateDisabledCondition,
    deleteDisabledCondition,
  } = useDisabledConditionMutations();
  const [form, setForm] = useState<FormElementsState>({
    name: "",
    page: "",
    actions: [],
  });

  const disabledConditionsPageDisabledCondition = useMemo(() => {
    return getItem(
      DisabledConditionEnum.PANELCONTROL_DISABLEDCONDITIONS,
      disabledConditions
    );
  }, [disabledConditions]);

  const rows = useMemo(() => {
    return disabledConditions.map((dc) => {
      const page = getItem(dc.page, pages);
      return {
        ...dc,
        pageName: page?.name || dc.page,
      };
    });
  }, [disabledConditions, pages]);

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Name"),
        placeholder: t("Name"),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "page",
        label: t("Page"),
        placeholder: t("Page"),
        options: pages.map((p) => ({ value: p._id, label: p.name })),
        required: true,
      },
      {
        type: InputTypes.SELECT,
        formKey: "actions",
        label: t("Actions"),
        placeholder: t("Actions"),
        options: componentActions.map((a) => ({
          value: a._id,
          label: a.name,
        })),
        isMultiple: true,
        required: true,
      },
    ],
    [t, pages, componentActions]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "page", type: FormKeyTypeEnum.STRING },
      { key: "actions", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
      { key: t("Page"), isSortable: true },
      { key: t("Disabled Condition Actions"), isSortable: false },
      { key: t("Actions"), isSortable: true },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      {
        key: "name",
        node: (row: DisabledConditionRow) => {
          return row.actions.length > 0 ? (
            <p
              className="text-blue-700 w-fit cursor-pointer hover:text-blue-500 transition-transform"
              onClick={() => {
                setCurrentPage(1);
                setSearchQuery("");
                setSortConfigKey(null);
                navigate(`/disabled-condition/${row._id}`);
              }}
            >
              {t(row.name)}
            </p>
          ) : (
            <p>{t(row.name)}</p>
          );
        },
      },
      { key: "pageName" },
      {
        key: "actions",
        node: (row: DisabledConditionRow) => {
          return (
            <div className="flex flex-wrap gap-1">
              {row.actions.map((ac) => {
                const action = getItem(ac.action, componentActions);
                return action ? (
                  <span className="bg-gray-200 text-gray-800 text-sm font-medium px-2.5 py-0.5 rounded">
                    {action.name}
                  </span>
                ) : null;
              })}
            </div>
          );
        },
      },
    ],
    [
      t,
      setCurrentPage,
      setSearchQuery,
      setSortConfigKey,
      navigate,
      componentActions,
    ]
  );

  const addButton = useMemo(
    () => ({
      name: t(`Add Disabled Condition`),
      isDisabled:
        disabledConditionsPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.ADD &&
            user?.role?._id &&
            !ac?.permissionsRoles?.includes(user?.role?._id)
        ) ?? false,
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createDisabledCondition as any}
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    }),
    [
      t,
      disabledConditionsPageDisabledCondition,
      user,
      isAddModalOpen,
      inputs,
      formKeys,
      createDisabledCondition,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Delete"),
        isDisabled:
          disabledConditionsPageDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.DELETE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ) ?? false,
        icon: <HiOutlineTrash />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <ConfirmationDialog
            isOpen={isCloseAllConfirmationDialogOpen}
            close={() => setIsCloseAllConfirmationDialogOpen(false)}
            confirm={() => {
              deleteDisabledCondition(rowToAction?._id);
              setIsCloseAllConfirmationDialogOpen(false);
            }}
            title={t("Delete Disabled Condition")}
            text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
          />
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen,
        setIsModal: setIsCloseAllConfirmationDialogOpen,
        isPath: false,
      },
      {
        name: t("Edit"),
        isDisabled:
          disabledConditionsPageDisabledCondition?.actions?.some(
            (ac) =>
              ac.action === ActionEnum.UPDATE &&
              user?.role?._id &&
              !ac?.permissionsRoles?.includes(user?.role?._id)
          ) ?? false,
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
            setForm={setForm}
            submitItem={updateDisabledCondition as any}
            isEditMode={false}
            constantValues={{
              ...rowToAction,
              actions: rowToAction.actions.map((a) => a.action),
            }}
            submitFunction={() => {
              updateDisabledCondition({
                id: rowToAction._id,
                updates: {
                  ...form,
                  actions: form.actions.map((actionId: string) => ({
                    action: actionId,
                    permissionsRoles:
                      rowToAction.actions.find((ac) => ac.action === actionId)
                        ?.permissionsRoles || [],
                  })),
                },
              });
            }}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
      },
    ],
    [
      t,
      disabledConditionsPageDisabledCondition,
      user,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      deleteDisabledCondition,
      isEditModalOpen,
      inputs,
      formKeys,
      form,
      updateDisabledCondition,
    ]
  );

  const isEnableEditDisabled = useMemo(() => {
    return (
      disabledConditionsPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ENABLEEDIT &&
          user?.role?._id &&
          !ac?.permissionsRoles?.includes(user?.role?._id)
      ) ?? false
    );
  }, [disabledConditionsPageDisabledCondition, user]);

  const filters = useMemo(() => {
    return !isEnableEditDisabled
      ? [
          {
            label: t("Enable Edit"),
            isUpperSide: true,
            node: (
              <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />
            ),
          },
        ]
      : [];
  }, [t, isEnableEditDisabled, isEnableEdit]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          title={t("Disabled Conditions")}
          isActionsActive={isEnableEdit}
          actions={actions}
          addButton={addButton}
          isSearch={false}
        />
      </div>
    </>
  );
};

export default DisabledConditions;
