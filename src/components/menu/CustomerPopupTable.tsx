import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { IoCheckmark, IoCloseOutline } from "react-icons/io5";
import { toast } from "react-toastify";
import { CustomerPopup, CustomerPopupTriggerType } from "../../types";
import { useGetStoreLocations } from "../../utils/api/location";
import {
  useCustomerPopupMutations,
  useGetCustomerPopups,
} from "../../utils/api/menu/customer-popup";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import { CheckSwitch } from "../common/CheckSwitch";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const DAY_LABELS: Record<number, string> = {
  1: "Pzt",
  2: "Sal",
  3: "Çar",
  4: "Per",
  5: "Cum",
  6: "Cmt",
  7: "Paz",
};

const TRIGGER_TYPE_LABELS: Record<CustomerPopupTriggerType, string> = {
  [CustomerPopupTriggerType.PERIODIC]: "Periyodik",
  [CustomerPopupTriggerType.SPECIAL_DAY]: "Özel Gün",
};

const CustomerPopupTable = () => {
  const { t } = useTranslation();
  const locations = useGetStoreLocations();
  const popups = useGetCustomerPopups();
  const { createCustomerPopup, updateCustomerPopup, deleteCustomerPopup } =
    useCustomerPopupMutations();

  const [rowToAction, setRowToAction] = useState<CustomerPopup>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Track triggerType selection to show/hide conditional fields
  const [addTriggerType, setAddTriggerType] = useState<string>(CustomerPopupTriggerType.PERIODIC);
  const [editTriggerType, setEditTriggerType] = useState<string>(
    rowToAction?.triggerType ?? ""
  );

  const hidePeriodicDays = (triggerType: string) =>
    triggerType === CustomerPopupTriggerType.SPECIAL_DAY;

  const hideSpecialDate = (triggerType: string) =>
    triggerType === CustomerPopupTriggerType.PERIODIC;

  const buildInputs = (triggerType: string, onTriggerChange: (v: string) => void) => [
    {
      type: InputTypes.TEXT,
      formKey: "title",
      label: t("Title"),
      placeholder: t("Title"),
      required: true,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "content",
      label: t("Content"),
      placeholder: t("Content"),
      required: true,
    },
    {
      type: InputTypes.IMAGE,
      formKey: "imageUrl",
      label: t("Image"),
      required: false,
      folderName: "customer-popup",
    },
    {
      type: InputTypes.SELECT,
      formKey: "triggerType",
      label: t("Trigger Type"),
      options: Object.entries(TRIGGER_TYPE_LABELS).map(([value, label]) => ({
        value,
        label,
      })),
      placeholder: t("Trigger Type"),
      required: true,
      additionalOnChange: (value: string) => onTriggerChange(value),
    },
    {
      type: InputTypes.SELECT,
      formKey: "periodicDays",
      label: t("Periodic Days"),
      options: Object.entries(DAY_LABELS)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([value, label]) => ({
          value: Number(value),
          label,
        })),
      placeholder: t("Periodic Days"),
      isMultiple: true,
      required: false,
      isSortDisabled: true,
      isDisabled: hidePeriodicDays(triggerType),
    },
    {
      type: InputTypes.TEXT,
      formKey: "specialDate",
      label: t("Special Date (DD-MM)"),
      placeholder: "14-02",
      required: false,
      isDisabled: hideSpecialDate(triggerType),
    },
    {
      type: InputTypes.NUMBER,
      formKey: "cooldownHours",
      label: t("Cooldown Hours"),
      placeholder: "24",
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "locations",
      label: t("Locations"),
      options: locations?.map((location) => ({
        value: location._id,
        label: location.name,
      })),
      placeholder: t("Locations"),
      isMultiple: true,
      required: true,
    },
    {
      type: InputTypes.CHECKBOX,
      formKey: "isActive",
      label: t("Active"),
      placeholder: t("Active"),
      required: false,
      isTopFlexRow: true,
    },
  ];

  const formKeys = [
    { key: "title", type: FormKeyTypeEnum.STRING },
    { key: "content", type: FormKeyTypeEnum.STRING },
    { key: "imageUrl", type: FormKeyTypeEnum.STRING },
    { key: "triggerType", type: FormKeyTypeEnum.STRING },
    { key: "periodicDays", type: FormKeyTypeEnum.ARRAY },
    { key: "specialDate", type: FormKeyTypeEnum.STRING },
    { key: "cooldownHours", type: FormKeyTypeEnum.NUMBER },
    { key: "locations", type: FormKeyTypeEnum.ARRAY },
    { key: "isActive", type: FormKeyTypeEnum.BOOLEAN },
  ];

  const columns = [
    { key: t("Title"), isSortable: true },
    { key: t("Trigger Type"), isSortable: false },
    { key: t("Periodic Days"), isSortable: false },
    { key: t("Special Date"), isSortable: false },
    { key: t("Cooldown (h)"), isSortable: false },
    { key: t("Active"), isSortable: false },
    { key: t("Action"), isSortable: false },
  ];

  const rowKeys = [
    { key: "title" },
    {
      key: "triggerType",
      node: (row: CustomerPopup) => (
        <span className="text-sm">
          {TRIGGER_TYPE_LABELS[row.triggerType] ?? row.triggerType}
        </span>
      ),
    },
    {
      key: "periodicDays",
      node: (row: CustomerPopup) => (
        <span className="text-sm">
          {row.periodicDays?.length
            ? row.periodicDays
                .sort((a, b) => a - b)
                .map((d) => DAY_LABELS[d])
                .join(", ")
            : "-"}
        </span>
      ),
    },
    {
      key: "specialDate",
      node: (row: CustomerPopup) => (
        <span className="text-sm">{row.specialDate ?? "-"}</span>
      ),
    },
    { key: "cooldownHours" },
    {
      key: "isActive",
      node: (row: CustomerPopup) =>
        row.isActive ? (
          <IoCheckmark className="text-blue-500 text-2xl" />
        ) : (
          <IoCloseOutline className="text-red-800 text-2xl" />
        ),
    },
  ];

  const addButton = {
    name: t("Add Popup"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => {
          setIsAddModalOpen(false);
          setAddTriggerType(CustomerPopupTriggerType.PERIODIC);
        }}
        inputs={buildInputs(addTriggerType, setAddTriggerType)}
        formKeys={formKeys}
        submitItem={createCustomerPopup as any}
        constantValues={{ isActive: true, cooldownHours: 24, periodicDays: [], triggerType: CustomerPopupTriggerType.PERIODIC }}
        topClassName="flex flex-col gap-2"
        generalClassName="overflow-scroll min-w-[90%] min-h-[95%]"
        nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: (val: boolean) => {
      setIsAddModalOpen(val);
      if (!val) setAddTriggerType(CustomerPopupTriggerType.PERIODIC);
    },
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };

  const actions = [
    {
      name: t("Delete"),
      icon: <HiOutlineTrash />,
      setRow: setRowToAction,
      modal: rowToAction ? (
        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          close={() => setIsDeleteDialogOpen(false)}
          confirm={() => {
            deleteCustomerPopup(rowToAction._id);
            setIsDeleteDialogOpen(false);
            toast.success(t("Popup deleted successfully"));
          }}
          title={t("Delete Popup")}
          text={`${rowToAction.title} ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl",
      isModal: true,
      isModalOpen: isDeleteDialogOpen,
      setIsModal: setIsDeleteDialogOpen,
      isPath: false,
    },
    {
      name: t("Edit"),
      icon: <FiEdit />,
      className: "text-blue-500 cursor-pointer text-xl",
      isModal: true,
      setRow: (row: CustomerPopup) => {
        setRowToAction(row);
        setEditTriggerType(row?.triggerType ?? "");
      },
      modal: rowToAction ? (
        <GenericAddEditPanel
          isOpen={isEditModalOpen}
          close={() => {
            setIsEditModalOpen(false);
            setEditTriggerType("");
          }}
          inputs={buildInputs(editTriggerType, setEditTriggerType)}
          formKeys={formKeys}
          submitItem={updateCustomerPopup as any}
          isEditMode={true}
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
          topClassName="flex flex-col gap-2"
          generalClassName="max-h-[90vh] overflow-y-auto"
          nonImageInputsClassName="grid grid-cols-1 sm:grid-cols-2 gap-4"
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
    },
    {
      name: t("Toggle Active"),
      isModal: false,
      isPath: false,
      icon: null,
      node: (row: CustomerPopup) => (
        <div className="mt-2">
          <CheckSwitch
            checked={row.isActive}
            onChange={() => {
              updateCustomerPopup(
                { id: row._id, updates: { isActive: !row.isActive } },
                {
                  onSuccess: () =>
                    toast.success(t("Popup updated successfully")),
                }
              );
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="w-[95%] mx-auto">
      <GenericTable
        rowKeys={rowKeys}
        actions={actions}
        columns={columns}
        isActionsActive={true}
        rows={popups.filter(Boolean)}
        title={t("Customer Popups")}
        addButton={addButton}
      />
    </div>
  );
};

export default CustomerPopupTable;
