import { format } from "date-fns";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { HiOutlineTrash } from "react-icons/hi2";
import { NotificationType } from "../../types";
import { useGetAllLocations } from "../../utils/api/location";
import {
  useGetEventNotifications,
  useNotificationMutations,
} from "../../utils/api/notification";
import { useGetAllUserRoles, useGetUsers } from "../../utils/api/user";
import { getItem } from "../../utils/getItem";
import { ConfirmationDialog } from "../common/ConfirmationDialog";
import GenericAddEditPanel from "../panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../panelComponents/Tables/GenericTable";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";
import { NotificationEventType } from "./CreateNotification";

const AssignNotification = () => {
  const { t } = useTranslation();
  const users = useGetUsers();
  const roles = useGetAllUserRoles();
  const notifications = useGetEventNotifications();
  const locations = useGetAllLocations();
  const [tableKey, setTableKey] = useState(0);
  const { deleteNotification, updateNotification } = useNotificationMutations();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [rowToAction, setRowToAction] = useState<any>();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const allRows = notifications.map((notification) => {
    return {
      ...notification,
      createdBy: getItem(notification?.createdBy, users)?.name ?? "",
      formattedDate: format(new Date(notification.createdAt), "dd-MM-yyyy"),
      type: t(notification.type),
    };
  });

  const [form, setForm] = useState({
    selectedUsers: [],
    selectedRoles: [],
    selectedLocations: [],
    type: "",
    message: "",
    event: "",
  });
  const notificationEventsOptions = [
    {
      value: NotificationEventType.COMPLETECOUNT,
      label: t("Complete Count"),
    },
  ];
  const [rows, setRows] = useState(allRows);
  const columns = [
    { key: t("Created By"), isSortable: true },
    { key: t("Created At"), isSortable: true },
    { key: t("Triggered Event"), isSortable: true },
    { key: t("Type"), isSortable: true },
    { key: t("Message"), isSortable: true },
    { key: t("Selected Users"), isSortable: true },
    { key: t("Selected Roles"), isSortable: true },
    { key: t("Selected Locations"), isSortable: true },
    { key: t("Actions"), isSortable: false },
  ];
  const rowKeys = [
    { key: "createdBy" },
    { key: "formattedDate" },
    { key: "event" },
    { key: "type" },
    { key: "message" },
    {
      key: "selectedUsers",
      node: (row: any) => {
        if (!row?.selectedUsers) return <></>;
        return (
          <div className="flex flex-row gap-2">
            {row.selectedUsers
              .map((user: any) => {
                const foundUser = getItem(user, users);
                return foundUser ? foundUser.name : "";
              })
              .filter(Boolean)
              .join(", ")}
          </div>
        );
      },
    },
    {
      key: "selectedRoles",
      node: (row: any) => {
        if (!row?.selectedRoles) return <></>;
        return (
          <div className="flex flex-row gap-2">
            {row.selectedRoles
              .map((role: any) => {
                const foundRole = getItem(role, roles);
                return foundRole ? foundRole.name : "";
              })
              .filter(Boolean)
              .join(", ")}
          </div>
        );
      },
    },
    {
      key: "selectedLocations",
      node: (row: any) => {
        if (!row?.selectedLocations) return <></>;
        return (
          <div className="flex flex-row gap-2">
            {row.selectedLocations
              .map((location: any) => {
                const foundLocation = getItem(location, locations);
                return foundLocation ? foundLocation.name : "";
              })
              .filter(Boolean)
              .join(", ")}
          </div>
        );
      },
    },
  ];
  const inputs = [
    {
      type: InputTypes.SELECT,
      formKey: "selectedUsers",
      label: t("User"),
      options: users?.map((user) => {
        return {
          value: user._id,
          label: user.name,
        };
      }),
      placeholder: t("User"),
      isMultiple: true,
      required: !(form.selectedRoles.length > 0),
    },
    {
      type: InputTypes.SELECT,
      formKey: "selectedRoles",
      label: t("Role"),
      options: roles?.map((role) => {
        return {
          value: role._id,
          label: role.name,
        };
      }),
      placeholder: t("Role"),
      isMultiple: true,
      required: !(form.selectedUsers.length > 0),
    },
    {
      type: InputTypes.SELECT,
      formKey: "selectedLocations",
      label: t("Location"),
      options: locations.map((input) => {
        return {
          value: input._id,
          label: input.name,
        };
      }),
      placeholder: t("Location"),
      isMultiple: true,
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "type",
      label: t("Type"),
      options: Object.values(NotificationType)?.map((notificationType) => {
        return {
          value: notificationType,
          label: t(notificationType),
        };
      }),
      placeholder: t("Type"),
      isMultiple: false,
      required: true,
    },
    {
      type: InputTypes.SELECT,
      formKey: "event",
      label: t("Event"),
      options: notificationEventsOptions,
      placeholder: t("Event"),
      isMultiple: false,
      required: false,
      isAutoFill: false,
    },
    {
      type: InputTypes.TEXTAREA,
      formKey: "message",
      label: t("Message"),
      placeholder: t("Message"),
      required: form.event === "",
    },
  ];
  const formKeys = [
    { key: "selectedUsers", type: FormKeyTypeEnum.STRING },
    { key: "selectedRoles", type: FormKeyTypeEnum.STRING },
    { key: "selectedLocations", type: FormKeyTypeEnum.STRING },
    { key: "type", type: FormKeyTypeEnum.STRING },
    { key: "event", type: FormKeyTypeEnum.STRING },
    { key: "message", type: FormKeyTypeEnum.STRING },
  ];
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
            deleteNotification(rowToAction?._id);
            setIsCloseAllConfirmationDialogOpen(false);
          }}
          title={t("Delete Notification")}
          text={`Notification ${t("GeneralDeleteMessage")}`}
        />
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: false,
    },
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
          setForm={setForm}
          formKeys={formKeys}
          submitItem={updateNotification as any}
          isEditMode={true}
          topClassName="flex flex-col gap-2 "
          itemToEdit={{ id: rowToAction._id, updates: rowToAction }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
      isDisabled: false,
    },
  ];
  useEffect(() => {
    setRows(allRows);
    setTableKey((prev) => prev + 1);
  }, [users, locations, notifications, roles]);
  return (
    <>
      <div className="w-[95%] mx-auto ">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          columns={columns}
          rows={rows}
          actions={actions}
          title={t("Assigned Notifications")}
          isActionsActive={true}
        />
      </div>
    </>
  );
};

export default AssignNotification;
