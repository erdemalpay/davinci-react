import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { useUserContext } from "../../context/User.context";
import {
  ActionEnum,
  DisabledConditionEnum,
  StaffLeaveType,
} from "../../types";
import { UpdatePayload } from "../../utils/api";
import { useGetDisabledConditions } from "../../utils/api/panelControl/disabledCondition";
import {
  useGetStaffLeaveTypes,
  useStaffLeaveTypeMutations,
} from "../../utils/api/staffLeave";
import { getItem } from "../../utils/getItem";
import { BackgroundColorInput, NameInput } from "../../utils/panelInputs";
import { isActionDisabled } from "../../utils/permissions";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum } from "../panelComponents/shared/types";

const StaffLeaveTypes = () => {
  const { t } = useTranslation();
  const { user } = useUserContext();
  const staffLeaveTypes = useGetStaffLeaveTypes();
  const { createStaffLeaveType, updateStaffLeaveType } =
    useStaffLeaveTypeMutations();
  const disabledConditions = useGetDisabledConditions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<StaffLeaveType>();

  const disabledCondition = useMemo(
    () =>
      getItem(
        DisabledConditionEnum.ACCOUNTING_STAFFLEAVETYPES,
        disabledConditions
      ),
    [disabledConditions]
  );

  const columns = useMemo(
    () => [
      { key: t("Name"), isSortable: true },
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
        node: (row: StaffLeaveType) => (
          <div className="flex items-center gap-2">
            <div
              className="w-1 h-5 rounded-full flex-shrink-0"
              style={{ backgroundColor: row.backgroundColor }}
            />
            {row.name}
          </div>
        ),
      },
      {
        key: "active",
        node: (row: StaffLeaveType) => (
          <div
            className={isUpdateDisabled ? "opacity-50 cursor-not-allowed" : ""}
          >
            <SwitchButton
              checked={row.active}
              onChange={() => {
                if (isUpdateDisabled) return;
                updateStaffLeaveType({
                  id: row._id,
                  updates: { active: !row.active },
                });
              }}
            />
          </div>
        ),
      },
    ];
  }, [disabledCondition, user, updateStaffLeaveType]);

  const inputs = useMemo(
    () => [NameInput({ t }), BackgroundColorInput({ t })],
    [t]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "backgroundColor", type: FormKeyTypeEnum.COLOR },
    ],
    []
  );

  const addButton = useMemo(
    () => ({
      name: t("Add Staff Leave Type"),
      isModal: true,
      modal: (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => setIsAddModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={(item) =>
            createStaffLeaveType(item as Partial<StaffLeaveType>)
          }
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
      createStaffLeaveType,
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
            submitItem={(item) =>
              updateStaffLeaveType(item as UpdatePayload<StaffLeaveType>)
            }
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
      updateStaffLeaveType,
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
        rows={staffLeaveTypes}
        title={t("Staff Leave Types")}
        addButton={addButton}
        isActionsActive={true}
      />
    </div>
  );
};

export default StaffLeaveTypes;
