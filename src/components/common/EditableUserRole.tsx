import { Chip, Tooltip } from "@material-tailwind/react";
import { FormEvent, useState } from "react";
import { Role } from "../../types";
import { useGetAllUserRoles, useUserMutations } from "../../utils/api/user";
import { Autocomplete } from "./Autocomplete";

interface Props {
  userId: string;
  item: Role;
  type?: string;
  inactiveStyle?: string;
}

export function EditableUserRole<T>({ userId, item, inactiveStyle }: Props) {
  const [isEditActive, setIsEditActive] = useState(false);
  const roles = useGetAllUserRoles();
  const { updateUser } = useUserMutations();

  return !isEditActive ? (
    <Tooltip content="Click to edit">
      <span
        className={`cursor-pointer h-full border-0 border-gray-300 flex items-center ${inactiveStyle}`}
        onClick={() => {
          setIsEditActive(true);
        }}
      >
        <Chip
          key={item?._id}
          value={item?.name || ""}
          style={{ backgroundColor: item?.color }}
        />
      </span>
    </Tooltip>
  ) : (
    <Autocomplete
      suggestions={roles}
      label="Role"
      handleSelection={(item) => {
        if (!item) return;
        updateUser({ id: userId, updates: { role: item } });
        setIsEditActive(false);
      }}
      className="w-[100px]"
      showSelected
    />
  );
}
