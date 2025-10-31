import { useMemo, useState } from "react";
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
import { CheckSwitch } from "../common/CheckSwitch";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import SwitchButton from "../panelComponents/common/SwitchButton";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

type FormElementsState = { [key: string]: any };
enum DiscountTypeEnum {
  PERCENTAGE = "PERCENTAGE",
  AMOUNT = "AMOUNT",
}

const OrderDiscountPage = () => {
  const { t } = useTranslation();
  const orderDiscounts = useGetOrderDiscounts();
  const { user } = useUserContext();

  const [showInactiveDiscounts, setShowInactiveDiscounts] = useState(false);
  const [isEnableEdit, setIsEnableEdit] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<OrderDiscount>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const userCondition =
    (user &&
      [RoleEnum.MANAGER, RoleEnum.GAMEMANAGER].includes(user?.role?._id)) ??
    false;

  const { createOrderDiscount, updateOrderDiscount } =
    useOrderDiscountMutations();

  function handleNoteRequiredChange(row: OrderDiscount) {
    updateOrderDiscount({
      id: row._id,
      updates: { isNoteRequired: !row.isNoteRequired },
    });
  }

  function handleOnlineOrderChange(row: OrderDiscount) {
    updateOrderDiscount({
      id: row._id,
      updates: { isOnlineOrder: !row.isOnlineOrder },
    });
  }

  function handleStoreOrderChange(row: OrderDiscount) {
    updateOrderDiscount({
      id: row._id,
      updates: { isStoreOrder: !row.isStoreOrder },
    });
  }

  const [form, setForm] = useState<FormElementsState>({
    name: "",
    type: "",
    percentage: "",
    amount: "",
    note: "",
  });

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
        formKey: "type",
        label: t("Type"),
        placeholder: t("Type"),
        options: [
          { value: DiscountTypeEnum.PERCENTAGE, label: t("Percentage") },
          { value: DiscountTypeEnum.AMOUNT, label: t("Amount") },
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
        type: InputTypes.TEXT,
        formKey: "note",
        label: t("Note Placeholder"),
        placeholder: t("Note Placeholder"),
        required: false,
      },
    ],
    [t, form.type]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "type", type: FormKeyTypeEnum.STRING },
      { key: "percentage", type: FormKeyTypeEnum.NUMBER },
      { key: "amount", type: FormKeyTypeEnum.NUMBER },
      { key: "note", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const columns = useMemo(() => {
    const base = [
      { key: t("Name"), isSortable: true },
      { key: t("Percentage"), isSortable: true },
      { key: t("Amount"), isSortable: true },
      { key: t("Online Order"), isSortable: false },
      { key: t("Store Order"), isSortable: false },
      { key: t("Note Required"), isSortable: false },
      { key: t("Note Placeholder"), isSortable: false },
    ];
    return userCondition
      ? [...base, { key: t("Actions"), isSortable: false }]
      : base;
  }, [t, userCondition]);

  const rowKeys = useMemo(
    () => [
      { key: "name", className: "min-w-32 pr-1" },
      { key: "percentage", className: "min-w-32 pr-1" },
      { key: "amount", className: "min-w-32 pr-1" },
      {
        key: "isOnlineOrder",
        node: (row: any) =>
          isEnableEdit ? (
            <CheckSwitch
              checked={row?.isOnlineOrder}
              onChange={() => handleOnlineOrderChange(row)}
            />
          ) : row?.isOnlineOrder ? (
            <IoCheckmark className="text-blue-500 text-2xl " />
          ) : (
            <IoCloseOutline className="text-red-800 text-2xl " />
          ),
      },
      {
        key: "isStoreOrder",
        node: (row: any) =>
          isEnableEdit ? (
            <CheckSwitch
              checked={row?.isStoreOrder}
              onChange={() => handleStoreOrderChange(row)}
            />
          ) : row?.isStoreOrder ? (
            <IoCheckmark className="text-blue-500 text-2xl " />
          ) : (
            <IoCloseOutline className="text-red-800 text-2xl " />
          ),
      },
      {
        key: "isNoteRequired",
        node: (row: any) =>
          isEnableEdit ? (
            <CheckSwitch
              checked={row?.isNoteRequired}
              onChange={() => handleNoteRequiredChange(row)}
            />
          ) : row?.isNoteRequired ? (
            <IoCheckmark className="text-blue-500 text-2xl " />
          ) : (
            <IoCloseOutline className="text-red-800 text-2xl " />
          ),
      },
      { key: "note", className: "min-w-32 pr-1" },
    ],
    [isEnableEdit]
  );

  const addButton = useMemo(
    () => ({
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
      isDisabled: !userCondition,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500 ",
    }),
    [t, isAddModalOpen, inputs, formKeys, createOrderDiscount, userCondition]
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
            close={() => setIsCloseAllConfirmationDialogOpen(false)}
            confirm={() => {
              updateOrderDiscount({
                id: rowToAction._id,
                updates: { status: OrderDiscountStatus.DELETED },
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
        isDisabled: !userCondition,
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
            isEditMode
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
        isDisabled: !userCondition,
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
            />
          </div>
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      isEditModalOpen,
      inputs,
      formKeys,
      updateOrderDiscount,
      userCondition,
      showInactiveDiscounts,
    ]
  );

  const filters = useMemo(
    () =>
      userCondition
        ? [
            {
              label: t("Enable Edit"),
              isUpperSide: true,
              node: (
                <SwitchButton
                  checked={isEnableEdit}
                  onChange={setIsEnableEdit}
                />
              ),
            },
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
          ]
        : [],
    [t, userCondition, isEnableEdit, showInactiveDiscounts]
  );

  const rows = useMemo(
    () =>
      showInactiveDiscounts
        ? orderDiscounts
        : orderDiscounts.filter(
            (od) => od.status !== OrderDiscountStatus.DELETED
          ),
    [orderDiscounts, showInactiveDiscounts]
  );

  return (
    <div className="w-[95%] mx-auto ">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        rows={rows}
        title={t("Discounts")}
        addButton={addButton}
        filters={filters}
        isActionsActive={userCondition}
      />
    </div>
  );
};

export default OrderDiscountPage;
