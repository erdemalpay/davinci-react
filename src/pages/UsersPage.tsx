import { useEffect, useState } from "react";
import { IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
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
  const { updateUser, createUser } = useUserMutations();
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
  useEffect(() => {
    setTableKey(tableKey + 1);
  }, [users]);
  if (!users) return <></>;
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[90%] mx-auto my-10">
        <GenericTable
          key={tableKey}
          rowKeys={rowKeys}
          actions={actions}
          columns={columns}
          rows={users.map((user) => {
            return {
              ...user,
              role: user.role.name,
            };
          })}
          title="Users"
          imageHolder={user1}
          addButton={addButton}
        />
      </div>
    </>
  );
}
