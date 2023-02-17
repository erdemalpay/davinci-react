import { useState } from "react";
import { InputWithLabel } from "../components/common/InputWithLabel";
import { Header } from "../components/header/Header";
import { useUserContext } from "../context/User.context";
import { useUpdatePasswordMutation } from "../utils/api/user";

export default function UserComponent() {
  const { user } = useUserContext();
  const { updatePassword } = useUpdatePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
