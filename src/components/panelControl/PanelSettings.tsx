import { useTranslation } from "react-i18next";
import {
  createPanelSettings,
  useGetPanelSettings,
} from "../../utils/api/panelControl/panelSettings";
import TextInput from "../panelComponents/FormElements/TextInput";
import { InputTypes } from "../panelComponents/shared/types";

const PanelSettings = () => {
  const { t } = useTranslation();
  const panelSettigns = useGetPanelSettings();

  return (
    <div className="w-5/6 sm:w-1/3 flex flex-col gap-2 px-4 py-4 border border-gray-200 rounded-lg bg-white shadow-sm mx-auto __className_a182b8 ">
      <TextInput
        type={InputTypes.CHECKBOX}
        label={t("Today is Holiday")}
        placeholder={t("Today is Holiday")}
        isTopFlexRow={true}
        value={panelSettigns?.isHoliday ?? false}
        onChange={(value) => {
          createPanelSettings({ isHoliday: value });
        }}
      />
    </div>
  );
};

export default PanelSettings;
