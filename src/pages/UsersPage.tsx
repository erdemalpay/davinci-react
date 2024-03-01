import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { CheckSwitch } from "../components/common/CheckSwitch";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import user1 from "../components/panelComponents/assets/profile/user-1.jpg";
import { CreateUserDialog } from "../components/users/CreateUserDialog";
import { WorkType } from "../types";
import { useGetAllUsers, useUserMutations } from "../utils/api/user";

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
  games: number[];
}

export default function UsersPage() {
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [showInactiveUsers, setShowInactiveUsers] = useState(false);
  const { updateUser, createUser } = useUserMutations();
  const [currentPage, setCurrentPage] = useState(1);
  const [tableKey, setTableKey] = useState(0); // reset table
  const users = useGetAllUsers();
  const navigate = useNavigate();
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
  const columns = ["", "ID", "Display Name", "Full Name", "Role", "Action"];
  const rowKeys = [
    { key: "imageUrl", isImage: true },
    {
      key: "_id",
    },
    {
      key: "name",
    },
    {
      key: "fullName",
    },
    {
      key: "role",
      isOptional: true,
      options: roleOptions,
    },
  ];
  const actions = [
    {
      name: "View",
      icon: <IoEyeOutline />,
      isModal: false,
      className: "text-blue-500 cursor-pointer text-xl",
      onClick: (row: TableUser) => {
        {
          navigate(`/user/${row._id}`);
        }
      },
      isPath: false,
    },
    {
      name: "Toggle Active",
      isDisabled: !showInactiveUsers,
      isModal: false,
      isPath: false,
      icon: null,
      node: (row: TableUser) => (
        <CheckSwitch
          checked={row.active}
          onChange={() => handleUserUpdate(row)}
        ></CheckSwitch>
      ),
    },
  ];
  const addButton = {
    name: `Add User`,
    isModal: true,
    modal: (
      <CreateUserDialog
        isOpen={isCreateUserDialogOpen}
        close={() => setIsCreateUserDialogOpen(false)}
        createUser={createUser}
      />
    ),
    isModalOpen: isCreateUserDialogOpen,
    setIsModal: setIsCreateUserDialogOpen,
    isPath: false,
    icon: null,
    className: "bg-blue-500 hover:text-blue-500 hover:border-blue-500",
  };
  const filters = [
    {
      label: "Show Inactive Users",
      node: (
        <Switch
          checked={showInactiveUsers}
          onChange={() => setShowInactiveUsers((value) => !value)}
          className={`${showInactiveUsers ? "bg-green-500" : "bg-red-500"}
          relative inline-flex h-[20px] w-[36px] border-[1px] cursor-pointer rounded-full border-transparent transition-colors duration-200 ease-in-out focus:outline-none`}
        >
          <span
            aria-hidden="true"
            className={`${showInactiveUsers ? "translate-x-4" : "translate-x-0"}
            pointer-events-none inline-block h-[18px] w-[18px] transform rounded-full bg-white transition duration-200 ease-in-out`}
          />
        </Switch>
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
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          columns={columns}
          filters={filters}
          rows={filteredUsers() as TableUser[]}
          title="Users"
          imageHolder={user1}
          addButton={addButton}
        />
      </div>
    </>
  );
}
