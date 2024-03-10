import { useState } from "react";
import { toast } from "react-toastify";
import { useUserContext } from "../../../context/User.context";
import { useUpdatePasswordMutation } from "../../../utils/api/user";
import TextInput from "../FormElements/TextInput";
import { H4, P2 } from "../Typography";
import ItemContainer from "../common/ItemContainer";

const ChangePassword = () => {
  const { user } = useUserContext();
  const { updatePassword } = useUpdatePasswordMutation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  function resetPassword() {
    if (!user) return;
    if (currentPassword === "" || newPassword === "" || confirmPassword === "")
      return toast.error("Please fill all the fields");

    if (newPassword !== confirmPassword)
      return toast.error("Confirm password does not match");
    updatePassword({
      oldPassword: currentPassword,
      newPassword,
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  }

  if (!user) return <></>;
  return (
    <ItemContainer>
      <div className="flex flex-col gap-2">
        <H4>Change Password</H4>
        <P2>To change your password please confirm here</P2>
      </div>
      <div className="flex flex-col gap-4">
        <TextInput
          label="Old Password"
          placeholder="Enter old password"
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
        />
        <TextInput
          label="New Password"
          placeholder="Enter new password"
          type="password"
          value={newPassword}
          onChange={setNewPassword}
        />
        <TextInput
          label="Confirm Password"
          placeholder="Enter confirm password"
          type="password"
          value={confirmPassword}
          onChange={setConfirmPassword}
        />
      </div>
      {/* button */}
      <button
        className="w-fit bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md ml-auto"
        onClick={resetPassword}
      >
        Change
      </button>
    </ItemContainer>
  );
};

export default ChangePassword;
