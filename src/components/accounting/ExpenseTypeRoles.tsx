import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { AccountExpenseType, AccountingPageTabEnum } from "../../types";
import {
  useAccountExpenseTypeMutations,
  useGetAccountExpenseTypes,
} from "../../utils/api/account/expenseType";
import { useGetAllUserRoles } from "../../utils/api/user";
import { CheckSwitch } from "../common/CheckSwitch";
import { Header } from "../header/Header";
import { Routes } from "../../navigation/constants";
import PageNavigator from "../panelComponents/PageNavigator/PageNavigator";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";

const ExpenseTypeRoles = () => {
  const { t } = useTranslation();
  const { expenseTypeId } = useParams();
  const expenseTypes = useGetAccountExpenseTypes();
  const roles = useGetAllUserRoles();
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [tableKey, setTableKey] = useState(0);
  const { updateAccountExpenseType } = useAccountExpenseTypeMutations();
  const {
    setAccountingActiveTab,
    setCurrentPage,
    setSortConfigKey,
    setSearchQuery,
  } = useGeneralContext();

  const currentExpenseType = useMemo(
    () => expenseTypes.find((et) => et._id === expenseTypeId),
    [expenseTypes, expenseTypeId]
  );

  function handleRoleToggle(roleId: number) {
    if (!currentExpenseType?._id) return;
    const current = currentExpenseType.allowedRoles ?? [];
    const has = current.includes(roleId);
    const updatedRoles = has
      ? current.filter((r) => r !== roleId)
      : [...current, roleId];

    updateAccountExpenseType({
      id: currentExpenseType._id,
      updates: { allowedRoles: updatedRoles },
    });
    toast.success(t("Role permissions updated successfully."));
  }

  // columns: first col = expense type name, rest = one column per role
  const columns = [{ key: t("Expense Type"), isSortable: false }];
  // rowKeys: first cell = styled name badge, rest = checkmark/switch per role
  const rowKeys: { key: string; node?: (row: AccountExpenseType) => JSX.Element }[] = [
    {
      key: "name",
      node: (row: AccountExpenseType) => (
        <div
          className="px-2 py-1 rounded-md w-fit text-white text-sm font-semibold"
          style={{ backgroundColor: row.backgroundColor }}
        >
          {row.name}
        </div>
      ),
    },
  ];

  for (const role of roles ?? []) {
    columns.push({ key: role.name, isSortable: false });
    rowKeys.push({
      key: role._id.toString(),
      node: (row: AccountExpenseType) => {
        const hasPermission = (row.allowedRoles ?? []).includes(role._id);
        return isEnableEdit ? (
          <div>
            <CheckSwitch
              checked={hasPermission}
              onChange={() => handleRoleToggle(role._id)}
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

  const pageNavigations = [
    {
      name: t("Expense Types"),
      path: Routes.Accounting,
      canBeClicked: true,
      additionalSubmitFunction: () => {
        setCurrentPage(1);
        setAccountingActiveTab(AccountingPageTabEnum.EXPENSETYPE);
        setSortConfigKey(null);
        setSearchQuery("");
      },
    },
    {
      name: currentExpenseType?.name ?? t("Expense Type Roles"),
      path: "",
      canBeClicked: false,
    },
  ];

  // Single row: the expense type itself
  const rows = currentExpenseType ? [currentExpenseType] : [];

  useEffect(() => {
    setTableKey((k) => k + 1);
  }, [expenseTypes, currentExpenseType, expenseTypeId, roles, isEnableEdit]);

  return (
    <>
      <Header showLocationSelector={false} />
      <PageNavigator navigations={pageNavigations} />
      <div className="w-[95%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys as any}
          columns={columns}
          rows={rows}
          filters={filters}
          title={
            currentExpenseType
              ? `${currentExpenseType.name} - ${t("Role Permissions")}`
              : t("Role Permissions")
          }
          isActionsActive={false}
        />
      </div>
    </>
  );
};

export default ExpenseTypeRoles;
