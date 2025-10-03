import { useTranslation } from "react-i18next";
import { useOrderContext } from "../../../../context/Order.context";
import { useGetMemberships } from "../../../../utils/api/membership";
import { formatDate } from "../../../../utils/dateUtil";
import SelectInput from "../../../panelComponents/FormElements/SelectInput";
import { H6 } from "../../../panelComponents/Typography";
import OrderScreenHeader from "./OrderScreenHeader";

const DiscountNoteScreen = () => {
  const { discountNote, setDiscountNote, selectedDiscount } = useOrderContext();
  const members = useGetMemberships();
  const MEMBERDISCOUNTID = 8;
  const memberOptions =
    members
      ?.filter((membership) => membership.endDate >= formatDate(new Date()))
      ?.map((membership) => ({
        value: membership._id,
        label: membership.name,
      })) || [];
  const { t } = useTranslation();
  return (
    <div className="flex flex-col h-[60%] overflow-scroll no-scrollbar  ">
      <div className="px-2 ">
        <OrderScreenHeader header="Discounts" />
        {/* note */}
        {selectedDiscount && selectedDiscount._id !== MEMBERDISCOUNTID && (
          <>
            <H6 className="min-w-10">{t("Discount Note")}</H6>
            <textarea
              value={discountNote}
              placeholder={t("Enter discount note")}
              onChange={(e) => setDiscountNote(e.target.value)}
              className="border text-base border-gray-300 rounded-md p-2 w-full h-32"
            />
          </>
        )}
        {selectedDiscount && selectedDiscount._id === MEMBERDISCOUNTID && (
          <SelectInput
            key={"discountNote"}
            value={
              memberOptions.find((option) => option.label === discountNote) ||
              null
            }
            options={memberOptions}
            placeholder={selectedDiscount?.note}
            onChange={(value) => setDiscountNote((value as any)?.label)}
          />
        )}
      </div>
    </div>
  );
};

export default DiscountNoteScreen;
