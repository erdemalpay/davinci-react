import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FiEdit } from "react-icons/fi";
import { TbPasswordUser } from "react-icons/tb";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { ConfirmationDialog } from "../components/common/ConfirmationDialog";
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
import { RoleEnum, WorkType } from "../types";
import {
  useGetAllUserRoles,
  useGetAllUsers,
  useResetPasswordMutation,
  useUserMutations,
} from "../utils/api/user";

// these are the columns and rowKeys for the table
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
  const { setCurrentPage, setRowsPerPage, setSearchQuery, setSortConfigKey } =
    useGeneralContext();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const roles = useGetAllUserRoles();
  const { resetPassword } = useResetPasswordMutation();
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const { updateUser, createUser } = useUserMutations();
  const [tableKey, setTableKey] = useState(1); // reset table
  const users = useGetAllUsers();
  const navigate = useNavigate();
  const [
    isCloseAllConfirmationDialogOpen,
    setIsCloseAllConfirmationDialogOpen,
  ] = useState(false);
  const roleOptions = users.map((user) => {
    return {
      label: user.role.name,
      bgColor: user.role.color,
      textColor: "#fff",
    };
  });

  function handleUserUpdate(user: TableUser) {
    updateUser({
      id: user._id,
      updates: { active: !user.active },
    });
    toast.success(`User ${user.name} updated`);
  }
  const inputs = [
    {
      type: InputTypes.TEXT,
      formKey: "name",
      label: t("Name"),
      placeholder: t("Name"),
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
      type: InputTypes.TEXT,
      formKey: "cafeId",
      label: t("Cafe ID"),
      placeholder: t("Full Name"),
      required: false,
    },
    {
      type: InputTypes.SELECT,
      formKey: "role",
      label: t("Role"),
      options: roles.map((role) => {
        return {
          value: role._id,
          label: role.name,
        };
      }),
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
  ];

  const formKeys = [
    { key: "name", type: FormKeyTypeEnum.STRING },
    { key: "fullName", type: FormKeyTypeEnum.STRING },
    { key: "cafeId", type: FormKeyTypeEnum.STRING },
    { key: "role", type: FormKeyTypeEnum.STRING },
    { key: "imageUrl", type: FormKeyTypeEnum.STRING },
  ];
  const columns = [
    { key: "", isSortable: false },
    { key: "ID", isSortable: true },
    { key: t("Cafe ID"), isSortable: true },
    { key: t("Display Name"), isSortable: true },
    { key: t("Full Name"), isSortable: true },

    { key: t("Role"), isSortable: true },
    { key: t("Action"), isSortable: false },
  ];

  const rowKeys = [
    { key: "imageUrl", isImage: true },
    {
      key: "_id",
      node: (row: TableUser) => (
        <p
          className="text-blue-700  w-fit  cursor-pointer hover:text-blue-500 transition-transform"
          onClick={() => {
            setCurrentPage(1);
            // setRowsPerPage(RowPerPageEnum.FIRST);
            setSearchQuery("");
            setSortConfigKey(null);
            navigate(`/user/${row._id}`);
          }}
        >
          {row._id}
        </p>
      ),
    },
    { key: "cafeId" },
    { key: "name" },
    { key: "fullName" },
    {
      key: "role",
      isOptional: true,
      options: roleOptions,
    },
  ];

  const actions = [
    {
      name: t("Reset Password"),
      icon: <TbPasswordUser />,
      setRow: setRowToAction,
      modal: rowToAction ? (
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
      ) : null,
      className: "text-red-500 cursor-pointer text-2xl  ",
      isModal: true,
      isModalOpen: isCloseAllConfirmationDialogOpen,
      setIsModal: setIsCloseAllConfirmationDialogOpen,
      isPath: false,
      isDisabled: user ? ![RoleEnum.MANAGER].includes(user?.role?._id) : true,
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
          submitItem={updateUser as any}
          isEditMode={true}
          itemToEdit={{
            id: rowToAction._id,
            updates: {
              ...rowToAction,
              role: roles.find((role) => role.name === rowToAction.role)?._id,
            },
          }}
        />
      ) : null,
      isModalOpen: isEditModalOpen,
      setIsModal: setIsEditModalOpen,
      isPath: false,
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
  ];
  const addButton = {
    name: t("Add User"),
    isModal: true,
    modal: (
      <GenericAddEditPanel
        isOpen={isAddModalOpen}
        close={() => setIsAddModalOpen(false)}
        inputs={inputs}
        formKeys={formKeys}
        submitItem={createUser as any}
        folderName="user"
      />
    ),
    isModalOpen: isAddModalOpen,
    setIsModal: setIsAddModalOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };

  const filters = [
    {
      label: t("Show Inactive Users"),
      isUpperSide: false,
      node: (
        <SwitchButton
          checked={showInactiveUsers}
          onChange={setShowInactiveUsers}
        />
      ),
    },
  ];
  useEffect(() => {
    setTableKey(tableKey + 1);
  }, [users, showInactiveUsers]);
  const roleNormalizedUsers = users.map((user) => {
    return {
      ...user,
      role: user.role.name,
    };
  });
  const filteredUsers = () => {
    if (showInactiveUsers) {
      return roleNormalizedUsers;
    } else if (!showInactiveUsers) {
      return roleNormalizedUsers.filter((user) => user.active);
    }
  };
  if (!users) return <></>;

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[90%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          isActionsActive={true}
          columns={columns}
          filters={filters}
          rows={filteredUsers() as TableUser[]}
          title={t("Users")}
          imageHolder={user1}
          addButton={addButton}
        />
      </div>
    </>
  );
}
