import { FormEvent, useState } from "react";
import { EditableText } from "../components/common/EditableText";
import { InputWithLabel } from "../components/common/InputWithLabel";
import { Header } from "../components/header/Header";
import { useUserContext } from "../context/User.context";
import { User } from "../types";
import { useUpdatePasswordMutation, useUserMutations } from "../utils/api/user";

export default function UserView() {
  const { user } = useUserContext();
  const { updateUser } = useUserMutations();
  const { updatePassword } = useUpdatePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  function updateUserHandler(event: FormEvent<HTMLInputElement>, item?: User) {
    if (!item) return;
    const target = event.target as HTMLInputElement;
    if (!target.value) return;
    updateUser({
      id: item._id,
      updates: { [target.name]: target.value },
    });
  }

  function resetPassword() {
    if (!user) return;
    updatePassword({
      oldPassword: currentPassword,
      newPassword,
    });
  }

  if (!user) return <></>;

  return (
    <>
      <Header showLocationSelector={false} />
      <div className="flex flex-col gap-4 mx-0 lg:mx-20">
        <div className="bg-white shadow w-full px-6 py-5 mt-4">
          <div className="mb-5 rounded-tl-lg rounded-tr-lg">
            <div className="flex flex-col justify-between mb-4">
              <div className="text-base lg:text-2xl font-bold leading-normal text-gray-800 flex">
                <EditableText
                  name="name"
                  text={user.name}
                  onUpdate={updateUserHandler}
                  item={user}
                  placeholder="Display Name"
                />
              </div>
              <div className="text-base lg:text-md font-bold leading-normal text-gray-800 flex">
                {"Full Name: "}
                <EditableText
                  name="fullName"
                  text={user.fullName}
                  onUpdate={updateUserHandler}
                  item={user}
                  placeholder="Full Name"
                />
              </div>
              <p className="text-base lg:text-md font-bold leading-normal text-gray-800">
                <EditableText
                  name="phone"
                  text={user.phone}
                  onUpdate={updateUserHandler}
                  placeholder="Phone Number"
                  item={user}
                  type="phone"
                />
                {user.workType}
              </p>
              <div className="py-4 flex flex-col w-96">
                <InputWithLabel
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) =>
                    setCurrentPassword((e.target as HTMLInputElement).value)
                  }
                />
                <InputWithLabel
                  label="New Password"
                  value={newPassword}
                  onChange={(e) =>
                    setNewPassword((e.target as HTMLInputElement).value)
                  }
                />
                <button
                  onClick={resetPassword}
                  className="m-4 bg-red-500 hover:bg-red-700 text-white font-bold px-4 py-2 rounded"
                >
                  Reset Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
