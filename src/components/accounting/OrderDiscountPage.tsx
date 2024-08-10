import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { useUserContext } from "../../context/User.context";
import { OrderDiscount, RoleEnum } from "../../types";
import {
  useGetOrderDiscounts,
  useOrderDiscountMutations,
} from "../../utils/api/order/orderDiscount";
import { NameInput } from "../../utils/panelInputs";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
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
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<OrderDiscount>();
  const [form, setForm] = useState<FormElementsState>({
    name: "",
    type: "",
    percentage: "",
    amount: "",
  });
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const { createOrderDiscount, deleteOrderDiscount, updateOrderDiscount } =
    useOrderDiscountMutations();

  const columns = [
    { key: t("Name"), isSortable: true },
    { key: t("Percentage"), isSortable: true },
    { key: t("Amount"), isSortable: true },
  ];
  if (
    user &&
    [RoleEnum.MANAGER, RoleEnum.CATERINGMANAGER, RoleEnum.GAMEMANAGER].includes(
      user?.role?._id
    )
  ) {
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
      required: !isEditModalOpen,
      isDisabled: isEditModalOpen ? true : !(form.type === ""),
    },
    {
      type: InputTypes.NUMBER,
      formKey: "percentage",
      label: t("Percentage"),
      placeholder: t("Percentage"),
      required: isEditModalOpen
        ? rowToAction?.percentage
          ? true
          : false
        : form.type === DiscountTypeEnum.PERCENTAGE,
      isDisabled: isEditModalOpen
        ? rowToAction?.percentage
          ? false
          : true
        : form.type !== DiscountTypeEnum.PERCENTAGE,
    },
    {
      type: InputTypes.NUMBER,
      formKey: "amount",
      label: t("Amount"),
      placeholder: t("Amount"),
      required: isEditModalOpen
        ? rowToAction?.amount
          ? true
          : false
        : form.type === DiscountTypeEnum.AMOUNT,
      isDisabled: isEditModalOpen
        ? rowToAction?.amount
          ? false
          : true
        : form.type !== DiscountTypeEnum.AMOUNT,
    },
  ];
  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "type", type: FormKeyTypeEnum.STRING },
    { key: "percentage", type: FormKeyTypeEnum.NUMBER },
    { key: "amount", type: FormKeyTypeEnum.NUMBER },
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
      ? ![
          RoleEnum.MANAGER,
          RoleEnum.CATERINGMANAGER,
          RoleEnum.GAMEMANAGER,
        ].includes(user?.role?._id)
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
            deleteOrderDiscount(rowToAction?._id);
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
        ? ![
            RoleEnum.MANAGER,
            RoleEnum.CATERINGMANAGER,
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
          setForm={setForm}
          submitItem={updateOrderDiscount as any}
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
            RoleEnum.CATERINGMANAGER,
            RoleEnum.GAMEMANAGER,
          ].includes(user?.role?._id)
        : true,
    },
  ];
  useEffect(() => {
    setTableKey((prev) => prev + 1);
  }, [orderDiscounts]);

  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={orderDiscounts}
          title={t("Discounts")}
          addButton={addButton}
          isActionsActive={
            user
              ? [
                  RoleEnum.MANAGER,
                  RoleEnum.CATERINGMANAGER,
                  RoleEnum.GAMEMANAGER,
                ].includes(user?.role?._id)
              : false
          }
        />
      </div>
    </>
  );
};

export default OrderDiscountPage;
