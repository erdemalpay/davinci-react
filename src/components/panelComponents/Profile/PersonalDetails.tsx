import { useState } from "react";
import { User } from "../../../types";
import { useUserMutations } from "../../../utils/api/user";
import TextInput from "../FormElements/TextInput";
import { H4, P2 } from "../Typography";
import ItemContainer from "../common/ItemContainer";

type Props = {
  isEditable: boolean;
  user: User;
};

const PersonalDetails = ({ isEditable, user }: Props) => {
  const { updateUser } = useUserMutations();

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
        <H4>Personal Details</H4>
        {isEditable && (
          <P2>To change your personal detail, edit and save from here</P2>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextInput
          label="Full Name"
          placeholder={`${isEditable ? "Enter full name" : ""}`}
          type="text"
          value={formData.fullName}
          disabled={!isEditable}
          onChange={(value) => handleChange("fullName", value)}
        />
        <TextInput
          label="Phone"
          placeholder={`${isEditable ? "Enter phone number" : ""}`}
          type="text"
          value={formData.phone}
          disabled={!isEditable}
          onChange={(value) => handleChange("phone", value)}
        />
        <TextInput
          label="Address"
          placeholder={`${isEditable ? "Enter address" : ""}`}
          type="text"
          value={formData.address}
          disabled={!isEditable}
          onChange={(value) => handleChange("address", value)}
        />
      </div>
      {isEditable && (
        <button
          className="w-fit bg-blue-500 hover:bg-blue-600 text-white text-sm py-2 px-3 rounded-md ml-auto"
          onClick={handleSave}
        >
          Save
        </button>
      )}
    </ItemContainer>
  );
};
export default PersonalDetails;
