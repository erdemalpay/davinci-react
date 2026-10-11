import { useState } from "react";
import { useTranslation } from "react-i18next";
import { MinimalUser } from "../../utils/api/user";
import CommonSelectInput from "../common/SelectInput";

type Props = {
  users: MinimalUser[];
  // The manager themself, selected to start with.
  currentUserId: string;
  isInCafe: (userId: string) => boolean;
  onConfirm: (userId: string) => void;
  onCancel: () => void;
};

// A manager checks anyone in (or out, if they're already in the cafe).
export function ManagerCheckInDialog({
  users,
  currentUserId,
  isInCafe,
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [selectedUserId, setSelectedUserId] = useState(currentUserId);
  const selectedUser = users.find((u) => u._id === selectedUserId);
  const isCheckOut = isInCafe(selectedUserId);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("Who is checking in?")}
        className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="mb-4 text-lg font-semibold text-gray-800">
          {t("Who is checking in?")}
        </h3>
        <CommonSelectInput
          label={t("User")}
          options={users
            .map((u) => ({ value: u._id, label: u.name }))
            .sort((a, b) => a.label.localeCompare(b.label))}
          value={
            selectedUser
              ? { value: selectedUser._id, label: selectedUser.name }
              : null
          }
          onChange={(option) => option && setSelectedUserId(option.value)}
          placeholder={t("User")}
        />
        <button
          disabled={!selectedUser}
          onClick={() => onConfirm(selectedUserId)}
          className={`mt-4 w-full rounded-lg px-4 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50 ${
            isCheckOut
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {isCheckOut ? t("Check out") : t("Check in")}
        </button>
        <button
          onClick={onCancel}
          className="mt-2 w-full rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          {t("Cancel")}
        </button>
      </div>
    </div>
  );
}
