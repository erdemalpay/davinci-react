import { useTranslation } from "react-i18next";
import {
  createPanelSettings,
  useGetPanelSettings,
  useResetRedisMutation,
} from "../../utils/api/panelControl/panelSettings";
import TextInput from "../panelComponents/FormElements/TextInput";
import { GenericButton } from "../common/GenericButton";
import Loading from "../common/Loading";
import { InputTypes } from "../panelComponents/shared/types";

const PanelSettings = () => {
  const { t } = useTranslation();
  const panelSettigns = useGetPanelSettings();
  const { mutate: resetRedis, isPending: isResettingRedis } = useResetRedisMutation();
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
      <TextInput
        type={InputTypes.CHECKBOX}
        label={t("Close Visit Entry")}
        placeholder={t("Close Visit Entry")}
        isTopFlexRow={true}
        value={panelSettigns?.isVisitEntryDisabled ?? false}
        onChange={(value) => {
          createPanelSettings({ isVisitEntryDisabled: value });
        }}
      />
      <GenericButton
        variant="primary"
        size="sm"
        onClick={() => resetRedis()}
      >
        {t("Reset Redis")}
      </GenericButton>
      {isResettingRedis && <Loading />}
    </div>
  );
};

export default PanelSettings;
