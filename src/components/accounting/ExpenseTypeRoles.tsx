import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useGeneralContext } from "../../context/General.context";
import { AccountingPageTabEnum } from "../../types";
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

type PageRow = { key: string; label: string };

const EXPENSE_TYPE_PAGES: PageRow[] = [
  { key: "product", label: "Products" },
  { key: "service", label: "Services" },
  { key: "expense", label: "Expenses" },
  { key: "vendor-expense", label: "Vendor Expenses" },
];

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

  function handleRoleToggle(pageKey: string, roleId: number) {
    if (!currentExpenseType?._id) return;
    const currentPerms = currentExpenseType.pagePermissions ?? [];
    const pageIndex = currentPerms.findIndex((p) => p.page === pageKey);
    let updatedPerms;
    if (pageIndex === -1) {
      // No entry yet for this page → create one with this role
      updatedPerms = [...currentPerms, { page: pageKey, allowedRoles: [roleId] }];
    } else {
      const existing = currentPerms[pageIndex];
      const hasRole = existing.allowedRoles.includes(roleId);
      const updatedAllowedRoles = hasRole
        ? existing.allowedRoles.filter((r) => r !== roleId)
        : [...existing.allowedRoles, roleId];
      updatedPerms = currentPerms.map((p) =>
        p.page === pageKey ? { ...p, allowedRoles: updatedAllowedRoles } : p
      );
    }
    updateAccountExpenseType({
      id: currentExpenseType._id,
      updates: { pagePermissions: updatedPerms },
    });
    toast.success(t("Role permissions updated successfully."));
  }

  // columns: first col = page name, rest = one per role
  const columns = [{ key: t("Page"), isSortable: false }];
  const rowKeys: { key: string; node?: (row: PageRow) => JSX.Element }[] = [
    {
      key: "label",
      node: (row: PageRow) => (
        <p className="font-medium text-gray-700">{t(row.label)}</p>
      ),
    },
  ];

  for (const role of roles ?? []) {
    columns.push({ key: role.name, isSortable: false });
    rowKeys.push({
      key: role._id.toString(),
      node: (row: PageRow) => {
        const pagePerm = (currentExpenseType?.pagePermissions ?? []).find(
          (p) => p.page === row.key
        );
        const hasPermission = pagePerm?.allowedRoles?.includes(role._id) ?? false;
        return isEnableEdit ? (
          <div>
            <CheckSwitch
              checked={hasPermission}
              onChange={() => handleRoleToggle(row.key, role._id)}
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
          rows={EXPENSE_TYPE_PAGES}
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
