import { useState } from "react";
import { useTranslation } from "react-i18next";
import { GenericButton } from "../../common/GenericButton";
import { User } from "../../../types";
import { useUserMutations } from "../../../utils/api/user";
import ItemContainer from "../common/ItemContainer";
import TextInput from "../FormElements/TextInput";
import { H4, P2 } from "../Typography";

type Props = {
  isEditable: boolean;
  user: User;
};

const PersonalDetails = ({ isEditable, user }: Props) => {
  const { updateUser } = useUserMutations();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    fullName: user.fullName ?? "",
    phone: user.phone ?? "",
    address: user.address ?? "",
  });

  const handleChange = (name: string, value: string) => {
    setFormData((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };
  const handleSave = () => {
    updateUser({
      id: user._id,
      updates: formData,
    });
  };

  return (
    <ItemContainer>
      <div className="flex flex-col gap-2">
        <H4>{t("Personal Details")}</H4>
        {isEditable && (
          <P2>
            {t("To change your personal detail, edit and save from here")}
          </P2>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label={t("Full Name")}
          placeholder={`${isEditable ? t("Enter full name") : ""}`}
          type="text"
          value={formData.fullName}
          disabled={!isEditable}
          onChange={(value) => handleChange("fullName", value)}
        />
        <TextInput
          label={t("Phone")}
          placeholder={`${isEditable ? t("Enter phone number") : ""}`}
          type="text"
          value={formData.phone}
          disabled={!isEditable}
          onChange={(value) => handleChange("phone", value)}
        />
        <TextInput
          label={t("Address")}
          placeholder={`${isEditable ? t("Enter address") : ""}`}
          type="text"
          value={formData.address}
          disabled={!isEditable}
          onChange={(value) => handleChange("address", value)}
        />
      </div>
      {isEditable && (
        <GenericButton
          className="ml-auto"
          variant="primary"
          size="sm"
          onClick={handleSave}
        >
          {t("Save")}
        </GenericButton>
      )}
    </ItemContainer>
  );
};
export default PersonalDetails;
