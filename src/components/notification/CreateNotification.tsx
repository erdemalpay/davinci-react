import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  NotificationType,
  RoleEnum,
  notificationEventsOptions,
} from "../../types";
import { useGetAllLocations } from "../../utils/api/location";
import { useNotificationMutations } from "../../utils/api/notification";
import {
  useGetAllUserRoles,
  useGetUser,
  useGetUsers,
} from "../../utils/api/user";
import GenericAddComponent from "../panelComponents/FormElements/GenericAddComponent";
import { FormKeyTypeEnum, InputTypes } from "../panelComponents/shared/types";

const CreateNotification = () => {
  const { t } = useTranslation();
  const { createNotification } = useNotificationMutations();
  const users = useGetUsers();
  const user = useGetUser();
  const roles = useGetAllUserRoles();
  const locations = useGetAllLocations();
  const [form, setForm] = useState({
    selectedUsers: [],
    selectedRoles: [],
    selectedLocations: [],
    type: "",
    message: "",
    event: "",
    isAssigned: false,
  });
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
      label: t("Triggered Event"),
      options: notificationEventsOptions.map((notificationEvent) => {
        return {
          value: notificationEvent.value,
          label: t(notificationEvent.label),
        };
      }),
      placeholder: t("Triggered Event"),
      required: false,
      isAutoFill: false,
      isDisabled: user?.role?._id !== RoleEnum.MANAGER,
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

  return (
    <GenericAddComponent
      inputs={inputs}
      header={t("Create Notification")}
      formKeys={formKeys}
      setForm={setForm}
      constantValues={{ type: NotificationType.INFORMATION }}
      submitItem={createNotification as any}
      submitFunction={() => {
        createNotification({
          ...form,
          isAssigned: form?.event !== "" ? true : false,
        });
      }}
      buttonName={t("Submit")}
      topClassName="flex flex-col gap-2 "
    />
  );
};

export default CreateNotification;
