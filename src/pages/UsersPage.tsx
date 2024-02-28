import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../components/header/Header";
import GenericTable from "../components/panelComponents/Tables/GenericTable";
import user1 from "../components/panelComponents/assets/profile/user-1.jpg";
import { useGetAllUsers, useUserMutations } from "../utils/api/user";
// these are the columns and rowKeys for the table
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
  },
];
export default function UsersPage() {
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const { updateUser, createUser } = useUserMutations();
  const users = useGetAllUsers().map((user) => {
    return {
      ...user,
      role: user.role.name,
    };
  });
  const navigate = useNavigate();
  if (!users) return <></>;
  return (
    <>
      <Header showLocationSelector={false} />
      <div className="w-[90%] mx-auto my-10">
        <GenericTable
          rowKeys={rowKeys}
          actions={[]}
          columns={columns}
          rows={users}
          title="Users"
          imageHolder={user1}
        />
      </div>
    </>
  );
}
