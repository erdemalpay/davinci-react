import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useNavigate } from "react-router-dom";
import { useGeneralContext } from "../../context/General.context";
import { DisabledCondition } from "../../types";
import { useGetActions } from "../../utils/api/panelControl/action";
import {
  useDisabledConditionMutations,
  useGetDisabledConditions,
} from "../../utils/api/panelControl/disabledCondition";
import { useGetPanelControlPages } from "../../utils/api/panelControl/page";
import { useGetAllUserRoles } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { NameInput } from "../../utils/panelInputs";
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
  const [tableKey, setTableKey] = useState(0);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const {
    createDisabledCondition,
    updateDisabledCondition,
    deleteDisabledCondition,
  } = useDisabledConditionMutations();
  const allRows = disabledConditions.map((dc) => {
    const page = getItem(dc.page, pages);
    return {
      ...dc,
      pageName: page?.name || dc.page,
    };
  });

  const inputs = [
    NameInput({ required: true }),
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
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "page", type: FormKeyTypeEnum.STRING },
    { key: "actions", type: FormKeyTypeEnum.STRING },
  ];
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Page"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];

  const rowKeys = [
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
  ];

  const addButton = {
    name: t(`Add Disabled Condition`),
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
          submitItem={updateDisabledCondition as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,

      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
  ];

  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [disabledConditions, roles, componentActions]);

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
          rows={rows}
          filters={filters}
          title={t("Disabled Conditions")}
          isActionsActive={true}
          actions={actions}
          addButton={addButton}
          isSearch={false}
        />
      </div>
    </>
  );
};

export default DisabledConditions;
