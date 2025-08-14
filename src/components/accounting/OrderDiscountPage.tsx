import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { useUserContext } from "../../context/User.context";
import { OrderDiscount, OrderDiscountStatus, RoleEnum } from "../../types";
import {
  useGetOrderDiscounts,
  useOrderDiscountMutations,
} from "../../utils/api/order/orderDiscount";
import { NameInput } from "../../utils/panelInputs";
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = {
  [key: string]: any;
};
enum DiscountTypeEnum {
  PERCENTAGE = "PERCENTAGE",
  AMOUNT = "AMOUNT",
}
const OrderDiscountPage = () => {
  const { t } = useTranslation();
  const orderDiscounts = useGetOrderDiscounts();
  const { user } = useUserContext();
  const [tableKey, setTableKey] = useState(0);
  const [showInactiveDiscounts, setShowInactiveDiscounts] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<OrderDiscount>();
  const userCondition =
    (user &&
      [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)) ??
    false;
  const [form, setForm] = useState<FormElementsState>({
    name: "",
    type: "",
    percentage: "",
    amount: "",
    isOnlineOrder: "",
    isStoreOrder: "",
    isNoteRequired: "",
    note: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createOrderDiscount, updateOrderDiscount } =
    useOrderDiscountMutations();

  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Percentage"), isSortable: true },
    { key: t("Amount"), isSortable: true },
    { key: t("Online Order"), isSortable: false },
    { key: t("Store Order"), isSortable: false },
    { key: t("Note Required"), isSortable: false },
    { key: t("Note Placeholder"), isSortable: false },
  ];
  if (userCondition) {
    columns.push({ key: t("Actions"), isSortable: false });
  }
  const rowKeys = [
    {
      key: "name",
      className: "min-w-32 pr-1",
    },
    {
      key: "percentage",
      className: "min-w-32 pr-1",
    },
    {
      key: "amount",
      className: "min-w-32 pr-1",
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
      key: "isStoreOrder",
      node: (row: any) =>
        row?.isStoreOrder ? (
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    },
    {
      key: "isNoteRequired",
      node: (row: any) =>
        row?.isNoteRequired ? (
          <IoCheckmark className="text-blue-500 text-2xl " />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl " />
        ),
    },
    {
      key: "note",
      className: "min-w-32 pr-1",
    },
  ];
  const inputs = [
    NameInput(),
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Type"),
      placeholder: t("Type"),
      options: [
        {
          value: DiscountTypeEnum.PERCENTAGE,
          label: t("Percentage"),
        },
        {
          value: DiscountTypeEnum.AMOUNT,
          label: t("Amount"),
        },
      ],
      required: true,
      invalidateKeys: [
        { key: "percentage", defaultValue: "" },
        { key: "amount", defaultValue: "" },
      ],
    },
    {
      type: InputTypes.NUMBER,
      formKey: "percentage",
      label: t("Percentage"),
      placeholder: t("Percentage"),
      required: form.type === DiscountTypeEnum.PERCENTAGE,
      isDisabled: form.type !== DiscountTypeEnum.PERCENTAGE,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "amount",
      label: t("Amount"),
      placeholder: t("Amount"),
      required: form.type === DiscountTypeEnum.AMOUNT,
      isDisabled: form.type !== DiscountTypeEnum.AMOUNT,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isOnlineOrder",
      label: t("Online Order"),
      placeholder: t("Online Order"),
      required: false,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isStoreOrder",
      label: t("Store Order"),
      placeholder: t("Store Order"),
      required: false,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isNoteRequired",
      label: t("Note Required"),
      placeholder: t("Note Required"),
      required: false,
      isTopFlexRow: true,
    },
    {
      type: InputTypes.TEXT,
      formKey: "note",
      label: t("Note Placeholder"),
      placeholder: t("Note Placeholder"),
      required: false,
    },
  ];

  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "type", type: FormKeyTypeEnum.STRING },
    { key: "percentage", type: FormKeyTypeEnum.NUMBER },
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
    { key: "isOnlineOrder", type: FormKeyTypeEnum.BOOLEAN },
    { key: "isStoreOrder", type: FormKeyTypeEnum.BOOLEAN },
    { key: "isNoteRequired", type: FormKeyTypeEnum.BOOLEAN },
    { key: "note", type: FormKeyTypeEnum.STRING },
  ];

  const addButton = {
    name: t(`Add Discount`),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        setForm={setForm}
        submitItem={createOrderDiscount as any}
        topClassName="flex flex-col gap-2 "
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    isDisabled: user
      ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)
      : true,
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
            updateOrderDiscount({
              id: rowToAction._id,
              updates: {
                status: OrderDiscountStatus.DELETED,
              },
            });
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Discount")}
          text={`${rowToAction.name} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ml-auto ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)
        : true,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: `text-blue-500 cursor-pointer text-xl ${
        !showInactiveDiscounts ? "mr-auto" : ""
      }`,
      isModal: true,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => setIsEditModalOpen(false)}
          inputs={inputs}
          formKeys={formKeys}
          setForm={setForm}
          submitItem={updateOrderDiscount as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              ...rowToAction,
              type: rowToAction?.percentage
                ? DiscountTypeEnum.PERCENTAGE
                : DiscountTypeEnum.AMOUNT,
            },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: user
        ? ![RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)
        : true,
    },
    {
      name: t("Toggle Active"),
      isDisabled: !showInactiveDiscounts,
      isModal: false,
      isPath: false,
      icon: null,
      node: (row: any) => (
        <div className="mt-2 mr-auto">
          <CheckSwitch
            checked={row.status !== OrderDiscountStatus.DELETED}
            onChange={() => {
              updateOrderDiscount({
                id: row._id,
                updates: {
                  status:
                    row.status === OrderDiscountStatus.DELETED
                      ? ""
                      : OrderDiscountStatus.DELETED,
                },
              });
            }}
          ></CheckSwitch>
        </div>
      ),
    },
  ];
  const filters = [
    {
      label: t("Show Inactive Discounts"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={showInactiveDiscounts}
          onChange={setShowInactiveDiscounts}
        />
      ),
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [orderDiscounts, showInactiveDiscounts, user]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={
            showInactiveDiscounts
              ? orderDiscounts
              : orderDiscounts.filter(
                  (orderDiscount) =>
                    orderDiscount.status !== OrderDiscountStatus.DELETED
                )
          }
          title={t("Discounts")}
          addButton={addButton}
          filters={userCondition ? filters : []}
          isActionsActive={userCondition}
        />
      </div>
    </>
  );
};

export default OrderDiscountPage;
