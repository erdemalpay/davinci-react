import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { TbPasswordUser } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
import { UserInfoModal } from "../components/common/UserInfoModal";
import { Header } from "../components/header/Header";
import GenericAddEditPanel from "../components/panelComponents/FormElements/GenericAddEditPanel";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import user1 from "../components/panelComponents/assets/profile/user-1.jpg";
import SwitchButton from "../components/panelComponents/common/SwitchButton";
import {
  FormKeyTypeEnum,
  InputTypes,
} from "../components/panelComponents/shared/types";
import { useGeneralContext } from "../context/General.context";
import { useUserContext } from "../context/User.context";
import { ActionEnum, DisabledConditionEnum, User, WorkType } from "../types";
import { UpdatePayload } from "../utils/api";
import {
  useCreateUserMutation,
  useGetAllUserRoles,
  useGetAllUsers,
  useResetPasswordMutation,
  useUserMutations,
} from "../utils/api/user";
import { useGetDisabledConditions } from "../utils/api/panelControl/disabledCondition";
import { getItem } from "../utils/getItem";
interface TableUser {
  _id: string;
  name: string;
  fullName: string;
  active: boolean;
  role: string;
  jobStartDate: Date;
  jobEndDate?: Date;
  insuranceStartDate: Date;
  profileImage?: string;
  phone: string;
  address: string;
  iban: string;
  birthDate: Date;
  imageUrl: string;
  workType: WorkType;
  userGames: [
    {
      game: number;
      learnDate: string;
    }
  ];
}
export default function Users() {
  const { t } = useTranslation();
  const [rowToAction, setRowToAction] = useState<TableUser>();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { user } = useUserContext();
  const { resetGeneralContext } = useGeneralContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const roles = useGetAllUserRoles();
  const [resetedUserInfo, setResetedUserInfo] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const { resetPassword } = useResetPasswordMutation((username, tempPassword) => {
    setResetedUserInfo({ username, password: tempPassword });
  });
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const { updateUser } = useUserMutations();
  const [createdUserInfo, setCreatedUserInfo] = useState<{
    username: string;
    password: string;
  } | null>(null);
  const { createUser } = useCreateUserMutation((username, tempPassword) => {
    setCreatedUserInfo({ username, password: tempPassword });
  });
  const users = useGetAllUsers();
  const navigate = useNavigate();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);

  const disabledConditions = useGetDisabledConditions();
  const usersPageDisabledCondition = useMemo(() => {
    return getItem(DisabledConditionEnum.USERS, disabledConditions);
  }, [disabledConditions]);

  const roleOptions = useMemo(() => {
    return users.map((user) => ({
      label: user.role.name,
      bgColor: user.role.color,
      textColor: "#fff",
    }));
  }, [users]);

  function handleUserUpdate(user: TableUser) {
    updateUser({
      id: user._id,
      updates: { active: !user.active },
    });
    toast.success(`User ${user.name} updated`);
  }

  const inputs = useMemo(
    () => [
      {
        type: InputTypes.TEXT,
        formKey: "name",
        label: t("Username"),
        placeholder: t("Username"),
        required: true,
      },
      {
        type: InputTypes.TEXT,
        formKey: "fullName",
        label: t("Full Name"),
        placeholder: t("Full Name"),
        required: false,
      },
      {
        type: InputTypes.SELECT,
        formKey: "role",
        label: t("Role"),
        options: roles.map((role) => ({
          value: role._id,
          label: role.name,
        })),
        placeholder: t("Role"),
        required: false,
      },
      {
        type: InputTypes.IMAGE,
        formKey: "imageUrl",
        label: t("Image"),
        required: false,
        folderName: "menu",
      },
    ],
    [t, roles]
  );

  const formKeys = useMemo(
    () => [
      { key: "name", type: FormKeyTypeEnum.STRING },
      { key: "fullName", type: FormKeyTypeEnum.STRING },

      { key: "role", type: FormKeyTypeEnum.STRING },
      { key: "imageUrl", type: FormKeyTypeEnum.STRING },
    ],
    []
  );

  const columns = useMemo(
    () => [
      { key: "", isSortable: false },
      { key: "ID", isSortable: true },
      { key: t("Display Name"), isSortable: true },
      { key: t("Full Name"), isSortable: true },
      { key: t("Role"), isSortable: true },
      { key: t("Action"), isSortable: false },
    ],
    [t]
  );

  const rowKeys = useMemo(
    () => [
      { key: "imageUrl", isImage: true },
      {
        key: "_id",
        node: (row: TableUser) => (
          <p
            className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
            onClick={() => {
              resetGeneralContext();
              navigate(`/user/${row._id}`);
            }}
          >
            {row._id}
          </p>
        ),
      },

      { key: "name" },
      { key: "fullName" },
      {
        key: "role",
        isOptional: true,
        options: roleOptions,
      },
    ],
    [resetGeneralContext, navigate, roleOptions]
  );

  const actions = useMemo(
    () => [
      {
        name: t("Reset Password"),
        icon: <TbPasswordUser />,
        setRow: setRowToAction,
        modal: rowToAction ? (
          resetedUserInfo ? (
            <UserInfoModal
              title={t("Password reset successfully!")}
              username={resetedUserInfo.username}
              password={resetedUserInfo.password}
              onClose={() => {
                setIsCloseAllConfirmationDialogOpen(false);
                setResetedUserInfo(null);
              }}
            />
          ) : (
            <ConfirmationDialog
              isOpen={isCloseAllConfirmationDialogOpen}
              close={() => {
                setIsCloseAllConfirmationDialogOpen(false);
              }}
              confirm={() => {
                resetPassword({ id: rowToAction._id });
                setIsCloseAllConfirmationDialogOpen(false);
              }}
              title={t("Reset User Password")}
              text={t("Are you sure you want to reset the password ?")}
            />
          )
        ) : null,
        className: "text-red-500 cursor-pointer text-2xl  ",
        isModal: true,
        isModalOpen: isCloseAllConfirmationDialogOpen || !!resetedUserInfo,
        setIsModal: (val: boolean) => {
          setIsCloseAllConfirmationDialogOpen(val);
          if (!val) setResetedUserInfo(null);
        },
        isPath: false,
        isDisabled: usersPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.RESET_PASSWORD &&
            (user == null || !ac?.permissionsRoles?.includes(user?.role?._id))
        ),
      },
      {
        name: t("Edit"),
        icon: <FiEdit />,
        className: "text-blue-500 cursor-pointer text-xl",
        isModal: true,
        setRow: setRowToAction,
        modal: rowToAction ? (
          <GenericAddEditPanel
            isOpen={isEditModalOpen}
            close={() => setIsEditModalOpen(false)}
            inputs={inputs}
            formKeys={formKeys}
            folderName="user"
            submitItem={updateUser as (item: User | UpdatePayload<User>) => void}
            isEditMode={true}
            itemToEdit={{
              id: rowToAction._id,
              updates: {
                ...rowToAction,
                role: roles.find((role) => role.name === rowToAction.role)
                  ?._id as unknown as User["role"],
              },
            }}
          />
        ) : null,
        isModalOpen: isEditModalOpen,
        setIsModal: setIsEditModalOpen,
        isPath: false,
        isDisabled: usersPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.UPDATE &&
            (user == null || !ac?.permissionsRoles?.includes(user?.role?._id))
        ),
      },
      {
        name: t("Toggle Active"),
        isDisabled: !showInactiveUsers,
        isModal: false,
        isPath: false,
        icon: null,
        node: (row: TableUser) => (
          <div className="mt-2">
            <CheckSwitch
              checked={row.active}
              onChange={() => handleUserUpdate(row)}
            ></CheckSwitch>
          </div>
        ),
      },
    ],
    [
      t,
      rowToAction,
      isCloseAllConfirmationDialogOpen,
      resetPassword,
      resetedUserInfo,
      usersPageDisabledCondition,
      user,
      isEditModalOpen,
      inputs,
      formKeys,
      updateUser,
      roles,
      showInactiveUsers,
    ]
  );

  const addButton = useMemo(
    () => ({
      name: t("Add User"),
      isModal: true,
      modal: createdUserInfo ? (
        <UserInfoModal
          title={t("New user created successfully!")}
          username={createdUserInfo.username}
          password={createdUserInfo.password}
          onClose={() => {
            setIsAddModalOpen(false);
            setCreatedUserInfo(null);
          }}
        />
      ) : (
        <GenericAddEditPanel
          isOpen={isAddModalOpen}
          close={() => {
            setIsAddModalOpen(false);
            setCreatedUserInfo(null);
          }}
          inputs={inputs}
          formKeys={formKeys}
          submitItem={createUser as (item: User | UpdatePayload<User>) => void}
          folderName="user"
          isCreateCloseActive={false}
        />
      ),
      isModalOpen: isAddModalOpen,
      setIsModal: setIsAddModalOpen,
      isPath: false,
      icon: null,
      className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
      isDisabled: usersPageDisabledCondition?.actions?.some(
        (ac) =>
          ac.action === ActionEnum.ADD &&
          (user == null || !ac?.permissionsRoles?.includes(user?.role?._id))
      ),
    }),
    [t, isAddModalOpen, inputs, formKeys, createUser, createdUserInfo, usersPageDisabledCondition, user]
  );

  const filters = useMemo(
    () => [
      {
        label: t("Show Inactive Users"),
        isUpperSide: false,
        isDisabled: usersPageDisabledCondition?.actions?.some(
          (ac) =>
            ac.action === ActionEnum.SHOW_INACTIVE_ELEMENTS &&
            (user == null || !ac?.permissionsRoles?.includes(user?.role?._id))
        ),
        node: (
          <SwitchButton
            checked={showInactiveUsers}
            onChange={setShowInactiveUsers}
          />
        ),
      },
    ],
    [t, showInactiveUsers, usersPageDisabledCondition, user]
  );

  const roleNormalizedUsers = useMemo(() => {
    return users.map((user) => ({
      ...user,
      role: user.role.name,
    }));
  }, [users]);

  const filteredUsers = useMemo(() => {
    if (showInactiveUsers) {
      return roleNormalizedUsers;
    } else {
      return roleNormalizedUsers.filter((user) => user.active);
    }
  }, [showInactiveUsers, roleNormalizedUsers]);

  if (!users) return <></>;

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[90%] mx-auto my-10">
        <GenericTable
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={filters}
          rows={filteredUsers as TableUser[]}
          title={t("Users")}
          imageHolder={user1}
          addButton={addButton}
        />
      </div>
    </>
  );
}
