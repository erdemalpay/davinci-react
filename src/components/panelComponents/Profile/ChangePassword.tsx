import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import { useUserContext } from "../../../context/User.context";
import { useUpdatePasswordMutation } from "../../../utils/api/user";
import ItemContainer from "../common/ItemContainer";
import TextInput from "../FormElements/TextInput";
import { H4, P2 } from "../Typography";

const ChangePassword = () => {
  const [key, setKey] = useState(0);
  const { user } = useUserContext();
  const { updatePassword } = useUpdatePasswordMutation();
  const { t } = useTranslation();

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
    setKey((prev) => prev + 1);
  }

  if (!user) return <></>;
  return (
    <ItemContainer key={key}>
      <div className="flex flex-col gap-2">
        <H4>{t("Change Password")}</H4>
        <P2>{t("To change your password please confirm here")}</P2>
      </div>
      <div className="flex flex-col gap-4">
        <TextInput
          label={t("Old Password")}
          placeholder={t("Enter old password")}
          type="password"
          value={currentPassword}
          onChange={setCurrentPassword}
        />
        <TextInput
          label={t("New Password")}
          placeholder={t("Enter new password")}
          type="password"
          value={newPassword}
          onChange={setNewPassword}
        />
        <TextInput
          label={t("Confirm Password")}
          placeholder={t("Enter confirm password")}
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
        {t("Change")}
      </button>
    </ItemContainer>
  );
};

export default ChangePassword;
