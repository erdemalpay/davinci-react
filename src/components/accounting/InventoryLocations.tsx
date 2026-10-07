import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  InventoryLocation,
} from "../../types";
import {
  useGetInventoryLocations,
  useInventoryLocationMutations,
} from "../../utils/api/inventory";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import { getItem } from "../../utils/getItem";
import { isActionDisabled } from "../../utils/permissions";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const InventoryLocations = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const inventoryLocations = useGetInventoryLocations();
  const { createInventoryLocation, updateInventoryLocation } =
    useInventoryLocationMutations();
  const disabledConditions = useGetDisabledConditions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<InventoryLocation>();

  const disabledCondition = useMemo(
    () =>
      getItem(
        DisabledConditionEnum.ACCOUNTING_INVENTORYLOCATIONS,
        disabledConditions
      ),
    [disabledConditions]
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
      { key: t("Note"), isSortable: true },
      { key: t("Active"), isSortable: true },
      { key: t("Actions"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(() => {
    const isUpdateDisabled = isActionDisabled(
      disabledCondition,
      ActionEnum.UPDATE,
      user
    );
    return [
      {
        key: "name",
        className: "min-w-32 pr-1",
        node: (row: InventoryLocation) => (
          <div className="flex items-center gap-2">
            <div
              className="w-1 h-5 rounded-full flex-shrink-0"
              style={{ backgroundColor: row.backgroundColor }}
            />
            {row.name}
          </div>
        ),
      },
      { key: "note", className: "min-w-32 pr-1" },
      {
        key: "active",
        node: (row: InventoryLocation) => (
          <div
            className={isUpdateDisabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            <SwitchButton
              checked={row.active}
              onChange={() => {
                if (isUpdateDisabled) return;
                updateInventoryLocation({
                  id: row._id,
                  updates: { active: !row.active },
                });
              }}
            />
          </div>
        ),
      },
    ];
  }, [disabledCondition, user, updateInventoryLocation]);

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
        type: InputTypes.COLOR,
        formKey: "backgroundColor",
        label: t("Background Color"),
        placeholder: t("Background Color"),
        required: false,
      },
      {
        type: InputTypes.TEXT,
        formKey: "note",
        label: t("Note"),
        placeholder: t("Note"),
        required: false,
      },
    ],
    [t]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
      { key: "note", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Inventory Location"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createInventoryLocation as any}
          topClassName="flex flex-col gap-2 "
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
      isDisabled: isActionDisabled(disabledCondition, ActionEnum.ADD, user),
    }),
    [
      t,
      isAddModalOpen,
      inputs,
      formKeys,
      createInventoryLocation,
      disabledCondition,
      user,
    ]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl ",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={inputs}
            formKeys={formKeys}
            submitItem={updateInventoryLocation as any}
            isEditMode={true}
            topClassName="flex flex-col gap-2 "
            itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: isActionDisabled(
          disabledCondition,
          ActionEnum.UPDATE,
          user
        ),
      },
    ],
    [
      t,
      rowToAction,
      isEditModalOpen,
      inputs,
      formKeys,
      updateInventoryLocation,
      disabledCondition,
      user,
    ]
  );

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={inventoryLocations}
        title={t("Inventory Locations")}
        addButton={addButton}
        isActionsActive={true}
      />
    </div>
  );
};

export default InventoryLocations;
