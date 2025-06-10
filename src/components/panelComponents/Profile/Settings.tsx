import { useTranslation } from "react-i18next";

import { useGeneralContext } from "../../../context/General.context";
import { languageOptions, RowPerPageEnum } from "../../../types";
import { useGetUser, useUserMutations } from "../../../utils/api/user";
import CommonSelectInput from "../../common/SelectInput";

const Settings = () => {
  const { t, i18n } = useTranslation();
  const { updateUser } = useUserMutations();
  const { setRowsPerPage } = useGeneralContext();
  const user = useGetUser();
  if (!user) {
    return null;
  }
  return (
    <div className="w-5/6 sm:w-1/2 flex flex-col gap-2 px-4 py-4 border border-gray-200 rounded-lg bg-white shadow-sm mx-auto __className_a182b8 ">
      <CommonSelectInput
        label={t("Language")}
        value={{
          value: user.language ?? languageOptions[0].code,
          label:
            languageOptions.find(
              (languageOption) => languageOption.code === user.language
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
          if (!selectedOption?.value) return;
          updateUser({
            id: user._id,
            updates: {
              rowsPerPage: Number(selectedOption?.value),
            },
          });
          setRowsPerPage(Number(selectedOption?.value));
        }}
      />
      {/* <TextInput
        type={InputTypes.CHECKBOX}
        value={user?.settings?.orderCategoryOn ?? false}
        label={t("Order Category On")}
        onChange={(val) => {
          updateUser({
            id: user._id,
            updates: {
              settings: {
                orderCategoryOn: !user?.settings?.orderCategoryOn ?? true,
              },
            },
          });
        }}
      /> */}
    </div>
  );
};

export default Settings;
