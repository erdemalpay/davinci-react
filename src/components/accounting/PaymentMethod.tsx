import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useUserContext } from "../../context/User.context";
import { AccountPaymentMethod, RoleEnum } from "../../types";
import {
  useAccountPaymentMethodMutations,
  useGetAccountPaymentMethods,
} from "../../utils/api/account/paymentMethod";
import { NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const PaymentMethods = () => {
  const { t, i18n } = useTranslation();
  const paymentMethods = useGetAccountPaymentMethods();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<AccountPaymentMethod>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const {
    createAccountPaymentMethod,
    deleteAccountPaymentMethod,
    updateAccountPaymentMethod,
  } = useAccountPaymentMethodMutations();
  const allRows = paymentMethods?.map((paymentMethod) => {
    return {
      ...paymentMethod,
      isActionsDisabled: paymentMethod?.isConstant,
    };
  });
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Online Order"), isSortable: false },
    { key: t("Payment Made"), isSortable: false },
    { key: t("Used at Expense"), isSortable: false },
    { key: "Ikas ID", isSortable: false },
  ];
  if (
    user &&
    [
      RoleEnum.MANAGER,
      RoleEnum.OPERATIONSASISTANT,
      RoleEnum.GAMEMANAGER,
    ].includes(user?.role?._id)
  ) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
      node: (row: AccountPaymentMethod) => {
        return <p>{t(row.name)}</p>;
      },
    },
    {
      key: "isOnlineOrder",
      node: (row: any) =>
        row?.isOnlineOrder ? (
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    },
    {
      key: "isPaymentMade",
      node: (row: any) =>
        row?.isPaymentMade ? (
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    },
    {
      key: "isUsedAtExpense",
      node: (row: any) =>
        row?.isUsedAtExpense ? (
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    },
    { key: "ikasId" },
  ];
  const inputs = [
    NameInput(),
    {
      type: InputTypes.CHECKBOX,
      formKey: "isOnlineOrder",
      label: t("Online Order"),
      placeholder: t("Online Order"),
      required: true,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isPaymentMade",
      label: t("Payment Made"),
      placeholder: t("Payment Made"),
      required: true,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isUsedAtExpense",
      label: t("Used at Expense"),
      placeholder: t("Used at Expense"),
      required: true,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.TEXT,
      formKey: "ikasId",
      label: "Ikas ID",
      placeholder: "Ikas ID",
      required: false,
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "isOnlineOrder", type: FormKeyTypeEnum.BOOLEAN },
    { key: "isPaymentMade", type: FormKeyTypeEnum.BOOLEAN },
    { key: "isUsedAtExpense", type: FormKeyTypeEnum.BOOLEAN },
    { key: "ikasId", type: FormKeyTypeEnum.STRING },
  ];

  const addButton = {
    name: t(`Add Payment Method`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        constantValues={{ isPaymentMade: true, isOnlineOrder: false }}
        submitItem={createAccountPaymentMethod as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    isDisabled: user
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.OPERATIONSASISTANT,
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
            deleteAccountPaymentMethod(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Payment Method")}
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
            RoleEnum.OPERATIONSASISTANT,
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
          submitItem={updateAccountPaymentMethod as any}
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
            RoleEnum.OPERATIONSASISTANT,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [paymentMethods, i18n.language]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={rows}
          title={t("Payment Methods")}
          addButton={addButton}
          isActionsActive={
            user
              ? [
                  RoleEnum.MANAGER,
                  RoleEnum.OPERATIONSASISTANT,
                  RoleEnum.GAMEMANAGER,
                ].includes(user?.role?._id)
              : false
          }
        />
      </div>
    </>
  );
};

export default PaymentMethods;
