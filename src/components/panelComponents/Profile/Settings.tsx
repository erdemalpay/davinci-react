import { format } from "date-fns";
import { useTranslation } from "react-i18next";

import { useGeneralContext } from "../../../context/General.context";
import { languageOptions, RoleEnum, RowPerPageEnum } from "../../../types";
import { getRefId } from "../../../utils/getItem";
import { useGetUser, useUserMutations } from "../../../utils/api/user";
import CommonSelectInput from "../../common/SelectInput";
import TextInput from "../FormElements/TextInput";
import { InputTypes } from "../shared/types";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { updateUser } = useUserMutations();
  const { setRowsPerPage } = useGeneralContext();
  const user = useGetUser();
  // Managers can ask for game master calls; it holds for the day only.
  const today = format(new Date(), "yyyy-MM-dd");
  const isManager = !!user?.role && getRefId(user.role) === RoleEnum.MANAGER;
  const isInGameAssignmentsToday =
    user?.settings?.includeInGameAssignmentsDate === today;
  return (
    <div className="w-5/6 sm:w-1/2 flex flex-col gap-4 px-4 py-4 border border-gray-200 rounded-lg bg-white shadow-sm mx-auto __className_a182b8 ">
      <CommonSelectInput
        label={t("Language")}
        value={{
          value: user?.language ?? languageOptions[0].code,
          label:
            languageOptions.find(
              (languageOption) => languageOption.code === user?.language
            )?.label ?? languageOptions[0].label,
        }}
        options={languageOptions.map((languageOption) => {
          return {
            value: languageOption.code,
            label: languageOption.label,
          };
        })}
        placeholder={t("Language")}
        onChange={(selectedOption) => {
          if (!user?._id) return;
          updateUser({
            id: user._id,
            updates: {
              language: selectedOption?.value,
            },
          });
          i18n.changeLanguage(selectedOption?.value ?? languageOptions[0].code);
        }}
      />
      <CommonSelectInput
        label={t("Rows Per Page")}
        value={{
          value:
            user?.rowsPerPage?.toString() ?? RowPerPageEnum.FIRST.toString(),
          label: user?.rowsPerPage
            ? user?.rowsPerPage?.toString() !== RowPerPageEnum.ALL.toString()
              ? user?.rowsPerPage?.toString()
              : "All"
            : RowPerPageEnum.FIRST.toString(),
        }}
        options={Object.entries(RowPerPageEnum)
          .filter(([key, value]) => isNaN(Number(key)))
          .map(([key, value]) => {
            return {
              value: value.toString(),
              label: value === RowPerPageEnum.ALL ? "All" : value.toString(),
            };
          })}
        onChange={(selectedOption) => {
          if (!selectedOption?.value || !user?._id) return;
          updateUser({
            id: user._id,
            updates: {
              rowsPerPage: Number(selectedOption?.value),
            },
          });
          setRowsPerPage(Number(selectedOption?.value));
        }}
      />
      <TextInput
        type={InputTypes.CHECKBOX}
        value={user?.settings?.orderCategoryOn ?? false}
        label={t("Order Category On")}
        onChange={(val) => {
          if (!user?._id) return;
          updateUser({
            id: user._id,
            updates: {
              settings: {
                ...user?.settings,
                orderCategoryOn: !user?.settings?.orderCategoryOn,
              },
            },
          });
        }}
      />
      {isManager && (
        <TextInput
          type={InputTypes.CHECKBOX}
          value={isInGameAssignmentsToday}
          label={t("Include me in game assignments today")}
          onChange={() => {
            if (!user?._id) return;
            updateUser({
              id: user._id,
              updates: {
                settings: {
                  ...user?.settings,
                  includeInGameAssignmentsDate: isInGameAssignmentsToday
                    ? ""
                    : today,
                },
              },
            });
          }}
        />
      )}
    </div>
  );
};

export default Settings;
