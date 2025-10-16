import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";

import { useGetActions } from "../../utils/api/panelControl/action";
import {
  useDisabledConditionMutations,
  useGetDisabledConditions,
} from "../../utils/api/panelControl/disabledCondition";
import { useGetAllUserRoles } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { CheckSwitch } from "../common/CheckSwitch";
import { Header } from "../header/Header";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";

const DisabledConditionActions = () => {
  const { t } = useTranslation();
  const { disabledConditionId } = useParams();
  const disabledConditions = useGetDisabledConditions();
  const actions = useGetActions();
  const roles = useGetAllUserRoles();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const { updateDisabledCondition } = useDisabledConditionMutations();
  const currentDisabledCondition = useMemo(
    () => disabledConditions?.find((dc) => dc._id === disabledConditionId),
    [disabledConditions, disabledConditionId]
  );
  function handleRolePermission(
    row: { action: string; permissionsRoles: number[] },
    roleId: number
  ) {
    if (!currentDisabledCondition?._id) return;
    const current = row.permissionsRoles ?? [];
    const has = current.includes(roleId);
    const updatedPerms = has
      ? current.filter((r) => r !== roleId)
      : [...current, roleId];

    const updatedActions =
      currentDisabledCondition.actions?.map((a) =>
        a.action === row.action ? { ...a, permissionsRoles: updatedPerms } : a
      ) ?? [];
    updateDisabledCondition({
      id: currentDisabledCondition._id,
      updates: { actions: updatedActions },
    });
    toast.success(t("Role permissions updated successfully."));
  }
  const columns = [{ key: t("Action Name"), isSortable: true }];
  const rowKeys = [
    {
      key: "action",
      node: (row: any) => <p>{getItem(row.action, actions)?.name ?? ""}</p>,
    },
  ];
  for (const role of roles ?? []) {
    columns.push({ key: role.name, isSortable: true });
    rowKeys.push({
      key: role._id.toString(),
      node: (row) => {
        const hasPermission = (row.permissionsRoles ?? []).includes(role._id);
        return isEnableEdit ? (
          <div>
            <CheckSwitch
              checked={hasPermission}
              onChange={() => handleRolePermission(row as any, role._id)}
            />
          </div>
        ) : hasPermission ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        );
      },
    });
  }
  const filters = [
    {
      label: t("Enable Edit"),
      isUpperSide: true,
      node: <SwitchButton checked={isEnableEdit} onChange={setIsEnableEdit} />,
    },
  ];
  useEffect(() => {
    setTableKey((k) => k + 1);
  }, [
    disabledConditions,
    currentDisabledCondition,
    disabledConditionId,
    roles,
    actions,
  ]);
  const rows =
    currentDisabledCondition?.actions
      ?.slice()
      .sort((a, b) => a.action.localeCompare(b.action)) ?? [];
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[95%] mx-auto my-10 ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          filters={filters}
          title={t("Disabled Condition Actions")}
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default DisabledConditionActions;
